from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Event

User = get_user_model()

class EventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.username',read_only=True)

    class Meta:
        model = Event
        fields = ('id','title','start_time','total_capacity','organizer','organizer_name')
        read_only_fields = ('organizer',)