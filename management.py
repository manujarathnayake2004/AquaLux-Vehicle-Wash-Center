"""Database-backed management routes for AquaLux Auto Spa."""

from datetime import date, datetime, timedelta
import sqlite3

from flask import jsonify, redirect, request, send_from_directory, session
from werkzeug.security import generate_password_hash

from catalog import CATALOG_BY_NAME, PACKAGE_CATALOG, format_duration


def register_management(app, get_database):
    """Create the business tables and attach protected CRUD APIs."""
    with get_database() as db:
        db.execute("PRAGMA foreign_keys = ON")
        db.executescript("""
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
          phone TEXT NOT NULL, email TEXT UNIQUE, address TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS vehicles (
          id INTEGER PRIMARY KEY AUTOINCREMENT, vehicle_no TEXT NOT NULL UNIQUE COLLATE NOCASE,
          vehicle_type TEXT NOT NULL, owner_name TEXT NOT NULL, notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS packages (
          id INTEGER PRIMARY KEY AUTOINCREMENT, package_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
          vehicle_type TEXT NOT NULL, price REAL NOT NULL CHECK(price >= 0),
          estimated_minutes INTEGER NOT NULL CHECK(estimated_minutes > 0), active INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL,
          vehicle_no TEXT NOT NULL, vehicle_type TEXT NOT NULL, package_name TEXT NOT NULL,
          booking_date TEXT NOT NULL, booking_time TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Pending', cancellation_reason TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE UNIQUE INDEX IF NOT EXISTS active_booking_slot
          ON bookings(booking_date, booking_time) WHERE status != 'Cancelled';
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT, booking_id INTEGER NOT NULL UNIQUE,
          amount REAL NOT NULL CHECK(amount >= 0), discount REAL NOT NULL DEFAULT 0,
          method TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Paid',
          payment_date TEXT NOT NULL DEFAULT CURRENT_DATE,
          FOREIGN KEY(booking_id) REFERENCES bookings(id)
        );
        CREATE TABLE IF NOT EXISTS data_migrations (
          name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        """)
        seeds = [
          (item['package_name'],item['vehicle_type'],item['price'],item['estimated_minutes'])
          for item in PACKAGE_CATALOG
        ]
        catalogue_migrated=db.execute("SELECT 1 FROM data_migrations WHERE name='home-catalogue-v2'").fetchone()
        if not catalogue_migrated:
            # Migrate every existing project copy once; later admin edits remain
            # the live source used by Home, AI, bookings and payments.
            db.execute("UPDATE bookings SET package_name='Car Standard Wash' WHERE package_name IN ('Car Full Wash','Car Basic Wash')")
            db.execute("DELETE FROM packages WHERE package_name IN ('Car Full Wash','Car Basic Wash')")
            db.executemany(
                """INSERT INTO packages(package_name,vehicle_type,price,estimated_minutes,active)
                   VALUES(?,?,?,?,1)
                   ON CONFLICT(package_name) DO UPDATE SET
                     vehicle_type=excluded.vehicle_type,
                     price=excluded.price,
                     estimated_minutes=excluded.estimated_minutes,
                     active=1""",
                seeds
            )
            db.execute(
                """UPDATE payments
                   SET amount = MAX(0,
                     COALESCE((SELECT price FROM packages
                               WHERE package_name=(SELECT package_name FROM bookings WHERE id=payments.booking_id)), amount)
                     - discount)"""
            )
            db.execute("INSERT INTO data_migrations(name) VALUES('home-catalogue-v2')")
        else:
            db.executemany(
                "INSERT OR IGNORE INTO packages(package_name,vehicle_type,price,estimated_minutes,active) VALUES(?,?,?,?,1)",
                seeds
            )
        customer_seeds = [
            (1,'Nimal Perera','0712345678','nimal@mail.com','Matara'),
            (2,'Kamal Silva','0778889999','kamal@mail.com','Colombo'),
            (3,'Anjali Fernando','0763412087','anjali@mail.com','Galle'),
            (4,'Dinesh Jayawardena','0759081426','dinesh@mail.com','Weligama'),
            (5,'Tharushi Senanayake','0704567812','tharushi@mail.com','Akuressa'),
            (6,'Ruwan Kumara','0782134609','ruwan@mail.com','Kamburupitiya'),
            (7,'Ishara Gunawardena','0726148093','ishara@mail.com','Dikwella'),
            (8,'Malith Peris','0743921750','malith@mail.com','Matara'),
            (9,'Sachini Wijesinghe','0775032468','sachini@mail.com','Galle'),
            (10,'Kasun Maduranga','0718452309','kasun@mail.com','Deniyaya'),
            (11,'Nadeesha Ramanayake','0769023145','nadeesha@mail.com','Mirissa'),
            (12,'Chamod Lakshan','0751268374','chamod@mail.com','Hakmana'),
        ]
        db.executemany(
            "INSERT OR IGNORE INTO customers(id,name,phone,email,address) VALUES(?,?,?,?,?)",
            customer_seeds
        )
        vehicle_seeds = [
            (1,'CAR-4587','Car','Nimal Perera','Pearl white sedan'),
            (2,'SUV-2231','SUV','Kamal Silva','Black premium SUV'),
            (3,'BIKE-7812','Motorcycle','Anjali Fernando','Red sport motorcycle'),
            (4,'VAN-9045','Van','Dinesh Jayawardena','Silver passenger van'),
            (5,'CAR-6719','Car','Tharushi Senanayake','Blue compact car'),
            (6,'SUV-4410','SUV','Ruwan Kumara','White family SUV'),
            (7,'BIKE-3028','Motorcycle','Ishara Gunawardena','Black commuter motorcycle'),
            (8,'CAR-1186','Car','Malith Peris','Grey luxury saloon'),
            (9,'VAN-5524','Van','Sachini Wijesinghe','White delivery van'),
            (10,'SUV-8093','SUV','Kasun Maduranga','Green off-road SUV'),
            (11,'CAR-7342','Car','Nadeesha Ramanayake','Red hatchback'),
            (12,'BIKE-6605','Motorcycle','Chamod Lakshan','Blue street motorcycle'),
        ]
        db.executemany(
            "INSERT OR IGNORE INTO vehicles(id,vehicle_no,vehicle_type,owner_name,notes) VALUES(?,?,?,?,?)",
            vehicle_seeds
        )
        # Sunday is a closed day. Remove legacy demo records that were previously
        # created on "today" even when today happened to be Sunday.
        sunday_ids = [row[0] for row in db.execute(
            "SELECT id FROM bookings WHERE strftime('%w', booking_date)='0'"
        ).fetchall()]
        if sunday_ids:
            marks = ','.join('?' for _ in sunday_ids)
            db.execute(f"DELETE FROM payments WHERE booking_id IN ({marks})", sunday_ids)
            db.execute(f"DELETE FROM bookings WHERE id IN ({marks})", sunday_ids)

        # Seed a visible, realistic operating week for the dashboards. Saturday
        # intentionally has the highest volume and Sunday always remains zero.
        week_monday = date.today() - timedelta(days=date.today().weekday())
        demo_volume = [4, 5, 3, 6, 5, 8]
        demo_times = ['08:00','08:30','09:30','10:30','12:00','13:30','15:00','16:30']
        booking_profiles = [
            ('Nimal Perera','CAR-4587','Car','Car Standard Wash',15000),
            ('Kamal Silva','SUV-2231','SUV','SUV Full Wash',22500),
            ('Anjali Fernando','BIKE-7812','Motorcycle','Bike Basic Wash',7500),
            ('Dinesh Jayawardena','VAN-9045','Van','Van Full Wash',20000),
            ('Tharushi Senanayake','CAR-6719','Car','Car Standard Wash',15000),
            ('Ruwan Kumara','SUV-4410','SUV','SUV Full Wash',22500),
            ('Ishara Gunawardena','BIKE-3028','Motorcycle','Bike Basic Wash',7500),
            ('Malith Peris','CAR-1186','Car','Car Standard Wash',15000),
            ('Sachini Wijesinghe','VAN-5524','Van','Van Full Wash',20000),
            ('Kasun Maduranga','SUV-8093','SUV','SUV Full Wash',22500),
            ('Nadeesha Ramanayake','CAR-7342','Car','Car Standard Wash',15000),
            ('Chamod Lakshan','BIKE-6605','Motorcycle','Bike Basic Wash',7500),
        ]
        status_cycle = ['Completed','Pending','Completed','Cancelled','Completed','Pending','Completed','Completed']
        profile_offset = 0
        for weekday, volume in enumerate(demo_volume):
            booking_day = (week_monday + timedelta(days=weekday)).isoformat()
            for number in range(volume):
                customer, vehicle, vehicle_type, package, price = booking_profiles[(profile_offset + number) % len(booking_profiles)]
                status = status_cycle[(weekday + number) % len(status_cycle)]
                cancellation_reason = 'Customer requested a different service day' if status == 'Cancelled' else None
                booking = db.execute(
                    "SELECT id,status FROM bookings WHERE booking_date=? AND booking_time=? ORDER BY id LIMIT 1",
                    (booking_day, demo_times[number])
                ).fetchone()
                if not booking:
                    db.execute(
                        """INSERT INTO bookings
                           (customer_name,vehicle_no,vehicle_type,package_name,booking_date,booking_time,status,cancellation_reason)
                           VALUES(?,?,?,?,?,?,?,?)""",
                        (customer, vehicle, vehicle_type, package, booking_day, demo_times[number], status, cancellation_reason)
                    )
                    booking = db.execute(
                        "SELECT id,status FROM bookings WHERE booking_date=? AND booking_time=? ORDER BY id LIMIT 1",
                        (booking_day, demo_times[number])
                    ).fetchone()
                if booking and booking['status'] == 'Completed':
                    db.execute(
                        """INSERT OR IGNORE INTO payments
                           (booking_id,amount,discount,method,status,payment_date)
                           VALUES(?,?,0,'Cash','Paid',?)""",
                        (booking['id'], price, booking_day)
                    )
            profile_offset += volume

    def user_required(*roles):
        if not session.get('user_id'):
            return jsonify(error='Authentication required.'), 401
        if roles and session.get('role') not in roles:
            return jsonify(error='You do not have permission for this action.'), 403
        return None

    def rows(query, values=()):
        with get_database() as db:
            return [dict(r) for r in db.execute(query, values).fetchall()]

    def normalise_booking_time(raw):
        value=str(raw or '').strip()[:5]
        try:
            parsed=datetime.strptime(value,'%H:%M')
        except ValueError:
            return ''
        total=parsed.hour*60+parsed.minute
        return value if 8*60 <= total < 18*60 and parsed.minute in {0,30} else ''

    def find_package(db, package_name, vehicle_type=None):
        query='SELECT id,package_name,vehicle_type,price,estimated_minutes,active FROM packages WHERE package_name=? COLLATE NOCASE AND active=1'
        values=[str(package_name or '').strip()]
        if vehicle_type:
            query+=' AND vehicle_type=?'
            values.append(str(vehicle_type).strip())
        return db.execute(query,values).fetchone()

    @app.before_request
    def protect_management_pages():
        path = request.path
        required = None
        if path.startswith('/pages/admin/'): required = ('admin',)
        elif path.startswith('/pages/staff/'): required = ('admin','staff')
        elif path.startswith('/pages/customer/'): required = ('customer',)
        if required and not path.startswith('/pages/errors/'):
            if not session.get('user_id'):
                return redirect('/login.html')
            if session.get('role') not in required:
                return send_from_directory(app.static_folder, 'pages/errors/403.html'), 403

    @app.get('/api/customers')
    def list_customers():
        denied=user_required('admin','staff');
        if denied: return denied
        return jsonify(rows('SELECT id,name,phone,email,address,created_at FROM customers ORDER BY id DESC'))

    @app.post('/api/customers')
    def add_customer():
        denied=user_required('admin','staff');
        if denied: return denied
        d=request.get_json(silent=True) or {}
        if len(str(d.get('name','')).strip())<3: return jsonify(error='Enter a valid customer name.'),400
        try:
            with get_database() as db:
                cur=db.execute('INSERT INTO customers(name,phone,email,address) VALUES(?,?,?,?)',
                  (str(d.get('name')).strip(),str(d.get('phone','')).strip(),str(d.get('email','')).strip().lower(),str(d.get('address','')).strip()))
            return jsonify(message='Customer saved successfully.',id=cur.lastrowid),201
        except sqlite3.IntegrityError: return jsonify(error='That email is already registered.'),409

    @app.get('/api/vehicles')
    def list_vehicles():
        denied=user_required('admin','staff');
        if denied: return denied
        return jsonify(rows('SELECT id,vehicle_no,vehicle_type,owner_name,notes,created_at FROM vehicles ORDER BY id DESC'))

    @app.post('/api/vehicles')
    def add_vehicle():
        denied=user_required('admin','staff');
        if denied: return denied
        d=request.get_json(silent=True) or {}; kind=str(d.get('vehicleType','')).strip()
        if kind not in {'Motorcycle','Car','Van','SUV'}: return jsonify(error='Select a valid vehicle type.'),400
        try:
            with get_database() as db:
                cur=db.execute('INSERT INTO vehicles(vehicle_no,vehicle_type,owner_name,notes) VALUES(?,?,?,?)',
                  (str(d.get('vehicleNo','')).strip().upper(),kind,str(d.get('owner','')).strip(),str(d.get('notes','')).strip()))
            return jsonify(message='Vehicle saved successfully.',id=cur.lastrowid),201
        except sqlite3.IntegrityError: return jsonify(error='That vehicle number already exists.'),409

    @app.route('/api/packages',methods=['GET','POST','PUT'])
    def package_api():
        denied=user_required('admin','staff','customer');
        if denied: return denied
        if request.method=='GET': return jsonify(rows('SELECT id,package_name,vehicle_type,price,estimated_minutes,active FROM packages ORDER BY vehicle_type,price'))
        if session.get('role')!='admin': return jsonify(error='Admin access required.'),403
        d=request.get_json(silent=True) or {}
        try: minutes=int(''.join(c for c in str(d.get('estimatedTime','')) if c.isdigit()))
        except ValueError: minutes=0
        if minutes<1: return jsonify(error='Enter estimated time in minutes.'),400
        package_name=str(d.get('packageName','')).strip()
        vehicle_type=str(d.get('vehicleType','')).strip()
        if len(package_name)<3: return jsonify(error='Enter a valid package name.'),400
        if vehicle_type not in {'Motorcycle','Car','Van','SUV'}: return jsonify(error='Select a valid vehicle type.'),400
        try:
            with get_database() as db:
                values=(package_name,vehicle_type,float(d.get('price',0)),minutes)
                if request.method=='PUT':
                    package_id=int(d.get('id',0))
                    old=db.execute('SELECT package_name,vehicle_type FROM packages WHERE id=?',(package_id,)).fetchone()
                    if not old:return jsonify(error='Package not found.'),404
                    if old['vehicle_type'] != vehicle_type and db.execute('SELECT 1 FROM bookings WHERE package_name=? LIMIT 1',(old['package_name'],)).fetchone():
                        return jsonify(error='Vehicle type cannot change while bookings use this package.'),400
                    cur=db.execute('UPDATE packages SET package_name=?,vehicle_type=?,price=?,estimated_minutes=? WHERE id=?',values+(int(d.get('id',0)),))
                    db.execute('UPDATE bookings SET package_name=? WHERE package_name=?',(package_name,old['package_name']))
                    return jsonify(message='Package updated successfully.')
                cur=db.execute('INSERT INTO packages(package_name,vehicle_type,price,estimated_minutes) VALUES(?,?,?,?)',values)
            return jsonify(message='Package saved successfully.',id=cur.lastrowid),201
        except (ValueError,sqlite3.IntegrityError): return jsonify(error='Check the package details or duplicate name.'),409

    @app.get('/api/public/packages')
    def public_packages():
        live=rows("SELECT id,package_name,vehicle_type,price,estimated_minutes,active FROM packages WHERE active=1 ORDER BY CASE vehicle_type WHEN 'Motorcycle' THEN 1 WHEN 'Car' THEN 2 WHEN 'Van' THEN 3 WHEN 'SUV' THEN 4 ELSE 5 END,price")
        for item in live:
            details=CATALOG_BY_NAME.get(item['package_name'],{})
            item['description']=details.get('description',f"Professional {item['vehicle_type'].lower()} wash service.")
            item['features']=details.get('features',['Professional wash','Careful finish'])
            item['estimated_time']=format_duration(item['estimated_minutes'])
        return jsonify(live)

    @app.route('/api/bookings',methods=['GET','POST','PUT'])
    def booking_api():
        denied=user_required('admin','staff','customer');
        if denied: return denied
        if request.method=='GET':
            if session.get('role')=='customer':
                return jsonify(rows('SELECT * FROM bookings WHERE customer_name=? ORDER BY booking_date DESC,booking_time DESC',(session.get('full_name'),)))
            return jsonify(rows('SELECT * FROM bookings ORDER BY booking_date DESC,booking_time DESC'))
        d=request.get_json(silent=True) or {}
        if request.method=='POST':
            try:
                booking_day=date.fromisoformat(str(d.get('date','')))
                if booking_day < date.today(): return jsonify(error='Booking date cannot be in the past.'),400
                if booking_day.weekday() == 6: return jsonify(error='The service centre is closed on Sunday. Please select Monday to Saturday.'),400
                service_time=normalise_booking_time(d.get('time'))
                if not service_time: return jsonify(error='Select a 30-minute start time from 08:00 to 17:30.'),400
                vehicle_type=str(d.get('vehicleType','')).strip()
                if vehicle_type not in {'Motorcycle','Car','Van','SUV'}: return jsonify(error='Select a valid vehicle type.'),400
                customer_name=session.get('full_name') if session.get('role')=='customer' else str(d.get('customer','')).strip()
                if len(customer_name)<3: return jsonify(error='Enter a valid customer name.'),400
                with get_database() as db:
                    package=find_package(db,d.get('packageName'),vehicle_type)
                    if not package: return jsonify(error='Select an active package that matches the vehicle type.'),400
                    cur=db.execute('INSERT INTO bookings(customer_name,vehicle_no,vehicle_type,package_name,booking_date,booking_time) VALUES(?,?,?,?,?,?)',
                     (customer_name,str(d.get('vehicleNo','')).strip().upper(),vehicle_type,package['package_name'],str(d.get('date')),service_time))
                return jsonify(message='Booking saved successfully.',id=cur.lastrowid),201
            except ValueError: return jsonify(error='Enter a valid booking date.'),400
            except sqlite3.IntegrityError: return jsonify(error='This date and time slot is already booked.'),409
        if session.get('role')=='customer': return jsonify(error='Staff access required to update bookings.'),403
        booking_id=str(d.get('bookingId','')).upper().replace('BK','')
        if not booking_id.isdigit(): return jsonify(error='Enter a valid booking ID such as BK1.'),400
        try:
            if d.get('action') != 'cancel':
                updated_day=date.fromisoformat(str(d.get('date','')))
                if updated_day < date.today(): return jsonify(error='Booking date cannot be in the past.'),400
                if updated_day.weekday() == 6: return jsonify(error='The service centre is closed on Sunday. Please select Monday to Saturday.'),400
                service_time=normalise_booking_time(d.get('time'))
                if not service_time: return jsonify(error='Select a 30-minute start time from 08:00 to 17:30.'),400
            with get_database() as db:
                if d.get('action')=='cancel':
                    cur=db.execute("UPDATE bookings SET status='Cancelled',cancellation_reason=? WHERE id=?",(str(d.get('reason','')).strip(),int(booking_id)))
                else:
                    existing=db.execute('SELECT vehicle_type FROM bookings WHERE id=?',(int(booking_id),)).fetchone()
                    if not existing: return jsonify(error='Booking not found.'),404
                    package=find_package(db,d.get('packageName'),existing['vehicle_type'])
                    if not package: return jsonify(error='Select an active package that matches the booked vehicle.'),400
                    new_status=str(d.get('status','Pending')).title()
                    if new_status not in {'Pending','Completed','Cancelled'}: return jsonify(error='Status must be Pending, Completed or Cancelled.'),400
                    cur=db.execute('UPDATE bookings SET package_name=?,booking_date=?,booking_time=?,status=? WHERE id=?',
                     (package['package_name'],str(d.get('date')),service_time,new_status,int(booking_id)))
            if not cur.rowcount: return jsonify(error='Booking not found.'),404
            return jsonify(message='Booking updated successfully.')
        except ValueError: return jsonify(error='Enter a valid booking date.'),400
        except sqlite3.IntegrityError: return jsonify(error='This date and time slot is already booked.'),409

    @app.route('/api/payments',methods=['GET','POST'])
    def payment_api():
        denied=user_required('admin','staff');
        if denied: return denied
        if request.method=='GET': return jsonify(rows('SELECT p.*,b.customer_name,b.vehicle_no FROM payments p JOIN bookings b ON b.id=p.booking_id ORDER BY p.id DESC'))
        d=request.get_json(silent=True) or {}; raw=str(d.get('bookingId','')).upper().replace('BK','')
        if not raw.isdigit(): return jsonify(error='Enter a valid booking ID.'),400
        try:
            discount=float(d.get('discount',0))
            if discount < 0: return jsonify(error='Discount cannot be negative.'),400
            with get_database() as db:
                booking=db.execute(
                    """SELECT b.id,b.package_name,p.price
                       FROM bookings b JOIN packages p ON p.package_name=b.package_name
                       WHERE b.id=?""",
                    (int(raw),)
                ).fetchone()
                if not booking: return jsonify(error='Booking not found.'),404
                if discount > float(booking['price']): return jsonify(error='Discount cannot exceed the package price.'),400
                amount=float(booking['price'])-discount
                cur=db.execute('INSERT INTO payments(booking_id,amount,discount,method) VALUES(?,?,?,?)',(int(raw),amount,discount,str(d.get('method','Cash'))))
                db.execute("UPDATE bookings SET status='Completed' WHERE id=?",(int(raw),))
            return jsonify(message='Payment recorded successfully.',id=cur.lastrowid,total=amount),201
        except sqlite3.IntegrityError: return jsonify(error='Payment already exists for this booking.'),409
        except ValueError: return jsonify(error='Enter valid payment amounts.'),400

    @app.get('/api/bookings/<int:booking_id>')
    def booking_details(booking_id):
        denied=user_required('admin','staff','customer');
        if denied: return denied
        with get_database() as db:
            booking=db.execute(
                """SELECT b.*,p.price package_price,p.estimated_minutes,
                          pay.id payment_id,pay.amount paid_amount,pay.discount,pay.method,pay.payment_date,pay.status payment_status
                   FROM bookings b
                   LEFT JOIN packages p ON p.package_name=b.package_name
                   LEFT JOIN payments pay ON pay.booking_id=b.id
                   WHERE b.id=?""",
                (booking_id,)
            ).fetchone()
        if not booking: return jsonify(error='Booking not found.'),404
        if session.get('role')=='customer' and booking['customer_name'] != session.get('full_name'):
            return jsonify(error='You do not have access to this booking.'),403
        result=dict(booking)
        result['estimated_time']=format_duration(result.get('estimated_minutes') or 0) if result.get('estimated_minutes') else 'Not available'
        return jsonify(result)

    @app.route('/api/admin/users',methods=['GET','POST','PUT'])
    def admin_users():
        denied=user_required('admin');
        if denied: return denied
        if request.method=='GET': return jsonify(rows("SELECT id,full_name,username,email,phone,role,created_at,last_login FROM users ORDER BY id"))
        d=request.get_json(silent=True) or {}; role=str(d.get('role','')).lower()
        if role not in {'admin','staff'}: return jsonify(error='Role must be admin or staff.'),400
        if len(str(d.get('password','')))<6: return jsonify(error='Password must contain at least 6 characters.'),400
        try:
            with get_database() as db:
                if request.method=='PUT':
                    cur=db.execute('UPDATE users SET full_name=?,username=?,password_hash=?,role=? WHERE id=?',
                      (str(d.get('fullName','')).strip(),str(d.get('username','')).strip(),generate_password_hash(str(d.get('password'))),role,int(d.get('id',0))))
                    if not cur.rowcount:return jsonify(error='User not found.'),404
                    return jsonify(message='User updated successfully.')
                cur=db.execute('INSERT INTO users(full_name,username,email,phone,password_hash,role) VALUES(?,?,?,?,?,?)',
                  (str(d.get('fullName','')).strip(),str(d.get('username','')).strip(),f"{str(d.get('username','')).strip()}@aqualux.local",'Not added',generate_password_hash(str(d.get('password'))),role))
            return jsonify(message='User created successfully.',id=cur.lastrowid),201
        except sqlite3.IntegrityError: return jsonify(error='Username already exists.'),409

    @app.get('/api/dashboard')
    def dashboard_data():
        denied=user_required('admin','staff');
        if denied: return denied
        today=date.today().isoformat()
        with get_database() as db:
            trend=[]
            for offset in range(6,-1,-1):
                day=(date.today()-timedelta(days=offset)).isoformat()
                trend.append({
                  'date':day,
                  'label':datetime.strptime(day,'%Y-%m-%d').strftime('%a'),
                  'bookings':db.execute('SELECT COUNT(*) FROM bookings WHERE booking_date=?',(day,)).fetchone()[0],
                  'income':db.execute('SELECT COALESCE(SUM(amount),0) FROM payments WHERE payment_date=?',(day,)).fetchone()[0]
                })
            result={
              'customers':db.execute('SELECT COUNT(*) FROM customers').fetchone()[0],
              'vehicles':db.execute('SELECT COUNT(*) FROM vehicles').fetchone()[0],
              'totalBookings':db.execute('SELECT COUNT(*) FROM bookings').fetchone()[0],
              'todayBookings':db.execute('SELECT COUNT(*) FROM bookings WHERE booking_date=?',(today,)).fetchone()[0],
              'pending':db.execute("SELECT COUNT(*) FROM bookings WHERE status='Pending'").fetchone()[0],
              'completed':db.execute("SELECT COUNT(*) FROM bookings WHERE status='Completed'").fetchone()[0],
              'todayIncome':db.execute('SELECT COALESCE(SUM(amount),0) FROM payments WHERE payment_date=?',(today,)).fetchone()[0],
              'cancelled':db.execute("SELECT COUNT(*) FROM bookings WHERE status='Cancelled'").fetchone()[0],
              'trend':trend,
              'recentBookings':[dict(row) for row in db.execute('SELECT id,customer_name,vehicle_no,vehicle_type,package_name,booking_date,booking_time,status FROM bookings ORDER BY booking_date DESC,booking_time DESC,id DESC LIMIT 6').fetchall()]
            }
        return jsonify(result)

    @app.get('/api/reports/<period>')
    def reports(period):
        denied=user_required('admin');
        if denied: return denied
        if period=='daily':
            q="""SELECT b.booking_date label,COUNT(DISTINCT b.id) bookings,SUM(CASE WHEN b.status='Completed' THEN 1 ELSE 0 END) completed,COALESCE(SUM(p.amount),0) income FROM bookings b LEFT JOIN payments p ON p.booking_id=b.id GROUP BY b.booking_date ORDER BY b.booking_date DESC"""
        elif period=='weekly':
            q="""SELECT strftime('%Y-W%W',b.booking_date) label,COUNT(DISTINCT b.id) bookings,SUM(CASE WHEN b.status='Completed' THEN 1 ELSE 0 END) completed,COALESCE(SUM(p.amount),0) income FROM bookings b LEFT JOIN payments p ON p.booking_id=b.id GROUP BY strftime('%Y-W%W',b.booking_date) ORDER BY label DESC"""
        else: return jsonify(error='Unknown report period.'),404
        return jsonify(rows(q))
