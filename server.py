"""AquaLux Auto Spa - simple AI recommendation server.

This Flask server implements the rule-based AI feature described in the
project proposal. It also serves the existing HTML, CSS, JavaScript and image
files so the frontend and AI API can run together.
"""

import json
import os
import sqlite3
import secrets
import webbrowser
from collections import Counter
from datetime import date, timedelta
from functools import wraps
from pathlib import Path
from threading import Timer

from flask import Flask, abort, jsonify, redirect, request, send_from_directory, session
from werkzeug.security import check_password_hash, generate_password_hash

from catalog import CATALOG_BY_VEHICLE, format_duration


PROJECT_DIR = Path(__file__).resolve().parent
DATABASE_PATH = PROJECT_DIR / "data" / "aqualux.db"
app = Flask(__name__, static_folder=str(PROJECT_DIR), static_url_path="")
app.config.update(
    SECRET_KEY=os.environ.get("AQUALUX_SECRET_KEY") or secrets.token_hex(32),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
)


PACKAGE_RULES = CATALOG_BY_VEHICLE


def get_database():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def get_service_settings():
    """Read the administrator-controlled service details with safe defaults."""
    default = {
        "center_name": "AquaLux Auto Spa",
        "contact_number": "0755004526",
        "opening_time": "08:00",
        "closing_time": "18:00",
    }
    try:
        with get_database() as database:
            row = database.execute(
                """SELECT center_name, contact_number, opening_time, closing_time
                   FROM system_settings WHERE id = 1"""
            ).fetchone()
        return dict(row) if row else default
    except sqlite3.OperationalError:
        return default


@app.before_request
def block_sensitive_project_files():
    """Do not expose source code, the SQLite database or project metadata."""
    path = request.path.lower()
    blocked_prefixes = (
        "/data/", "/docs/", "/tests/", "/.git/", "/.vscode/",
    )
    blocked_files = {
        "/server.py", "/management.py", "/catalog.py", "/requirements.txt",
        "/readme.md", "/start-aqualux.bat", "/start-ai-server.bat", "/.gitignore",
    }
    if path.startswith(blocked_prefixes) or path in blocked_files:
        abort(404)


def init_database():
    """Create authentication tables and add the project demo accounts."""
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_database() as database:
        database.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                phone TEXT NOT NULL,
                vehicle_type TEXT,
                vehicle_number TEXT,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'customer',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_login TEXT
            );

            CREATE TABLE IF NOT EXISTS ai_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                request_type TEXT NOT NULL,
                message TEXT,
                vehicle_type TEXT,
                result_summary TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS ai_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                helpful INTEGER NOT NULL CHECK (helpful IN (0, 1)),
                comment TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (request_id, user_id),
                FOREIGN KEY (request_id) REFERENCES ai_requests(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
            """
        )

        demo_users = (
            ("System Administrator", "admin", "admin@aqualux.local", "0755004526", "admin123", "admin"),
            ("AquaLux Staff", "staff", "staff@aqualux.local", "0755004527", "staff123", "staff"),
        )
        for full_name, username, email, phone, password, role in demo_users:
            database.execute(
                """
                INSERT OR IGNORE INTO users
                    (full_name, username, email, phone, password_hash, role)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (full_name, username, email, phone, generate_password_hash(password), role),
            )

        database.execute(
            """
            INSERT OR IGNORE INTO users
                (full_name, username, email, phone, vehicle_type, vehicle_number, password_hash, role)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'customer')
            """,
            (
                "Demo Customer",
                "customer",
                "customer@aqualux.local",
                "0771234567",
                "Car",
                "DEMO-1234",
                generate_password_hash("customer123"),
            ),
        )


def login_required(function):
    """Reject protected API requests when no authenticated session exists."""
    @wraps(function)
    def protected(*args, **kwargs):
        if request.method == "OPTIONS":
            return function(*args, **kwargs)
        if not session.get("user_id"):
            return jsonify(error="Please sign in to use AquaLux AI."), 401
        return function(*args, **kwargs)

    return protected


