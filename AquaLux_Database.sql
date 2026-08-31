BEGIN TRANSACTION;
CREATE TABLE ai_feedback (
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
CREATE TABLE ai_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                request_type TEXT NOT NULL,
                message TEXT,
                vehicle_type TEXT,
                result_summary TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
INSERT INTO "ai_requests" VALUES(1,4,'package_recommendation','Dirt: High; Interior: Yes','SUV','SUV Full Wash','2026-08-18 18:02:19');
INSERT INTO "ai_requests" VALUES(2,4,'assistant_recommendation','My BMW i8 is very dirty','Car','Car Full Wash','2026-08-18 18:03:19');
INSERT INTO "ai_requests" VALUES(3,4,'assistant_recommendation','Does the Car package include interior cleaning?','Car','Car Full Wash','2026-08-18 18:03:24');
INSERT INTO "ai_requests" VALUES(4,4,'assistant_recommendation','Recommend a wash for my motorcycle','Motorcycle','Bike Basic Wash','2026-08-23 08:15:20');
INSERT INTO "ai_requests" VALUES(5,4,'assistant_recommendation','Does the Motorcycle package include interior cleaning?','Motorcycle','Bike Basic Wash','2026-08-23 08:15:23');
INSERT INTO "ai_requests" VALUES(6,4,'busy_day_prediction','What is the busiest booking day?','','Friday','2026-08-23 08:15:24');
INSERT INTO "ai_requests" VALUES(7,4,'assistant_recommendation','Recommend a wash for my muddy SUV','SUV','SUV Full Wash','2026-08-23 08:15:35');
INSERT INTO "ai_requests" VALUES(8,1,'package_recommendation','Dirt: High; Interior: Yes','Motorcycle','Bike Basic Wash','2026-08-23 17:53:43');
INSERT INTO "ai_requests" VALUES(9,1,'package_recommendation','Dirt: High; Interior: Yes','Car','Car Standard Wash','2026-08-23 17:53:43');
INSERT INTO "ai_requests" VALUES(10,1,'package_recommendation','Dirt: High; Interior: Yes','Van','Van Full Wash','2026-08-23 17:53:43');
INSERT INTO "ai_requests" VALUES(11,1,'package_recommendation','Dirt: High; Interior: Yes','SUV','SUV Full Wash','2026-08-23 17:53:43');
INSERT INTO "ai_requests" VALUES(12,2,'package_recommendation','Dirt: High; Interior: Yes','Motorcycle','Bike Basic Wash','2026-08-23 17:53:44');
INSERT INTO "ai_requests" VALUES(13,2,'package_recommendation','Dirt: High; Interior: Yes','Car','Car Standard Wash','2026-08-23 17:53:44');
INSERT INTO "ai_requests" VALUES(14,2,'package_recommendation','Dirt: High; Interior: Yes','Van','Van Full Wash','2026-08-23 17:53:44');
INSERT INTO "ai_requests" VALUES(15,2,'package_recommendation','Dirt: High; Interior: Yes','SUV','SUV Full Wash','2026-08-23 17:53:44');
INSERT INTO "ai_requests" VALUES(16,3,'package_recommendation','Dirt: High; Interior: Yes','Motorcycle','Bike Basic Wash','2026-08-23 17:53:44');
INSERT INTO "ai_requests" VALUES(17,3,'package_recommendation','Dirt: High; Interior: Yes','Car','Car Standard Wash','2026-08-23 17:53:44');
INSERT INTO "ai_requests" VALUES(18,3,'package_recommendation','Dirt: High; Interior: Yes','Van','Van Full Wash','2026-08-23 17:53:44');
INSERT INTO "ai_requests" VALUES(19,3,'package_recommendation','Dirt: High; Interior: Yes','SUV','SUV Full Wash','2026-08-23 17:53:44');
CREATE TABLE bookings (
          id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL,
          vehicle_no TEXT NOT NULL, vehicle_type TEXT NOT NULL, package_name TEXT NOT NULL,
          booking_date TEXT NOT NULL, booking_time TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Pending', cancellation_reason TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO "bookings" VALUES(1,'Nimal Perera','CAR-4587','Car','Car Standard Wash','2026-08-24','08:00','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(2,'Kamal Silva','SUV-2231','SUV','SUV Full Wash','2026-08-24','08:30','Pending',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(3,'Anjali Fernando','BIKE-7812','Motorcycle','Bike Basic Wash','2026-08-24','09:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(4,'Dinesh Jayawardena','VAN-9045','Van','Van Full Wash','2026-08-24','10:30','Cancelled','Customer requested a different service day','2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(5,'Tharushi Senanayake','CAR-6719','Car','Car Standard Wash','2026-08-25','08:00','Pending',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(6,'Ruwan Kumara','SUV-4410','SUV','SUV Full Wash','2026-08-25','08:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(7,'Ishara Gunawardena','BIKE-3028','Motorcycle','Bike Basic Wash','2026-08-25','09:30','Cancelled','Customer requested a different service day','2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(8,'Malith Peris','CAR-1186','Car','Car Standard Wash','2026-08-25','10:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(9,'Sachini Wijesinghe','VAN-5524','Van','Van Full Wash','2026-08-25','12:00','Pending',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(10,'Kasun Maduranga','SUV-8093','SUV','SUV Full Wash','2026-08-26','08:00','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(11,'Nadeesha Ramanayake','CAR-7342','Car','Car Standard Wash','2026-08-26','08:30','Cancelled','Customer requested a different service day','2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(12,'Chamod Lakshan','BIKE-6605','Motorcycle','Bike Basic Wash','2026-08-26','09:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(13,'Nimal Perera','CAR-4587','Car','Car Standard Wash','2026-08-27','08:00','Cancelled','Customer requested a different service day','2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(14,'Kamal Silva','SUV-2231','SUV','SUV Full Wash','2026-08-27','08:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(15,'Anjali Fernando','BIKE-7812','Motorcycle','Bike Basic Wash','2026-08-27','09:30','Pending',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(16,'Dinesh Jayawardena','VAN-9045','Van','Van Full Wash','2026-08-27','10:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(17,'Tharushi Senanayake','CAR-6719','Car','Car Standard Wash','2026-08-27','12:00','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(18,'Ruwan Kumara','SUV-4410','SUV','SUV Full Wash','2026-08-27','13:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(19,'Ishara Gunawardena','BIKE-3028','Motorcycle','Bike Basic Wash','2026-08-28','08:00','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(20,'Malith Peris','CAR-1186','Car','Car Standard Wash','2026-08-28','08:30','Pending',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(21,'Sachini Wijesinghe','VAN-5524','Van','Van Full Wash','2026-08-28','09:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(22,'Kasun Maduranga','SUV-8093','SUV','SUV Full Wash','2026-08-28','10:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(23,'Nadeesha Ramanayake','CAR-7342','Car','Car Standard Wash','2026-08-28','12:00','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(24,'Chamod Lakshan','BIKE-6605','Motorcycle','Bike Basic Wash','2026-08-29','08:00','Pending',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(25,'Nimal Perera','CAR-4587','Car','Car Standard Wash','2026-08-29','08:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(26,'Kamal Silva','SUV-2231','SUV','SUV Full Wash','2026-08-29','09:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(27,'Anjali Fernando','BIKE-7812','Motorcycle','Bike Basic Wash','2026-08-29','10:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(28,'Dinesh Jayawardena','VAN-9045','Van','Van Full Wash','2026-08-29','12:00','Pending',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(29,'Tharushi Senanayake','CAR-6719','Car','Car Standard Wash','2026-08-29','13:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(30,'Ruwan Kumara','SUV-4410','SUV','SUV Full Wash','2026-08-29','15:00','Cancelled','Customer requested a different service day','2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(31,'Ishara Gunawardena','BIKE-3028','Motorcycle','Bike Basic Wash','2026-08-29','16:30','Completed',NULL,'2026-08-27 08:37:34');
INSERT INTO "bookings" VALUES(32,'Nimal Perera','CAR-4587','Car','Car Standard Wash','2026-08-31','08:00','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(33,'Kamal Silva','SUV-2231','SUV','SUV Full Wash','2026-08-31','08:30','Pending',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(34,'Anjali Fernando','BIKE-7812','Motorcycle','Bike Basic Wash','2026-08-31','09:30','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(35,'Dinesh Jayawardena','VAN-9045','Van','Van Full Wash','2026-08-31','10:30','Cancelled','Customer requested a different service day','2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(36,'Tharushi Senanayake','CAR-6719','Car','Car Standard Wash','2026-09-01','08:00','Pending',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(37,'Ruwan Kumara','SUV-4410','SUV','SUV Full Wash','2026-09-01','08:30','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(38,'Ishara Gunawardena','BIKE-3028','Motorcycle','Bike Basic Wash','2026-09-01','09:30','Cancelled','Customer requested a different service day','2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(39,'Malith Peris','CAR-1186','Car','Car Standard Wash','2026-09-01','10:30','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(40,'Sachini Wijesinghe','VAN-5524','Van','Van Full Wash','2026-09-01','12:00','Pending',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(41,'Kasun Maduranga','SUV-8093','SUV','SUV Full Wash','2026-09-02','08:00','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(42,'Nadeesha Ramanayake','CAR-7342','Car','Car Standard Wash','2026-09-02','08:30','Cancelled','Customer requested a different service day','2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(43,'Chamod Lakshan','BIKE-6605','Motorcycle','Bike Basic Wash','2026-09-02','09:30','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(44,'Nimal Perera','CAR-4587','Car','Car Standard Wash','2026-09-03','08:00','Cancelled','Customer requested a different service day','2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(45,'Kamal Silva','SUV-2231','SUV','SUV Full Wash','2026-09-03','08:30','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(46,'Anjali Fernando','BIKE-7812','Motorcycle','Bike Basic Wash','2026-09-03','09:30','Pending',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(47,'Dinesh Jayawardena','VAN-9045','Van','Van Full Wash','2026-09-03','10:30','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(48,'Tharushi Senanayake','CAR-6719','Car','Car Standard Wash','2026-09-03','12:00','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(49,'Ruwan Kumara','SUV-4410','SUV','SUV Full Wash','2026-09-03','13:30','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(50,'Ishara Gunawardena','BIKE-3028','Motorcycle','Bike Basic Wash','2026-09-04','08:00','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(51,'Malith Peris','CAR-1186','Car','Car Standard Wash','2026-09-04','08:30','Pending',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(52,'Sachini Wijesinghe','VAN-5524','Van','Van Full Wash','2026-09-04','09:30','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(53,'Kasun Maduranga','SUV-8093','SUV','SUV Full Wash','2026-09-04','10:30','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(54,'Nadeesha Ramanayake','CAR-7342','Car','Car Standard Wash','2026-09-04','12:00','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(55,'Chamod Lakshan','BIKE-6605','Motorcycle','Bike Basic Wash','2026-09-05','08:00','Pending',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(56,'Nimal Perera','CAR-4587','Car','Car Standard Wash','2026-09-05','08:30','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(57,'Kamal Silva','SUV-2231','SUV','SUV Full Wash','2026-09-05','09:30','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(58,'Anjali Fernando','BIKE-7812','Motorcycle','Bike Basic Wash','2026-09-05','10:30','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(59,'Dinesh Jayawardena','VAN-9045','Van','Van Full Wash','2026-09-05','12:00','Pending',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(60,'Tharushi Senanayake','CAR-6719','Car','Car Standard Wash','2026-09-05','13:30','Completed',NULL,'2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(61,'Ruwan Kumara','SUV-4410','SUV','SUV Full Wash','2026-09-05','15:00','Cancelled','Customer requested a different service day','2026-08-31 16:46:41');
INSERT INTO "bookings" VALUES(62,'Ishara Gunawardena','BIKE-3028','Motorcycle','Bike Basic Wash','2026-09-05','16:30','Completed',NULL,'2026-08-31 16:46:41');
CREATE TABLE customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
          phone TEXT NOT NULL, email TEXT UNIQUE, address TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO "customers" VALUES(1,'Nimal Perera','0712345678','nimal@mail.com','Matara','2026-08-18 17:58:28');
INSERT INTO "customers" VALUES(2,'Kamal Silva','0778889999','kamal@mail.com','Colombo','2026-08-18 17:58:28');
INSERT INTO "customers" VALUES(3,'Anjali Fernando','0763412087','anjali@mail.com','Galle','2026-08-23 17:52:20');
INSERT INTO "customers" VALUES(4,'Dinesh Jayawardena','0759081426','dinesh@mail.com','Weligama','2026-08-23 17:52:20');
INSERT INTO "customers" VALUES(5,'Tharushi Senanayake','0704567812','tharushi@mail.com','Akuressa','2026-08-23 17:52:20');
INSERT INTO "customers" VALUES(6,'Ruwan Kumara','0782134609','ruwan@mail.com','Kamburupitiya','2026-08-23 17:52:20');
INSERT INTO "customers" VALUES(7,'Ishara Gunawardena','0726148093','ishara@mail.com','Dikwella','2026-08-23 17:52:20');
INSERT INTO "customers" VALUES(8,'Malith Peris','0743921750','malith@mail.com','Matara','2026-08-23 17:52:20');
INSERT INTO "customers" VALUES(9,'Sachini Wijesinghe','0775032468','sachini@mail.com','Galle','2026-08-23 17:52:20');
INSERT INTO "customers" VALUES(10,'Kasun Maduranga','0718452309','kasun@mail.com','Deniyaya','2026-08-23 17:52:20');
INSERT INTO "customers" VALUES(11,'Nadeesha Ramanayake','0769023145','nadeesha@mail.com','Mirissa','2026-08-23 17:52:20');
INSERT INTO "customers" VALUES(12,'Chamod Lakshan','0751268374','chamod@mail.com','Hakmana','2026-08-23 17:52:20');
CREATE TABLE data_migrations (
          name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO "data_migrations" VALUES('home-catalogue-v2','2026-08-23 17:52:20');
INSERT INTO "data_migrations" VALUES('booking-exact-duplicate-cleanup-v1','2026-08-31 16:46:41');
CREATE TABLE packages (
          id INTEGER PRIMARY KEY AUTOINCREMENT, package_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
          vehicle_type TEXT NOT NULL, price REAL NOT NULL CHECK(price >= 0),
          estimated_minutes INTEGER NOT NULL CHECK(estimated_minutes > 0), active INTEGER NOT NULL DEFAULT 1
        );
INSERT INTO "packages" VALUES(1,'Bike Basic Wash','Motorcycle',7500.0,120,1);
INSERT INTO "packages" VALUES(2,'Car Standard Wash','Car',15000.0,180,1);
INSERT INTO "packages" VALUES(4,'Van Full Wash','Van',20000.0,240,1);
INSERT INTO "packages" VALUES(5,'SUV Full Wash','SUV',22500.0,240,1);
CREATE TABLE payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT, booking_id INTEGER NOT NULL UNIQUE,
          amount REAL NOT NULL CHECK(amount >= 0), discount REAL NOT NULL DEFAULT 0,
          method TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Paid',
          payment_date TEXT NOT NULL DEFAULT CURRENT_DATE,
          FOREIGN KEY(booking_id) REFERENCES bookings(id)
        );
INSERT INTO "payments" VALUES(1,1,15000.0,0.0,'Cash','Paid','2026-08-24');
INSERT INTO "payments" VALUES(2,3,7500.0,0.0,'Cash','Paid','2026-08-24');
INSERT INTO "payments" VALUES(3,6,22500.0,0.0,'Cash','Paid','2026-08-25');
INSERT INTO "payments" VALUES(4,8,15000.0,0.0,'Cash','Paid','2026-08-25');
INSERT INTO "payments" VALUES(5,10,22500.0,0.0,'Cash','Paid','2026-08-26');
INSERT INTO "payments" VALUES(6,12,7500.0,0.0,'Cash','Paid','2026-08-26');
INSERT INTO "payments" VALUES(7,14,22500.0,0.0,'Cash','Paid','2026-08-27');
INSERT INTO "payments" VALUES(8,16,20000.0,0.0,'Cash','Paid','2026-08-27');
INSERT INTO "payments" VALUES(9,17,15000.0,0.0,'Cash','Paid','2026-08-27');
INSERT INTO "payments" VALUES(10,18,22500.0,0.0,'Cash','Paid','2026-08-27');
INSERT INTO "payments" VALUES(11,19,7500.0,0.0,'Cash','Paid','2026-08-28');
INSERT INTO "payments" VALUES(12,21,20000.0,0.0,'Cash','Paid','2026-08-28');
INSERT INTO "payments" VALUES(13,22,22500.0,0.0,'Cash','Paid','2026-08-28');
INSERT INTO "payments" VALUES(14,23,15000.0,0.0,'Cash','Paid','2026-08-28');
INSERT INTO "payments" VALUES(15,25,15000.0,0.0,'Cash','Paid','2026-08-29');
INSERT INTO "payments" VALUES(16,26,22500.0,0.0,'Cash','Paid','2026-08-29');
INSERT INTO "payments" VALUES(17,27,7500.0,0.0,'Cash','Paid','2026-08-29');
INSERT INTO "payments" VALUES(18,29,15000.0,0.0,'Cash','Paid','2026-08-29');
INSERT INTO "payments" VALUES(19,31,7500.0,0.0,'Cash','Paid','2026-08-29');
INSERT INTO "payments" VALUES(20,32,15000.0,0.0,'Cash','Paid','2026-08-31');
INSERT INTO "payments" VALUES(21,34,7500.0,0.0,'Cash','Paid','2026-08-31');
INSERT INTO "payments" VALUES(22,37,22500.0,0.0,'Cash','Paid','2026-09-01');
INSERT INTO "payments" VALUES(23,39,15000.0,0.0,'Cash','Paid','2026-09-01');
INSERT INTO "payments" VALUES(24,41,22500.0,0.0,'Cash','Paid','2026-09-02');
INSERT INTO "payments" VALUES(25,43,7500.0,0.0,'Cash','Paid','2026-09-02');
INSERT INTO "payments" VALUES(26,45,22500.0,0.0,'Cash','Paid','2026-09-03');
INSERT INTO "payments" VALUES(27,47,20000.0,0.0,'Cash','Paid','2026-09-03');
INSERT INTO "payments" VALUES(28,48,15000.0,0.0,'Cash','Paid','2026-09-03');
INSERT INTO "payments" VALUES(29,49,22500.0,0.0,'Cash','Paid','2026-09-03');
INSERT INTO "payments" VALUES(30,50,7500.0,0.0,'Cash','Paid','2026-09-04');
INSERT INTO "payments" VALUES(31,52,20000.0,0.0,'Cash','Paid','2026-09-04');
INSERT INTO "payments" VALUES(32,53,22500.0,0.0,'Cash','Paid','2026-09-04');
INSERT INTO "payments" VALUES(33,54,15000.0,0.0,'Cash','Paid','2026-09-04');
INSERT INTO "payments" VALUES(34,56,15000.0,0.0,'Cash','Paid','2026-09-05');
INSERT INTO "payments" VALUES(35,57,22500.0,0.0,'Cash','Paid','2026-09-05');
INSERT INTO "payments" VALUES(36,58,7500.0,0.0,'Cash','Paid','2026-09-05');
INSERT INTO "payments" VALUES(37,60,15000.0,0.0,'Cash','Paid','2026-09-05');
INSERT INTO "payments" VALUES(38,62,7500.0,0.0,'Cash','Paid','2026-09-05');
CREATE TABLE system_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      center_name TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      opening_time TEXT NOT NULL,
      closing_time TEXT NOT NULL
    );
INSERT INTO "system_settings" VALUES(1,'AquaLux Auto Spa','0755004526','08:00','18:00');
CREATE TABLE users (
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
INSERT INTO "users" VALUES(1,'System Administrator','admin','admin@aqualux.local','0755004526',NULL,NULL,'scrypt:32768:8:1$00O4CFnwiHWOEFvy$0074f99511ef13a7689779dee252a8fd1bc97955d37b0722a9c5eafa7cf90d42baa725d35f68bfb5d16dd3129fc327b70f06def375746a3155ff6e51076920af','admin','2026-08-18 17:58:28','2026-08-24 20:43:35');
INSERT INTO "users" VALUES(2,'AquaLux Staff','staff','staff@aqualux.local','0755004527',NULL,NULL,'scrypt:32768:8:1$2SLdn8nzvJ1x4jH9$5763eb08512347af078ddd38c14b9b8afae990d12eada67fc6a9a665b032ca60efa9645b556a87a7a86987a21946371a6548dcb05867daf7ef1a08ffbddf7848','staff','2026-08-18 17:58:28','2026-08-23 17:53:43');
INSERT INTO "users" VALUES(3,'Demo Customer','customer','customer@aqualux.local','0771234567','Car','DEMO-1234','scrypt:32768:8:1$ZO4oVf9kXnQrMnlI$a0b9dd107c1df2278f10e2ac0701ad5362e6fcaee747df24d172a3fe9157264599808558b2102514b9be751a7b91b9cd5e836473bf305ce8ab7d43b84aa565d2','customer','2026-08-18 17:58:28','2026-08-23 17:53:44');
INSERT INTO "users" VALUES(4,'Manuja rathnayake','Manu','manujarathnayake2004@gmail.com','0712845231','Car','SP CCB 6969','scrypt:32768:8:1$KvoFcvrl8ow7O7Ax$9aba44782788d282cd95faab37879861b7b8b49f2101885a6ebeb8576a807f74aeddbd570fb8b519257caa392754e8b046486748d06b91c14be45b75d7a03d6c','customer','2026-08-18 18:01:29','2026-08-24 20:42:47');
CREATE TABLE vehicles (
          id INTEGER PRIMARY KEY AUTOINCREMENT, vehicle_no TEXT NOT NULL UNIQUE COLLATE NOCASE,
          vehicle_type TEXT NOT NULL, owner_name TEXT NOT NULL, notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO "vehicles" VALUES(1,'CAR-4587','Car','Nimal Perera','Regular customer vehicle','2026-08-18 17:58:28');
INSERT INTO "vehicles" VALUES(2,'SUV-2231','SUV','Kamal Silva','Full exterior and interior wash','2026-08-18 17:58:28');
INSERT INTO "vehicles" VALUES(3,'BIKE-7812','Motorcycle','Anjali Fernando','Red sport motorcycle','2026-08-23 17:52:20');
INSERT INTO "vehicles" VALUES(4,'VAN-9045','Van','Dinesh Jayawardena','Silver passenger van','2026-08-23 17:52:20');
INSERT INTO "vehicles" VALUES(5,'CAR-6719','Car','Tharushi Senanayake','Blue compact car','2026-08-23 17:52:20');
INSERT INTO "vehicles" VALUES(6,'SUV-4410','SUV','Ruwan Kumara','White family SUV','2026-08-23 17:52:20');
INSERT INTO "vehicles" VALUES(7,'BIKE-3028','Motorcycle','Ishara Gunawardena','Black commuter motorcycle','2026-08-23 17:52:20');
INSERT INTO "vehicles" VALUES(8,'CAR-1186','Car','Malith Peris','Grey luxury saloon','2026-08-23 17:52:20');
INSERT INTO "vehicles" VALUES(9,'VAN-5524','Van','Sachini Wijesinghe','White delivery van','2026-08-23 17:52:20');
INSERT INTO "vehicles" VALUES(10,'SUV-8093','SUV','Kasun Maduranga','Green off-road SUV','2026-08-23 17:52:20');
INSERT INTO "vehicles" VALUES(11,'CAR-7342','Car','Nadeesha Ramanayake','Red hatchback','2026-08-23 17:52:20');
INSERT INTO "vehicles" VALUES(12,'BIKE-6605','Motorcycle','Chamod Lakshan','Blue street motorcycle','2026-08-23 17:52:20');
CREATE UNIQUE INDEX active_booking_slot
          ON bookings(booking_date, booking_time) WHERE status != 'Cancelled';
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('users',49);
INSERT INTO "sqlite_sequence" VALUES('packages',66);
INSERT INTO "sqlite_sequence" VALUES('customers',12);
INSERT INTO "sqlite_sequence" VALUES('vehicles',12);
INSERT INTO "sqlite_sequence" VALUES('ai_requests',19);
INSERT INTO "sqlite_sequence" VALUES('bookings',62);
INSERT INTO "sqlite_sequence" VALUES('payments',38);
COMMIT;
