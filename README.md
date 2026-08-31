# AquaLux Auto Spa - Complete Vehicle Wash Center System

This project contains the responsive frontend, Flask backend and SQLite database for the **AI-Assisted Vehicle Wash Center Management System**.

## Technologies
- Python
- Flask
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

Default service hours are 08:00–18:00, Monday to Saturday. Admin can change the opening and closing times from System Settings, while Sunday remains closed. Package
prices and times changed by an administrator are reflected by Home and the AI
through the shared SQLite catalogue. Payment prices are loaded from the booked
package and cannot be replaced by a separately typed amount.

## How to Run
### Easy Windows method
1. Extract the ZIP file.
2. Open the extracted `26.vehicle-wash-center-frontend` folder.
3. Double-click `START-AQUALUX.bat`.
4. On the first run, allow the launcher to create `.venv` and install Flask.
5. Keep the black server window open while using the system.
6. The correct login page opens automatically.

The ZIP intentionally does not contain `.venv`. A virtual environment contains
computer- and folder-specific paths, so `START-AQUALUX.bat` creates a clean one
inside the extracted folder. If an incomplete `.venv` is ever found, the
launcher repairs it automatically.

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
- Explainable AI vehicle-condition scoring and package recommendation
- Historical seven-day demand and waiting-time forecast
- Customer feedback collection for recommendation monitoring
- Admin AI performance and data-quality dashboard
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

## Explainable AI Vehicle Care Advisor

The customer and staff advisors use vehicle type, dirt level, interior-cleaning
need, special condition, last-wash age, usage, budget and preferred date. The
result shows a 0–100 condition score, urgency, official catalogue package,
reasons for the recommendation, next suggested wash date, predicted demand and
estimated waiting time.

The demand forecast is a transparent historical weekday estimate calculated
from SQLite booking records. It is not presented as a trained machine-learning
model. Every forecast includes its method, sample size and data-quality label.
Sunday remains closed and is never suggested as an available service day.

Customers can mark a recommendation as helpful or not helpful. Administrators
can review recommendation volume, feedback coverage, weekday demand, vehicle
activity and model-readiness on `pages/admin/ai-insights.html`. The dashboard
does not invent an accuracy percentage; accuracy remains unavailable until a
suitable labelled evaluation dataset exists.

The scoring and forecasting details are documented in
`docs/AI_VEHICLE_CARE_ADVISOR.md`.

## Dataset and AI Data Sources

AquaLux does **not** use a downloaded third-party customer dataset or claim that the current advisor is a trained machine-learning model. The project starts with synthetic/demo records created for development and testing, then stores new customers, vehicles, bookings, payments, AI requests and recommendation feedback in SQLite as the system is used.

The current AI Vehicle Care Advisor uses transparent rules for its condition score and package advice. The demand estimate uses historical AquaLux booking records grouped by weekday. Because a suitable labelled evaluation dataset is not yet available, the system does not display a made-up model accuracy percentage.

Sri Lankan vehicle statistics and local vehicle-care services were reviewed to make the prototype fields and workflow realistic. These online sources support the project context; they were not copied as individual customer or booking records.

Full dataset provenance, limitations and online references are documented in [`docs/DATASET_REFERENCES.md`](docs/DATASET_REFERENCES.md).

## Verification

After installing the requirements, run `python tests/test_system.py` from the
project folder. The tests verify login, role access, database CRUD, booking
conflict prevention, payments, reports, explainable recommendations, feedback,
AI performance data, availability and Sunday closure.

## Login troubleshooting
- `customer / customer123` opens the protected customer AI workspace.
- Newly registered customers also open the protected AI page.
- If the page reports that the server is offline, run `START-AQUALUX.bat`, keep the black window open, and select **Retry** on the login page.
- The sign-in button remains available and automatically checks the server again before submitting credentials.
- If Windows reports a damaged Python environment, close old AquaLux/Python
  windows and run `START-AQUALUX.bat` again; the launcher will rebuild `.venv`.
- Internet access is normally required only when Flask is installed on the
  first run.
