#!/usr/bin/env bash
# Exit on error
set -o errexit


echo "Running database migrations..."
python manage.py migrate

echo "Starting the Celery background worker..."
celery -A core worker --loglevel=info &

echo "Starting the Django web server..."
gunicorn core.wsgi:application