def record_ai_request(request_type, message="", vehicle_type="", result_summary=""):
    """Store AI usage against the authenticated customer account."""
    user_id = session.get("user_id")
    if not user_id:
        return None
    with get_database() as database:
        cursor = database.execute(
            """
            INSERT INTO ai_requests
                (user_id, request_type, message, vehicle_type, result_summary)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, request_type, message, vehicle_type, result_summary),
        )
        return cursor.lastrowid


def calculate_condition_profile(
    dirt_level: str,
    interior: str,
    special_condition: str,
    days_since_wash: int,
    usage: str,
    budget: str,
    package_price: float,
) -> dict:
    """Return a transparent 0-100 care score and the rules behind it."""
    score = {"Low": 15, "Medium": 35, "High": 55}[dirt_level]
    reasons = [f"{dirt_level.lower()} exterior dirt contributes to the care score."]

    if interior == "Yes":
        score += 12
        reasons.append("Interior cleaning was requested.")

    condition_points = {
        "None": 0,
        "Mud": 15,
        "Water Spots": 8,
        "Stains": 12,
    }
    score += condition_points[special_condition]
    if special_condition != "None":
        reasons.append(f"The customer reported {special_condition.lower()} on the vehicle.")

    if days_since_wash > 45:
        score += 22
        reasons.append(f"The vehicle has not been washed for {days_since_wash} days.")
    elif days_since_wash > 21:
        score += 15
        reasons.append(f"It has been {days_since_wash} days since the previous wash.")
    elif days_since_wash > 7:
        score += 8
        reasons.append(f"The previous wash was {days_since_wash} days ago.")
    else:
        reasons.append("The vehicle was washed recently.")

    usage_points = {"Occasional": 2, "Weekly": 6, "Daily": 10}
    score += usage_points[usage]
    reasons.append(f"Vehicle usage is recorded as {usage.lower()}.")
    score = min(100, score)

    if score >= 70:
        level = "Deep care recommended"
        urgency = "High"
        advice = "Book the recommended wash soon and avoid allowing mud or stains to remain on the finish."
    elif score >= 40:
        level = "Standard care recommended"
        urgency = "Medium"
        advice = "The vehicle is ready for its normal AquaLux wash cycle."
    else:
        level = "Light care required"
        urgency = "Low"
        advice = "A routine wash is suitable; no urgent deep-cleaning indicators were selected."

    budget_ceiling = {
        "Any": None,
        "Under 10000": 10000,
        "10000-20000": 20000,
        "Above 20000": None,
    }[budget]
    within_budget = budget_ceiling is None or package_price <= budget_ceiling
    budget_note = (
        "The catalogue price is compatible with the selected budget range."
        if within_budget
        else "The catalogue package is above the selected budget; AquaLux keeps the official package price unchanged."
    )

    reminder_days = {"Daily": 14, "Weekly": 21, "Occasional": 30}[usage]
    if dirt_level == "High" or special_condition in {"Mud", "Stains"}:
        reminder_days = min(reminder_days, 10)

    return {
        "score": score,
        "level": level,
        "urgency": urgency,
        "reasons": reasons,
        "careAdvice": advice,
        "budget": budget,
        "withinBudget": within_budget,
        "budgetNote": budget_note,
        "nextWashInDays": reminder_days,
        "nextWashDate": (date.today() + timedelta(days=reminder_days)).isoformat(),
    }


def get_weekday_booking_counts() -> tuple[Counter, dict]:
    """Return operating-day totals and individual date totals from SQLite."""
    weekday_counts = Counter()
    daily_counts = Counter()
    try:
        with get_database() as database:
            rows = database.execute(
                """SELECT booking_date FROM bookings
                   WHERE status != 'Cancelled' AND strftime('%w', booking_date) != '0'"""
            ).fetchall()
        for row in rows:
            booking_date = date.fromisoformat(row["booking_date"])
            weekday_counts[booking_date.strftime("%A")] += 1
            daily_counts[booking_date.isoformat()] += 1
    except (sqlite3.OperationalError, TypeError, ValueError):
        pass
    return weekday_counts, dict(daily_counts)


def build_demand_forecast(preferred_date: date) -> dict:
    """Estimate demand from stored weekday history without claiming ML accuracy."""
    if preferred_date.weekday() == 6:
        return {
            "date": preferred_date.isoformat(),
            "day": "Sunday",
            "serviceOpen": False,
            "demandLevel": "Closed",
            "expectedBookings": 0,
            "estimatedWaitMinutes": 0,
            "sampleSize": 0,
            "dataQuality": "Not applicable",
            "method": "AquaLux operating-hours rule",
            "reason": "Sunday is the AquaLux closed day, so bookings and waiting-time estimates are not offered.",
            "bestAlternativeDay": "Tuesday",
        }

    weekday_counts, daily_counts = get_weekday_booking_counts()
    selected_day = preferred_date.strftime("%A")
    matching_counts = []
    for raw_date, count in daily_counts.items():
        try:
            if date.fromisoformat(raw_date).strftime("%A") == selected_day:
                matching_counts.append(count)
        except ValueError:
            continue

    historical_average = (
        sum(matching_counts) / len(matching_counts)
        if matching_counts
        else 0
    )
    exact_count = daily_counts.get(preferred_date.isoformat(), 0)
    expected = max(exact_count, round(historical_average))

    if expected >= 8:
        demand_level = "Peak"
    elif expected >= 6:
        demand_level = "Busy"
    elif expected >= 3:
        demand_level = "Moderate"
    else:
        demand_level = "Quiet"

    estimated_wait = min(90, max(5, 5 + max(0, expected - 2) * 8))
    total_records = sum(weekday_counts.values())
    if len(matching_counts) >= 6 and total_records >= 100:
        data_quality = "Established estimate"
    elif len(matching_counts) >= 3 and total_records >= 50:
        data_quality = "Growing estimate"
    else:
        data_quality = "Early estimate"

    operating_days = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
    available_counts = {day: weekday_counts.get(day, 0) for day in operating_days}
    best_alternative = min(available_counts, key=available_counts.get) if available_counts else "Not available"

    return {
        "date": preferred_date.isoformat(),
        "day": selected_day,
        "serviceOpen": True,
        "demandLevel": demand_level,
        "expectedBookings": expected,
        "estimatedWaitMinutes": estimated_wait,
        "sampleSize": len(matching_counts),
        "totalBookingRecords": total_records,
        "dataQuality": data_quality,
        "method": "Transparent historical weekday estimator",
        "reason": (
            f"The estimate uses {len(matching_counts)} stored {selected_day} service day"
            f"{'s' if len(matching_counts) != 1 else ''} and {total_records} active historical booking records."
        ),
        "bestAlternativeDay": best_alternative,
    }


def build_recommendation(
    vehicle_type: str,
    dirt_level: str,
    interior: str,
    special_condition: str = "None",
    days_since_wash: int = 14,
    usage: str = "Weekly",
    budget: str = "Any",
    preferred_date: date | None = None,
) -> dict:
    """Recommend the live catalogue package without inventing prices or names."""
    fallback = PACKAGE_RULES[vehicle_type]
    recommendation = {
        "package_name": fallback["package_name"],
        "estimated_minutes": fallback["estimated_minutes"],
        "price": fallback["price"],
        "rule_id": fallback["rule_id"],
    }
    try:
        with get_database() as database:
            live = database.execute(
                """SELECT package_name, price, estimated_minutes
                   FROM packages WHERE vehicle_type=? AND active=1
                   ORDER BY id LIMIT 1""",
                (vehicle_type,),
            ).fetchone()
        if live:
            recommendation.update(dict(live))
    except sqlite3.OperationalError:
        pass

    condition_profile = calculate_condition_profile(
        dirt_level,
        interior,
        special_condition,
        days_since_wash,
        usage,
        budget,
        recommendation["price"],
    )
    demand_forecast = build_demand_forecast(preferred_date or date.today())
    condition = {
        "Low": "light cleaning needs",
        "Medium": "normal cleaning needs",
        "High": "heavier cleaning needs",
    }[dirt_level]
    interior_note = " Interior care is included in the selected service." if interior == "Yes" and vehicle_type != "Motorcycle" else ""
    reason = (
        f"This is the active {vehicle_type.lower()} package in the AquaLux catalogue and matches {condition}."
        f"{interior_note} The displayed time and price are the same values used on the Home, booking and payment pages."
    )

    return {
        "packageName": recommendation["package_name"],
        "estimatedMinutes": recommendation["estimated_minutes"],
        "estimatedTime": format_duration(recommendation["estimated_minutes"]),
        "price": recommendation["price"],
        "reason": reason,
        "ruleId": recommendation["rule_id"],
        "engine": "AquaLux Explainable Vehicle Care Advisor",
        "conditionProfile": condition_profile,
        "demandForecast": demand_forecast,
        "inputs": {
            "vehicleType": vehicle_type,
            "dirtLevel": dirt_level,
            "interior": interior,
            "specialCondition": special_condition,
            "daysSinceWash": days_since_wash,
            "usage": usage,
            "budget": budget,
            "preferredDate": demand_forecast["date"],
        },
    }


def find_vehicle_type(message: str) -> str:
    """Extract a supported vehicle type from a natural-language message."""
    words = message.lower()
    if any(word in words for word in ("motorcycle", "motorbike", "bike", "scooter")):
        return "Motorcycle"
    if any(word in words for word in ("suv", "jeep", "crossover")):
        return "SUV"
    if any(word in words for word in ("van", "minivan")):
        return "Van"
    if any(word in words for word in ("car", "sedan", "coupe", "bmw", "i8", "lamborghini")):
        return "Car"
    return ""


def analyse_cleaning_needs(message: str) -> tuple[str, str]:
    """Extract dirt level and interior-cleaning need from the message."""
    words = message.lower()
    high_terms = ("very dirty", "muddy", "heavy dirt", "extremely dirty", "full of mud")
    low_terms = ("slightly dirty", "light dirt", "not very dirty", "quick wash")
    interior_terms = ("interior", "inside", "cabin", "seats", "dashboard", "vacuum")

    dirt_level = "High" if any(term in words for term in high_terms) else "Medium"
    if any(term in words for term in low_terms):
        dirt_level = "Low"
    interior = "Yes" if any(term in words for term in interior_terms) else "No"
    return dirt_level, interior


def get_busy_day_prediction() -> dict:
    """Count the same live SQLite bookings used by both dashboards."""
    weekday_counts, _ = get_weekday_booking_counts()

    if not weekday_counts:
        return {
            "day": "Not available",
            "bookings": 0,
            "reason": "There are not enough stored booking records yet.",
        }

    day, count = weekday_counts.most_common(1)[0]
    return {
        "day": day,
        "bookings": count,
        "reason": f"{day} has the highest number of stored bookings ({count}).",
    }


@app.after_request
def allow_local_frontend(response):
    """Allow the API to work from VS Code Live Server during development."""
    origin = request.headers.get("Origin", "")
    local_origin = (
        origin == "null"
        or origin.startswith("http://127.0.0.1:")
        or origin.startswith("http://localhost:")
    )
    if local_origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    if (
        response.mimetype == "text/html"
        or request.path.endswith((".js", ".css"))
        or request.path in {"/api/health"}
    ):
        response.headers["Cache-Control"] = "no-store, max-age=0"
    return response


@app.get("/")
def home():
    return send_from_directory(PROJECT_DIR, "index.html")


@app.get("/customer-ai.html")
def customer_ai_page():
    if not session.get("user_id"):
        return redirect("/login.html?next=customer-ai.html")
    return send_from_directory(PROJECT_DIR, "customer-ai.html")


@app.get("/ai-assistant.html")
def assistant_page():
    if not session.get("user_id"):
        return redirect("/login.html?next=ai-assistant.html")
    return send_from_directory(PROJECT_DIR, "ai-assistant.html")


@app.post("/api/register")
def register():
    data = request.get_json(silent=True) or {}
    full_name = str(data.get("fullName", "")).strip()
    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    phone = str(data.get("phone", "")).strip()
    vehicle_type = str(data.get("vehicleType", "")).strip()
    vehicle_number = str(data.get("vehicleNumber", "")).strip().upper()
    password = str(data.get("password", ""))

    if len(full_name) < 3:
        return jsonify(error="Please enter your full name."), 400
    if len(username) < 3 or not username.replace("_", "").isalnum():
        return jsonify(error="Username must contain at least 3 letters, numbers or underscores."), 400
    if "@" not in email or "." not in email.split("@")[-1]:
        return jsonify(error="Please enter a valid email address."), 400
    phone_digits = "".join(character for character in phone if character.isdigit())
    if not 9 <= len(phone_digits) <= 15:
        return jsonify(error="Please enter a valid phone number."), 400
    if vehicle_type not in PACKAGE_RULES:
        return jsonify(error="Please select Motorcycle, Car, Van or SUV."), 400
    if len(vehicle_number) < 3:
        return jsonify(error="Please enter the vehicle registration number."), 400
    if len(password) < 6:
        return jsonify(error="Password must contain at least 6 characters."), 400

    try:
        with get_database() as database:
            database.execute(
                """
                INSERT INTO users
                    (full_name, username, email, phone, vehicle_type, vehicle_number, password_hash, role)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'customer')
                """,
                (
                    full_name,
                    username,
                    email,
                    phone,
                    vehicle_type,
                    vehicle_number,
                    generate_password_hash(password),
                ),
            )
    except sqlite3.IntegrityError as error:
        error_text = str(error).lower()
        if "username" in error_text:
            return jsonify(error="That username is already registered."), 409
        if "email" in error_text:
            return jsonify(error="That email address is already registered."), 409
        return jsonify(error="The account could not be created."), 409

    return jsonify(
        message="Account created successfully. You can now sign in.",
        username=username,
    ), 201


@app.post("/api/login")
def login():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))
    requested_page = str(data.get("next", "")).strip()

    with get_database() as database:
        user = database.execute(
            "SELECT * FROM users WHERE username = ? COLLATE NOCASE",
            (username,),
        ).fetchone()

        if not user or not check_password_hash(user["password_hash"], password):
            return jsonify(error="Invalid username or password."), 401

        database.execute(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
            (user["id"],),
        )

    session.clear()
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["full_name"] = user["full_name"]
    session["role"] = user["role"]

    role_redirects = {
        "admin": "pages/admin/admin-dashboard.html",
        "staff": "pages/staff/staff-dashboard.html",
        "customer": "customer-ai.html",
    }
    allowed_ai_pages = {"customer-ai.html", "ai-assistant.html"}
    redirect_page = role_redirects.get(user["role"], "customer-ai.html")
    if requested_page in allowed_ai_pages:
        redirect_page = requested_page

    return jsonify(
        message="Login successful.",
        user={
            "username": user["username"],
            "fullName": user["full_name"],
            "role": user["role"],
        },
        redirect=redirect_page,
    )


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify(message="Logged out successfully.")


@app.get("/api/session")
def current_session():
    if not session.get("user_id"):
        return jsonify(authenticated=False), 401

    with get_database() as database:
        user = database.execute(
            """
            SELECT id, full_name, username, email, phone, vehicle_type, vehicle_number, role
            FROM users WHERE id = ?
            """,
            (session["user_id"],),
        ).fetchone()

    if not user:
        session.clear()
        return jsonify(authenticated=False), 401

    return jsonify(authenticated=True, user=dict(user))


@app.get("/api/health")
def health():
    return jsonify(
        status="online",
        engine="AquaLux Explainable Vehicle Care Advisor",
        feature="Condition scoring, recommendations, demand forecasts and customer feedback",
    )


@app.get("/api/availability")
@login_required
def service_availability():
    """Return operating hours, peak days and free booking slots from SQLite."""
    requested = request.args.get("date", date.today().isoformat())
    try:
        selected_day = date.fromisoformat(requested)
    except ValueError:
        return jsonify(error="Please select a valid service date."), 400

    settings = get_service_settings()
    try:
        opening_hour, opening_minute = map(int, settings["opening_time"].split(":"))
        closing_hour, closing_minute = map(int, settings["closing_time"].split(":"))
        opening_total = opening_hour * 60 + opening_minute
        closing_total = closing_hour * 60 + closing_minute
    except (ValueError, KeyError):
        opening_total, closing_total = 8 * 60, 18 * 60
    all_slots = [
        f"{minute // 60:02d}:{minute % 60:02d}"
        for minute in range(opening_total, closing_total, 30)
    ]
    open_weekdays = {0, 1, 2, 3, 4, 5}  # Monday to Saturday

    def booked_times(day):
        try:
            with get_database() as database:
                records = database.execute(
                    """SELECT booking_time FROM bookings
                       WHERE booking_date = ? AND status != 'Cancelled'
                       ORDER BY booking_time""",
                    (day.isoformat(),),
                ).fetchall()
            return [str(row["booking_time"])[:5] for row in records]
        except sqlite3.OperationalError:
            return []

    is_open_day = selected_day.weekday() in open_weekdays
    selected_booked = booked_times(selected_day) if is_open_day else []
    selected_free = [slot for slot in all_slots if slot not in selected_booked] if is_open_day else []

    next_days = []
    cursor = max(selected_day, date.today())
    for offset in range(15):
        candidate = cursor + timedelta(days=offset)
        if candidate.weekday() not in open_weekdays:
            continue
        free = [slot for slot in all_slots if slot not in booked_times(candidate)]
        if free:
            next_days.append({
                "date": candidate.isoformat(),
                "day": candidate.strftime("%A"),
                "freeSlots": len(free),
                "firstFreeTime": free[0],
            })
        if len(next_days) == 5:
            break

    weekday_counts = Counter()
    try:
        with get_database() as database:
            booking_dates = database.execute(
                """SELECT booking_date FROM bookings
                   WHERE status != 'Cancelled' AND strftime('%w', booking_date) != '0'"""
            ).fetchall()
        for row in booking_dates:
            try:
                weekday_counts[date.fromisoformat(row["booking_date"]).strftime("%A")] += 1
            except ValueError:
                continue
    except sqlite3.OperationalError:
        pass
    highest = max(weekday_counts.values(), default=0)
    peak_days = [day for day, count in weekday_counts.items() if count == highest] if highest else ["Not enough booking data"]
    busy_day_chart = [
        {"day": day, "shortDay": day[:3], "bookings": weekday_counts.get(day, 0)}
        for day in ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
    ]

    return jsonify(
        selectedDate=selected_day.isoformat(),
        selectedDay=selected_day.strftime("%A"),
        serviceOpen=is_open_day,
        canReceiveService=bool(selected_free) and selected_day >= date.today(),
        openingTime=settings["opening_time"],
        closingTime=settings["closing_time"],
        bookingDays=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        closedDays=["Sunday"],
        bookedTimes=selected_booked,
        freeTimes=selected_free,
        peakDays=peak_days,
        peakBookingCount=highest,
        busyDayChart=busy_day_chart,
        nextAvailableDays=next_days,
    )


@app.route("/api/recommend", methods=["POST", "OPTIONS"])
@login_required
def recommend():
    if request.method == "OPTIONS":
        return ("", 204)

    data = request.get_json(silent=True) or {}
    vehicle_lookup = {
        "motorcycle": "Motorcycle",
        "car": "Car",
        "van": "Van",
        "suv": "SUV",
    }
    vehicle_type = vehicle_lookup.get(
        str(data.get("vehicleType", "")).strip().lower(), ""
    )
    dirt_level = str(data.get("dirtLevel", "Medium")).strip().title()
    interior = str(data.get("interior", "No")).strip().title()
    special_condition = str(data.get("specialCondition", "None")).strip().title()
    usage = str(data.get("usage", "Weekly")).strip().title()
    budget = str(data.get("budget", "Any")).strip()
    try:
        days_since_wash = int(data.get("daysSinceWash", 14))
    except (TypeError, ValueError):
        return jsonify(error="Days since the previous wash must be a number."), 400
    preferred_date_text = str(data.get("preferredDate", date.today().isoformat())).strip()
    try:
        preferred_date = date.fromisoformat(preferred_date_text)
    except ValueError:
        return jsonify(error="Please select a valid preferred service date."), 400

    if vehicle_type not in PACKAGE_RULES:
        return jsonify(error="Please select Motorcycle, Car, Van or SUV."), 400
    if dirt_level not in {"Low", "Medium", "High"}:
        return jsonify(error="Dirt level must be Low, Medium or High."), 400
    if interior not in {"Yes", "No"}:
        return jsonify(error="Interior cleaning must be Yes or No."), 400
    if special_condition not in {"None", "Mud", "Water Spots", "Stains"}:
        return jsonify(error="Select a valid special vehicle condition."), 400
    if usage not in {"Daily", "Weekly", "Occasional"}:
        return jsonify(error="Select Daily, Weekly or Occasional vehicle usage."), 400
    if budget not in {"Any", "Under 10000", "10000-20000", "Above 20000"}:
        return jsonify(error="Select a valid budget range."), 400
    if not 0 <= days_since_wash <= 365:
        return jsonify(error="Days since the previous wash must be between 0 and 365."), 400

    recommendation = build_recommendation(
        vehicle_type,
        dirt_level,
        interior,
        special_condition,
        days_since_wash,
        usage,
        budget,
        preferred_date,
    )
    request_id = record_ai_request(
        "package_recommendation",
        message=(
            f"Dirt: {dirt_level}; Interior: {interior}; Condition: {special_condition}; "
            f"Days since wash: {days_since_wash}; Usage: {usage}; Preferred date: {preferred_date.isoformat()}"
        ),
        vehicle_type=vehicle_type,
        result_summary=json.dumps({
            "package": recommendation["packageName"],
            "conditionScore": recommendation["conditionProfile"]["score"],
            "demandLevel": recommendation["demandForecast"]["demandLevel"],
        }),
    )
    recommendation["requestId"] = request_id
    return jsonify(recommendation)


@app.post("/api/ai/feedback")
@login_required
def save_ai_feedback():
    """Store one helpful/not-helpful response for the signed-in user's result."""
    data = request.get_json(silent=True) or {}
    try:
        request_id = int(data.get("requestId"))
    except (TypeError, ValueError):
        return jsonify(error="A valid AI request is required."), 400
    helpful = data.get("helpful")
    if not isinstance(helpful, bool):
        return jsonify(error="Feedback must be helpful or not helpful."), 400
    comment = str(data.get("comment", "")).strip()[:300]

    with get_database() as database:
        owned_request = database.execute(
            "SELECT id FROM ai_requests WHERE id=? AND user_id=?",
            (request_id, session["user_id"]),
        ).fetchone()
        if not owned_request:
            return jsonify(error="That recommendation does not belong to this account."), 404
        database.execute(
            """INSERT INTO ai_feedback(request_id,user_id,helpful,comment)
               VALUES(?,?,?,?)
               ON CONFLICT(request_id,user_id) DO UPDATE SET
                 helpful=excluded.helpful,
                 comment=excluded.comment,
                 created_at=CURRENT_TIMESTAMP""",
            (request_id, session["user_id"], int(helpful), comment),
        )
    return jsonify(message="Thank you. Your feedback will help evaluate future recommendations.")


