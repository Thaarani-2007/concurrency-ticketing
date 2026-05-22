# ticketing/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_ticket_confirmation(user_email, event_title, seat_number, booking_id):
    logger.info(f"Starting background email task for {user_email}...")
    
    subject = f"Your Ticket for {event_title} is Confirmed!"
    message = f"""
    Hello!
    
    Your payment was successful. Your seat is officially locked in!
    
    Event: {event_title}
    Seat Number: {seat_number}
    Booking Reference: {booking_id}
    
    See you at the event!
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user_email],
            fail_silently=False,
        )
        return f"Success: Email sent to {user_email}"
    except Exception as e:
        logger.error(f"Failed to send email to {user_email}: {str(e)}")
        return "Failed"