from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Event, Ticket,User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
User = get_user_model()

class EventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.username',read_only=True)

    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['organizer', 'tickets_sold']
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        # Get the standard token with the user_id
        token = super().get_token(user)

        # Add your custom claims (data) to the token payload!
        token['role'] = user.role
        token['email'] = user.email
        token['username'] = user.username

        return token
class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['id','seat_number','status']     

class RegisterSerializer(serializers.ModelSerializer):
    # Make password write-only so it never accidentally gets sent back to the frontend!
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        # create_user is a magic Django function that automatically hashes the password!
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
            # Notice we don't set the role here! 
            # Your models.py default='CUSTOMER' handles that securely for us.
        )
        return user
