# 🎟️ High-Concurrency Ticket Booking System

A production-grade, decoupled full-stack application designed to handle high-traffic ticket reservations. This project demonstrates advanced backend engineering concepts, including database concurrency control, asynchronous background processing, and microservices architecture.

## 🚀 Live Demo
* **Frontend:** `https://ticketing-system-demo1.netlify.app/`
* **Backend API:** `https://concurrency-ticketing-1.onrender.com`

---

## 🏗️ System Architecture & Features

### 1. Database Concurrency & Seat Locking
Prevents race conditions and double-bookings during high-traffic surges. Utilizes PostgreSQL row-level locking (`select_for_update`) to temporarily hold a seat for a user. If the checkout is not completed within a specific timeframe, the lock automatically expires and releases the seat back to the pool.

### 2. Asynchronous Background Processing
Decouples heavy, blocking operations from the main web thread to ensure a non-blocking user experience. 
* **Message Broker:** Upstash Redis queues the tasks.
* **Background Worker:** A dedicated Celery worker processes the queue to execute third-party API calls, such as sending SMTP confirmation emails, without delaying the HTTP response to the client.

### 3. Secure Transactions & Authentication
* **Payments:** Integrated with Razorpay for secure, production-ready payment gateway processing.
* **Authentication:** Stateless session management utilizing JWT (JSON Web Tokens) and Google OAuth integration.

---


# 🚀 Full Project Setup Guide (Docker Version)

This guide will help you run the complete full-stack application using Docker.

---

# 📦 Clone the Repository

```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

---

# ⚙️ Backend Environment Variables

Create a `.env` file inside the `backend` directory.

## backend/.env

```env
SECRET_KEY=your_django_secret_key

DEBUG=True

DATABASE_URL=postgres://postgres:postgres@db:5432/ticketing_db

REDIS_URL=redis://redis:6379/0

EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_16_letter_app_password

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

# 🌐 Frontend Environment Variables

Create a `.env` file inside the `frontend` directory.

## frontend/.env

```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

---

# 🐳 Build & Start Docker Containers

Run the following command from the project root directory:

```bash
docker-compose up --build
```

---

# 📦 Services Running

The following containers will start automatically:

- Django Backend API
- React Frontend
- PostgreSQL Database
- Redis Server
- Celery Worker

---

# 🌍 Application URLs

## Frontend

```text
http://localhost:3000
```

## Backend API

```text
http://localhost:8000
```

## Django Admin

```text
http://localhost:8000/admin
```

---

# 🛢️ Run Database Migrations

After containers start, open a new terminal and run:

```bash
docker-compose exec backend python manage.py migrate
```

---

# 👤 Create Superuser

```bash
docker-compose exec backend python manage.py createsuperuser
```

---

# 🔥 Useful Docker Commands

## Start Containers

```bash
docker-compose up
```

---

## Rebuild Containers

```bash
docker-compose up --build
```

---

## Stop Containers

```bash
docker-compose down
```

---

## View Running Containers

```bash
docker ps
```

---

## Open Backend Container Shell

```bash
docker-compose exec backend bash
```

---

## Open Database Shell

```bash
docker-compose exec db psql -U postgres
```

---

# 🧰 Tech Stack

- Django
- Django REST Framework
- React
- PostgreSQL
- Redis
- Celery
- Docker
- Docker Compose
- Razorpay
- JWT Authentication

---

# 🛑 Common Issues

## Port Already in Use

Stop conflicting applications or change ports in `docker-compose.yml`.

---

## Database Connection Error

Ensure:

- PostgreSQL container is running
- Correct `DATABASE_URL`
- Migrations are executed

---

## Celery Worker Not Starting

Check:

- Redis container is running
- Correct `REDIS_URL`
- Celery service exists in `docker-compose.yml`

---

# 📌 Important Notes

- Never upload `.env` files to GitHub.
- Use Gmail App Passwords instead of your normal Gmail password.
- Make sure Docker Desktop is running before executing commands.

---

# 🎉 Setup Complete

Your  full-stack application should now be running successfully 🚀
