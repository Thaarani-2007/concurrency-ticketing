from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ticketing.views import test_email_trigger
from .views import (
    EventViewSet, GoogleLoginView, SubmitApplicationView, 
    ApproveApplicationView, RegisterView, PublicEventListView, 
    OrganizerEventsView, OrganizerEventDetailView, CustomTokenObtainPairView,
    LockSeatView, ConfirmSeatView ,TicketStatusView
)
router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    # 1. SPECIFIC AUTH ROUTES
    path('auth/google/', GoogleLoginView.as_view(), name='google-login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    path('events/me/', OrganizerEventsView.as_view(), name='my-events'),
    path('events/', PublicEventListView.as_view(), name='public-events'),
    path('events/me/<uuid:pk>/', OrganizerEventDetailView.as_view(), name='my-event-detail'),
    
    path('tickets/<uuid:ticket_id>/lock/', LockSeatView.as_view(), name='lock-seat'),
    path('tickets/<uuid:ticket_id>/confirm/', ConfirmSeatView.as_view(), name='confirm-seat'),
    path('tickets/<uuid:ticket_id>/status/', TicketStatusView.as_view(), name='ticket-status'), 
    # 4. ADMIN ROUTES
    path('apply/', SubmitApplicationView.as_view(), name='submit_application'),
    path('admin/applications/<int:application_id>/approve/', ApproveApplicationView.as_view(), name='approve_application'),
    path('test-email/', test_email_trigger),
    # 5. THE CATCH-ALL ROUTER
    path('', include(router.urls)),
]