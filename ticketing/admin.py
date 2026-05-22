from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Event, OrganizerApplication

# 1. We customize the User admin so your new 'role' dropdown actually shows up!
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Role Management', {'fields': ('role',)}),
    )

# 2. Register all the tables to the dashboard
admin.site.register(User, CustomUserAdmin)
admin.site.register(OrganizerApplication)
admin.site.register(Event)