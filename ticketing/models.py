from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid
from django.db.models.signals import post_save
from django.dispatch import receiver

# 1. Custom User Model for Role-Gated Access
class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    ROLE_CHOICES = (
        ('CUSTOMER', 'Customer'),
        ('ORGANIZER', 'Organizer'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CUSTOMER')
    
    def __str__(self):
        return self.username
# 2. Event Model
class Event(models.Model):
    # Core Identifiers
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    short_description = models.CharField(max_length=255, null=True, blank=True)
    
    # Categorization
    CATEGORY_CHOICES = (
        ('TECH', 'Technology'), ('MUSIC', 'Music'), ('SPORTS', 'Sports'), 
        ('BUSINESS', 'Business'), ('WORKSHOP', 'Workshop'), ('OTHER', 'Other')
    )
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='OTHER')
    language = models.CharField(max_length=50, default='English')
    age_restriction = models.CharField(max_length=50, default='All Ages', help_text="e.g., 18+, 21+, All Ages")
    
    # Media
    thumbnail = models.ImageField(upload_to='event_covers/', null=True, blank=True)
    
    # Date & Time
    start_time = models.DateTimeField()
    end_datetime = models.DateTimeField(null=True, blank=True)
    timezone = models.CharField(max_length=100, default='UTC', help_text="e.g., Asia/Kolkata, UTC")
    
    # Location & Mode
    MODE_CHOICES = (('ONLINE', 'Online'), ('OFFLINE', 'Offline'), ('HYBRID', 'Hybrid'))
    event_mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='OFFLINE')
    venue_name = models.CharField(max_length=255, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)
    meeting_link = models.URLField(max_length=500, null=True, blank=True) # For Online/Hybrid
    
    # Ticketing Math
    total_capacity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Organizer Information (Linked user + display details)
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organized_events')
    organizer_name = models.CharField(max_length=255, null=True, blank=True)
    organizer_email = models.EmailField(null=True, blank=True)
    organizer_phone = models.CharField(max_length=20, null=True, blank=True)
    organizer_website = models.URLField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.title
class Booking(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    tickets_count = models.PositiveIntegerField(default=1) # How many tickets they bought
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    # --- RAZORPAY TRACKING FIELDS ---
    razorpay_order_id = models.CharField(max_length=100, null=True, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, null=True, blank=True)
    razorpay_signature = models.CharField(max_length=255, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking {self.id} by {self.user.username}"
class OrganizerApplication(models.Model):
    STATUS_CHOICES = (
        ('PENDING','pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    user = models.OneToOneField(User,on_delete = models.CASCADE,related_name='organizer_application')    
    company_name = models.CharField(max_length=255)
    tax_id_or_website = models.CharField(max_length=255)
    status=models.CharField(max_length=20,choices=STATUS_CHOICES,default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    def save(self, *args, **kwargs):
        # Check if the object already exists in the database
        if self.pk is not None:
            # Get the old version from the database
            old_version = OrganizerApplication.objects.get(pk=self.pk)
            # If it just changed to APPROVED...
            if old_version.status != 'APPROVED' and self.status == 'APPROVED':
                # Upgrade the user!
                self.user.role = 'ORGANIZER'
                self.user.save()
        
        super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.company_name} - {self.status}"

# 4. Ticket Model (Where the Concurrency Magic Happens)
class Ticket(models.Model):
    class StatusChoices(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        RESERVED = 'RESERVED', 'Reserved'
        BOOKED = 'BOOKED', 'Booked'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='tickets')
    seat_number = models.CharField(max_length=10)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.AVAILABLE)
    reserved_until = models.DateTimeField(null=True, blank=True)
    
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    booking = models.ForeignKey(Booking, null=True, blank=True, on_delete=models.SET_NULL, related_name='tickets')

    class Meta:
        unique_together = ('event', 'seat_number')
        indexes = [
            models.Index(fields=['status', 'event']),
        ]

    def __str__(self):
        return f"{self.event.title} - Seat {self.seat_number}"
@receiver(post_save, sender=Event)
def create_tickets_for_event(sender, instance, created, **kwargs):
    if created:
        # Notice we changed '_' to 'i', and range to start at 1
        tickets_to_create = [
            Ticket(
                event=instance, 
                seat_number=str(i), # Assigns "1", "2", "3", etc.
                status='AVAILABLE'
            )
            for i in range(1, instance.total_capacity + 1)
        ]
        
        Ticket.objects.bulk_create(tickets_to_create)