@app.get("/api/admin/ai-insights")
@login_required
def admin_ai_insights():
    """Return honest AI usage, feedback and data-readiness evidence for admins."""
    if session.get("role") != "admin":
        return jsonify(error="Administrator access is required."), 403

    weekday_counts, _ = get_weekday_booking_counts()
    operating_days = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
    with get_database() as database:
        recommendation_count = database.execute(
            """SELECT COUNT(*) AS total FROM ai_requests
               WHERE request_type IN ('package_recommendation','assistant_recommendation')"""
        ).fetchone()["total"]
        assistant_count = database.execute(
            "SELECT COUNT(*) AS total FROM ai_requests WHERE request_type='busy_day_prediction'"
        ).fetchone()["total"]
        feedback_row = database.execute(
            "SELECT COUNT(*) AS total, COALESCE(SUM(helpful),0) AS helpful FROM ai_feedback"
        ).fetchone()
        vehicle_rows = database.execute(
            """SELECT vehicle_type, COUNT(*) AS total FROM ai_requests
               WHERE vehicle_type != '' GROUP BY vehicle_type ORDER BY total DESC"""
        ).fetchall()
        recent_feedback = database.execute(
            """SELECT f.helpful, f.comment, f.created_at, u.full_name,
                      r.vehicle_type, r.result_summary
               FROM ai_feedback f
               JOIN users u ON u.id=f.user_id
               JOIN ai_requests r ON r.id=f.request_id
               ORDER BY f.id DESC LIMIT 6"""
        ).fetchall()

    feedback_total = int(feedback_row["total"])
    helpful_total = int(feedback_row["helpful"])
    helpful_rate = round(helpful_total * 100 / feedback_total) if feedback_total else None
    total_booking_records = sum(weekday_counts.values())
    readiness = "Ready for model experimentation" if total_booking_records >= 100 else "Collecting operational data"

    return jsonify(
        recommendationCount=recommendation_count,
        busyDayQueries=assistant_count,
        feedbackCount=feedback_total,
        helpfulCount=helpful_total,
        helpfulRate=helpful_rate,
        feedbackCoverage=round(feedback_total * 100 / recommendation_count) if recommendation_count else 0,
        totalBookingRecords=total_booking_records,
        modelReadiness=readiness,
        modelMethod="Transparent rules plus historical weekday estimator",
        accuracy=None,
        accuracyNote="Accuracy is not displayed because actual customer waiting times are not yet recorded.",
        minimumTrainingRecords=100,
        weekdayDemand=[
            {"day": day, "shortDay": day[:3], "bookings": weekday_counts.get(day, 0)}
            for day in operating_days
        ],
        vehicleActivity=[dict(row) for row in vehicle_rows],
        recentFeedback=[dict(row) for row in recent_feedback],
    )


