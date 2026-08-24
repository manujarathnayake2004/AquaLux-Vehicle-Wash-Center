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

from flask import Flask, jsonify, redirect, request, send_from_directory, session
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
        return
    with get_database() as database:
        database.execute(
            """
            INSERT INTO ai_requests
                (user_id, request_type, message, vehicle_type, result_summary)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, request_type, message, vehicle_type, result_summary),
        )


def build_recommendation(vehicle_type: str, dirt_level: str, interior: str) -> dict:
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
        "engine": "AquaLux Rule-Based AI Server",
        "inputs": {
            "vehicleType": vehicle_type,
            "dirtLevel": dirt_level,
            "interior": interior,
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
    bookings = []
    try:
        with get_database() as database:
            bookings = [dict(row) for row in database.execute(
                """SELECT booking_date AS date FROM bookings
                   WHERE status != 'Cancelled' AND strftime('%w',booking_date) != '0'"""
            ).fetchall()]
    except sqlite3.OperationalError:
        booking_file = PROJECT_DIR / "data" / "bookings.json"
        try:
            bookings = json.loads(booking_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            bookings = []

    weekday_counts = Counter()
    for booking in bookings:
        try:
            booking_day = date.fromisoformat(booking["date"]).strftime("%A")
            weekday_counts[booking_day] += 1
        except (KeyError, TypeError, ValueError):
            continue

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
    if request.path in {"/login.html", "/js/main.js", "/api/health"}:
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
        engine="AquaLux Rule-Based AI Server",
        feature="Natural-language wash assistant and package recommendation",
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

    opening_hour, closing_hour = 8, 18
    all_slots = [
        f"{minute // 60:02d}:{minute % 60:02d}"
        for minute in range(opening_hour * 60, closing_hour * 60, 30)
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
        openingTime="08:00",
        closingTime="18:00",
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

    if vehicle_type not in PACKAGE_RULES:
        return jsonify(error="Please select Motorcycle, Car, Van or SUV."), 400
    if dirt_level not in {"Low", "Medium", "High"}:
        return jsonify(error="Dirt level must be Low, Medium or High."), 400
    if interior not in {"Yes", "No"}:
        return jsonify(error="Interior cleaning must be Yes or No."), 400

    recommendation = build_recommendation(vehicle_type, dirt_level, interior)
    record_ai_request(
        "package_recommendation",
        message=f"Dirt: {dirt_level}; Interior: {interior}",
        vehicle_type=vehicle_type,
        result_summary=recommendation["packageName"],
    )
    return jsonify(recommendation)


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
    engine = "AquaLux Natural-Language Rule Engine"

    if any(
        term in lower_message
        for term in ("busy day", "busiest day", "busiest booking day", "busy time", "booking trend")
    ):
        prediction = get_busy_day_prediction()
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
                f"{prediction['reason']} This can help the manager plan staff and cleaning materials."
            ),
            busyDay=prediction,
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
    record_ai_request(
        "assistant_recommendation",
        message=message,
        vehicle_type=vehicle_type,
        result_summary=recommendation["packageName"],
    )
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
