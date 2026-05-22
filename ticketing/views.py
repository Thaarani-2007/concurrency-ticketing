import logging
from rest_framework.response import Response
from django.core.cache import cache
from django.db import transaction
from django.db import models
from django.shortcuts import render,get_object_or_404
from .models import Event,Ticket,User,Booking
from .serializers import EventSerializer,TicketSerializer,RegisterSerializer,EventSerializer
from rest_framework.views import APIView
from rest_framework import viewsets, permissions, status,generics
from rest_framework.decorators import action
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, IsAdminUser , AllowAny
from .models import OrganizerApplication,Event
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from django.utils import timezone
from .tasks import send_ticket_confirmation
from datetime import timedelta
from django.contrib.auth import get_user_model
User = get_user_model()

class GoogleLoginView(APIView):
    permission_classes = []
    
    def post(self, request):
        token = request.data.get('credential')

        try:
            CLIENT_ID = "357139621858-hcq3etulbdanlc0hrfcuv2nmekqhcs2r.apps.googleusercontent.com"
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
            email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')

            user, created = User.objects.get_or_create(
                username=email, 
                defaults={'email': email, 'first_name': first_name, 'last_name': last_name}
            )
            refresh = RefreshToken.for_user(user)
            
            # --- UPDATED THIS DICTIONARY BELOW ---
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'is_new_user': created,
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                }
            }, status=status.HTTP_200_OK)
            # -------------------------------------
            
        except Exception as e:
            print("GOOGLE AUTH ERROR:", str(e))

            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
class IsOrganizerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_organizer)

from django.utils import timezone
from datetime import timedelta

# --- UPDATE THIS EXISTING VIEW ---
class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsOrganizerOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)
        
    @action(detail=True, methods=['get'])    
    def tickets(self, request, pk=None):
        event = self.get_object()
        
        # 1. CLEANUP EXPIRED LOCKS BEFORE SENDING TO REACT
        # If any seat's 5-minute timer is up, release it back to the public!
        expired_tickets = Ticket.objects.filter(
            event=event, 
            status='RESERVED', 
            reserved_until__lt=timezone.now()
        )
        expired_tickets.update(status='AVAILABLE', user=None, reserved_until=None)

        # 2. Send ALL tickets to React so we can draw the physical Seat Map Grid
        all_tickets = Ticket.objects.filter(event=event).order_by(
            models.functions.Cast('seat_number', models.IntegerField())
        )
        serializer = TicketSerializer(all_tickets, many=True)
        return Response(serializer.data)
class SubmitApplicationView(APIView):
    permission_classes = [IsAuthenticated] 

    def post(self, request):
        user = request.user
        
        if hasattr(user, 'organizer_application'):
            return Response({"error": "You have already submitted an application."}, status=status.HTTP_400_BAD_REQUEST)
        
        if user.role == 'ORGANIZER':
            return Response({"error": "You are already an organizer!"}, status=status.HTTP_400_BAD_REQUEST)

        application = OrganizerApplication.objects.create(
            user=user,
            company_name=request.data.get('company_name'),
            tax_id_or_website=request.data.get('tax_id_or_website')
        )
        
        return Response({"message": "Application submitted successfully! Please wait for admin approval."}, status=status.HTTP_201_CREATED)
    

class ApproveApplicationView(APIView):
    permission_classes = [IsAdminUser] 

    def post(self, request, application_id):
        try:
            application = OrganizerApplication.objects.get(id=application_id)
            
            if application.status == 'APPROVED':
                return Response({"error": "Already approved."}, status=status.HTTP_400_BAD_REQUEST)

            application.status = 'APPROVED'
            application.save()

            user = application.user
            user.role = 'ORGANIZER' 
            user.save()

            return Response({
                "message": f"Success! {user.email} is now an Organizer."
            }, status=status.HTTP_200_OK)

        except OrganizerApplication.DoesNotExist:
            return Response({"error": "Application not found."}, status=status.HTTP_404_NOT_FOUND)    
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny] 
    serializer_class = RegisterSerializer

class PublicEventListView(generics.ListAPIView):
    queryset = Event.objects.all().order_by('start_time') 
    serializer_class = EventSerializer
    permission_classes = [AllowAny]

class OrganizerEventsView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Change '-date' to '-start_time' (the minus sign means newest first!)
        return Event.objects.filter(organizer=self.request.user).order_by('-start_time')

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

class OrganizerEventDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # SECURITY CRITICAL: Ensure they can ONLY edit their own events!
        return Event.objects.filter(organizer=self.request.user)
    
