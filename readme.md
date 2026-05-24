# 🎟️ High-Concurrency Ticket Booking System

A production-grade, decoupled full-stack application designed to handle high-traffic ticket reservations. This project demonstrates advanced backend engineering concepts, including database concurrency control, asynchronous background processing, and microservices architecture.

## 🚀 Live Demo
* **Frontend:** [Insert Netlify URL here]
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

## 🛠️ Technology Stack

**Frontend**
* React.js
* Axios / Fetch API

**Backend**
* Python
* Django & Django REST Framework (DRF)
* Celery (Asynchronous Task Queue)

**Database & Cloud Storage**
* PostgreSQL (Relational Database)
* Upstash Redis (In-Memory Message Broker)
* Cloudinary (CDN for Media Storage)

**DevOps & Server Architecture**
* **Cloud Deployment:** Netlify (Frontend) & Render (Backend)
* **Server:** Gunicorn (WSGI)
* **Asset Pipeline:** WhiteNoise
* **CI/CD Automation:** Bash scripts (`build.sh`, `start.sh`) for container initialization and database migrations.

---

## 💻 Local Development Setup

Follow these steps to run the decoupled architecture on your local machine.

### Prerequisites
* Python 3.10+
* Node.js & npm
* Redis (Running locally or via Upstash)
* PostgreSQL

### Backend Setup (Django API + Celery)

1. **Clone the repository and navigate to the backend directory:**
   ```bash
   git clone [https://github.com/yourusername/your-repo-name.git](https://github.com/yourusername/your-repo-name.git)
   cd backend
Create and activate a virtual environment:

Bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
Install dependencies:

Bash
pip install -r requirements.txt
Environment Variables:
Create a .env file in the root directory and add your credentials:

Code snippet
SECRET_KEY=your_django_secret_key
DEBUG=True
DATABASE_URL=postgres://user:password@localhost:5432/ticketing_db
REDIS_URL=redis://localhost:6379/0
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_16_letter_app_password
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
Run Database Migrations:

Bash
python manage.py migrate
Start the Development Servers (Requires 2 terminal windows):

Terminal 1 (Django API):

Bash
python manage.py runserver
Terminal 2 (Celery Worker):

Bash
celery -A core worker --loglevel=info
Frontend Setup (React)
Navigate to the frontend directory:

Bash
cd frontend
Install node modules:

Bash
npm install
Environment Variables:
Create a .env file in the frontend root:

Code snippet
REACT_APP_API_BASE_URL=http://localhost:8000/api
Start the development server:

Bash
npm start
