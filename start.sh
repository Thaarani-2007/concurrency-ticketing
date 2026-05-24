#!/usr/bin/env bash
# Start the Celery worker in the background
celery -A core worker --loglevel=info &

# Start the Django web server in the foreground
gunicorn core.wsgi:application