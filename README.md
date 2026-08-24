# AquaLux Auto Spa - Complete Vehicle Wash Center System

This project contains the responsive frontend, Flask backend and SQLite database for the **AI-Assisted Vehicle Wash Center Management System**.

## Technologies
- HTML
- CSS
- JavaScript
- SQLite relational database

## Demo Login
- Admin: `admin` / `admin123`
- Staff: `staff` / `staff123`
- Customer: `customer` / `customer123`

## Service Catalogue

The Home page, AI advisor, booking forms, package management, payments,
receipts and reports all use the same live catalogue:

- Bike Basic Wash — LKR 7,500 — 2 hours
- Car Standard Wash — LKR 15,000 — 3 hours
- Van Full Wash — LKR 20,000 — 4 hours
- SUV Full Wash — LKR 22,500 — 4 hours

Service hours are 08:00–18:00, Monday to Saturday. Sunday is closed. Package
prices and times changed by an administrator are reflected by Home and the AI
through the shared SQLite catalogue. Payment prices are loaded from the booked
package and cannot be replaced by a separately typed amount.

## How to Run
### Easy Windows method
1. Extract the ZIP file.
2. Open the `vehicle-wash-center-frontend` folder.
3. Double-click `START-AQUALUX.bat`.
4. Keep the black server window open.
5. The correct login page opens automatically.

Do not double-click `login.html` and do not use Live Server for login. The
authentication session must run from `http://127.0.0.1:5000`.

### Terminal method
1. Open the project folder in VS Code.
2. Run `python -m pip install -r requirements.txt`.
3. Run `python server.py`.
4. Open `http://127.0.0.1:5000/login.html`.

## Main Modules
- Login and role redirection
- Admin dashboard
- Staff dashboard
- Customer and vehicle management
- Wash package management
- Booking management
- Payment and receipt pages
- Daily and weekly reports
- Rule-based AI package recommendation using the live service catalogue
- Flask AI recommendation API
- AquaLux natural-language AI chat assistant
- Busy-day prediction using stored booking records
- Automatic vehicle-image changes based on the selected vehicle type
- Customer registration with SQLite storage
- Hashed passwords and server-side login sessions
- Protected customer AI pages and saved AI request history
- Server-side admin, staff and customer role protection
- Database-backed customers, vehicles, packages, bookings and payments
- Duplicate active booking-slot prevention
- Live dashboard totals and daily/weekly reports
- Customer self-booking and personal booking history

## Customer AI Access

1. A new customer creates an account from `register.html`.
2. The customer signs in through `login.html`.
3. Flask redirects the customer to `customer-ai.html`.
4. The AI form and chat assistant are available only while the session is authenticated.

The SQLite file `data/aqualux.db` is created automatically when `server.py` starts.

## Verification

After installing the requirements, run `python tests/test_system.py` from the project folder. The tests verify login, access control, database CRUD, booking conflict prevention, payments, reports and AI authentication.

## Login troubleshooting
- `customer / customer123` opens the protected customer AI workspace.
- Newly registered customers also open the protected AI page.
- If the page reports that the server is offline, run `START-AQUALUX.bat`, keep the black window open, and select **Retry** on the login page.
- The sign-in button remains available and automatically checks the server again before submitting credentials.