# --- NEW: STEP 1 (THE REDIS & DB LOCK) ---
class LockSeatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id):
        # We use a Redis Lock to prevent 2 people from clicking the exact same seat at the exact same millisecond
        redis_lock_key = f"redis_lock_seat_{ticket_id}"
        if not cache.add(redis_lock_key, "locked", timeout=5):
            return Response({"error": "Someone else is clicking this seat right now!"}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        try:
            with transaction.atomic():
                # select_for_update guarantees no other database transaction can touch this row
                ticket = Ticket.objects.select_for_update().get(id=ticket_id)

                # Check if it's genuinely available
                if ticket.status == 'BOOKED':
                    return Response({"error": "Seat is already permanently booked."}, status=status.HTTP_400_BAD_REQUEST)
                
                if ticket.status == 'RESERVED' and ticket.reserved_until > timezone.now():
                    if ticket.user != request.user:
                        return Response({"error": "Seat is temporarily locked by another user."}, status=status.HTTP_400_BAD_REQUEST)

                # APPLY THE 5-MINUTE LOCK
                ticket.status = 'RESERVED'
                ticket.user = request.user
                ticket.reserved_until = timezone.now() + timedelta(minutes=5)
                ticket.save()

                return Response({
                    "message": "Seat locked for 5 minutes!",
                    "expires_at": ticket.reserved_until
                }, status=status.HTTP_200_OK)
        except Ticket.DoesNotExist:
            return Response({"error": "Seat not found."}, status=status.HTTP_404_NOT_FOUND)
        finally:
            cache.delete(redis_lock_key)

# --- NEW: STEP 2 (THE CONFIRMATION) ---
class ConfirmSeatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id):
        with transaction.atomic():
            ticket = Ticket.objects.select_for_update().get(id=ticket_id)

            # Security Check: Does this user actually own the lock?
            if ticket.user != request.user or ticket.status != 'RESERVED':
                return Response({"error": "You do not hold the lock for this seat."}, status=status.HTTP_403_FORBIDDEN)

            # Security Check: Did the lock expire while they were on the checkout page?
            if ticket.reserved_until < timezone.now():
                ticket.status = 'AVAILABLE'
                ticket.user = None
                ticket.reserved_until = None
                ticket.save()
                return Response({"error": "Your 5-minute reservation expired! Seat released."}, status=status.HTTP_408_REQUEST_TIMEOUT)

            event = ticket.event

            # 1. Process Dummy Payment & Create Booking
            booking = Booking.objects.create(
                user=request.user,
                event=event,
                total_price=event.price,
                tickets_count=1,
                status='SUCCESS'
            )

            # 2. Lock it permanently!
            ticket.status = 'BOOKED'
            ticket.booking = booking
            ticket.reserved_until = None # Clear the timer
            ticket.save()


            # 3. Update Master Event Capacity
            
            send_ticket_confirmation.delay(
                user_email=request.user.email,
                event_title=event.title,
                seat_number=ticket.seat_number,
                booking_id=str(booking.id)
            )

            return Response({
                "message": "Payment successful! Seat is yours permanently.",
                "booking_id": booking.id,
                "seat_number": ticket.seat_number
            }, status=status.HTTP_200_OK)
class CustomTokenObtainPairView(TokenObtainPairView):
    # Tell SimpleJWT to use our new, upgraded serializer
    serializer_class = CustomTokenObtainPairSerializer        
class TicketStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):
        try:
            # We don't need select_for_update here because we are just reading, not writing.
            ticket = Ticket.objects.get(id=ticket_id)

            # Scenario 1: The ticket is fully available
            if ticket.status == 'AVAILABLE':
                return Response({"status": "AVAILABLE"}, status=status.HTTP_200_OK)

            # Scenario 2: The ticket is permanently booked
            if ticket.status == 'BOOKED':
                return Response({"status": "BOOKED"}, status=status.HTTP_200_OK)

            # Scenario 3: The ticket is RESERVED (Locked)
            if ticket.status == 'RESERVED':
                # Sub-scenario A: It's locked, but the timer expired!
                if ticket.reserved_until < timezone.now():
                    # Let's be helpful and clean it up right now
                    ticket.status = 'AVAILABLE'
                    ticket.user = None
                    ticket.reserved_until = None
                    ticket.save()
                    return Response({"status": "AVAILABLE"}, status=status.HTTP_200_OK)

                # Sub-scenario B: It's actively locked! Who owns it?
                is_owner = (ticket.user == request.user)
                
                return Response({
                    "status": "RESERVED",
                    "is_owner": is_owner,
                    "expires_at": ticket.reserved_until
                }, status=status.HTTP_200_OK)

        except Ticket.DoesNotExist:
            return Response({"error": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)    