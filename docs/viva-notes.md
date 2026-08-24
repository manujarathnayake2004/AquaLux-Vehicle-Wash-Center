# Viva Notes

## Why separate folders?
I separated pages by role: Admin, Staff, and Customer. This makes access control and explanation easier.

## Why assets folder?
CSS, JavaScript, images, and icons are common resources. Keeping them inside `assets` avoids repeating code.

## Why JSON files?
The project uses a Flask backend and SQLite database. JSON files are retained only as original sample-data references.

## AI Feature Explanation
The AI feature is rule-based. When the user selects a vehicle type, JavaScript checks predefined rules and recommends a suitable wash package, time, and price. This is simple and suitable for a student project.

## Future Backend Plan
The management forms now call protected Flask APIs. Customers, vehicles, packages, bookings, payments, reports, users and AI history are stored or calculated through SQLite.