@app.route("/api/assistant", methods=["POST", "OPTIONS"])
@login_required
def ai_assistant():
    """Natural-language assistant for recommendations and busy-day questions."""
    if request.method == "OPTIONS":
        return ("", 204)

    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()
    if not message:
        return jsonify(error="Please enter a message for AquaLux AI."), 400

    lower_message = message.lower()
    engine = "AquaLux Explainable Natural-Language Advisor"

    if any(
        term in lower_message
        for term in ("busy day", "busiest day", "busiest booking day", "busy time", "booking trend", "waiting time", "wait time", "queue")
    ):
        prediction = get_busy_day_prediction()
        forecast_day = date.today()
        while forecast_day.weekday() == 6:
            forecast_day += timedelta(days=1)
        forecast = build_demand_forecast(forecast_day)
        record_ai_request(
            "busy_day_prediction",
            message=message,
            result_summary=prediction["day"],
        )
        return jsonify(
            intent="busy_day_prediction",
            engine=engine,
            reply=(
                f"The current busy-day prediction is {prediction['day']}. "
                f"{prediction['reason']} For {forecast['day']}, the historical estimator reports "
                f"{forecast['demandLevel'].lower()} demand and an estimated queue delay of "
                f"{forecast['estimatedWaitMinutes']} minutes. This is an {forecast['dataQuality'].lower()}, "
                "not a guaranteed waiting time."
            ),
            busyDay=prediction,
            demandForecast=forecast,
            suggestions=[
                "Recommend a wash for my muddy SUV",
                "How long does a car full wash take?",
            ],
        )

    if any(term in lower_message for term in ("hello", "hi", "hey", "good morning", "good evening")):
        return jsonify(
            intent="greeting",
            engine=engine,
            reply=(
                "Hello! I’m AquaLux AI. Tell me your vehicle type and condition—for example, "
                "‘My SUV is very dirty and needs interior cleaning.’"
            ),
            suggestions=[
                "Recommend a package for my car",
                "Predict the busiest booking day",
                "Estimate wash time for a motorcycle",
            ],
        )

    vehicle_type = find_vehicle_type(message)
    if not vehicle_type:
        return jsonify(
            intent="request_vehicle_type",
            engine=engine,
            reply="I can help with a Motorcycle, Car, Van or SUV. Which vehicle would you like to wash?",
            suggestions=["Motorcycle", "Car", "Van", "SUV"],
        )

    dirt_level, interior = analyse_cleaning_needs(message)
    recommendation = build_recommendation(vehicle_type, dirt_level, interior)
    request_id = record_ai_request(
        "assistant_recommendation",
        message=message,
        vehicle_type=vehicle_type,
        result_summary=json.dumps({
            "package": recommendation["packageName"],
            "conditionScore": recommendation["conditionProfile"]["score"],
        }),
    )
    recommendation["requestId"] = request_id
    reply = (
        f"For your {vehicle_type.lower()}, I recommend the {recommendation['packageName']}. "
        f"The estimated time is {recommendation['estimatedTime']} and the price is "
        f"LKR {recommendation['price']:,}. {recommendation['reason']}"
    )

    return jsonify(
        intent="package_recommendation",
        engine=engine,
        reply=reply,
        recommendation=recommendation,
        suggestions=[
            "What is the busiest booking day?",
            f"Does the {vehicle_type} package include interior cleaning?",
        ],
    )


@app.errorhandler(404)
def page_not_found(error):
    return send_from_directory(PROJECT_DIR, "pages/errors/404.html"), 404


@app.errorhandler(403)
def page_forbidden(error):
    return send_from_directory(PROJECT_DIR, "pages/errors/403.html"), 403


init_database()

# Register database-backed customer, vehicle, package, booking, payment,
# reporting and role-protection features after the authentication tables exist.
from management import register_management
register_management(app, get_database)


if __name__ == "__main__":
    print("AquaLux AI Server: http://127.0.0.1:5000")
    print("Press Ctrl+C to stop the server.")
    if os.environ.get("AQUALUX_OPEN_BROWSER") == "1":
        Timer(1.2, lambda: webbrowser.open("http://127.0.0.1:5000/login.html")).start()
    app.run(host="127.0.0.1", port=5000, debug=False)
