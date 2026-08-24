"""Simple end-to-end API checks for the AquaLux student project."""
import tempfile
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
import server

database=tempfile.NamedTemporaryFile(suffix='.db',delete=False)
database.close()
server.DATABASE_PATH=Path(database.name)
server.init_database()
# Business tables are registered at import time; create them in the test database too.
from management import register_management
test_app=server.Flask(__name__,static_folder=str(ROOT),static_url_path='')
test_app.config.update(SECRET_KEY='test-secret',TESTING=True)
register_management(test_app,server.get_database)
client=test_app.test_client()

def expect(response,status,label):
    assert response.status_code==status,f'{label}: expected {status}, received {response.status_code}'
    print('PASS',label)

expect(client.get('/pages/admin/admin-dashboard.html'),302,'anonymous admin page blocked')
# Authentication APIs are on the main application, so use its test client from here.
client=server.app.test_client()
expect(client.post('/api/login',json={'username':'admin','password':'admin123'}),200,'admin login')
expect(client.get('/api/customers'),200,'customer records')
seeded_bookings=client.get('/api/bookings').get_json()
assert len({row['customer_name'] for row in seeded_bookings}) >= 8
assert {'Motorcycle','Car','Van','SUV'} <= {row['vehicle_type'] for row in seeded_bookings}
assert {'Completed','Pending','Cancelled'} <= {row['status'] for row in seeded_bookings}
assert len({(row['booking_date'],row['booking_time']) for row in seeded_bookings}) == len(seeded_bookings)
dashboard_seed=client.get('/api/dashboard').get_json()['recentBookings']
assert len({row['customer_name'] for row in dashboard_seed}) == len(dashboard_seed)
print('PASS varied and non-duplicated booking records')
expect(client.post('/api/customers',json={'name':'Test Customer','phone':'0771234567','email':'test.customer@example.com','address':'Matara'}),201,'add customer')
expect(client.post('/api/vehicles',json={'vehicleNo':'TEST-1001','vehicleType':'Car','owner':'Test Customer','notes':'Test vehicle'}),201,'add vehicle')
from datetime import date,timedelta
future_day=date.today()+timedelta(days=1)
while future_day.weekday() == 6:
    future_day += timedelta(days=1)
future=future_day.isoformat()
booking={'customer':'Test Customer','vehicleNo':'TEST-1001','vehicleType':'Car','packageName':'Car Standard Wash','date':future,'time':'09:00'}
first=client.post('/api/bookings',json=booking);expect(first,201,'create booking')
expect(client.post('/api/bookings',json=booking),409,'duplicate slot blocked')
booking_id=first.get_json()['id']
payment=client.post('/api/payments',json={'bookingId':f'BK{booking_id}','price':1,'discount':100,'method':'Cash'});expect(payment,201,'record payment uses catalogue price')
assert payment.get_json()['total'] == 14900
expect(client.get('/api/reports/daily'),200,'daily report')
recommendation=client.post('/api/recommend',json={'vehicleType':'Car','dirtLevel':'High','interior':'Yes'});expect(recommendation,200,'AI recommendation')
assert recommendation.get_json()['packageName'] == 'Car Standard Wash'
assert recommendation.get_json()['price'] == 15000
assert recommendation.get_json()['estimatedMinutes'] == 180
availability=client.get(f'/api/availability?date={future}')
expect(availability,200,'service availability')
availability_data=availability.get_json()
assert {'openingTime','closingTime','peakDays','bookedTimes','freeTimes','nextAvailableDays','busyDayChart'} <= availability_data.keys()
assert availability_data['peakDays'] == ['Saturday']
sunday=date.today()+timedelta(days=(6-date.today().weekday())%7 or 7)
sunday_booking={**booking,'date':sunday.isoformat(),'time':'17:30'}
expect(client.post('/api/bookings',json=sunday_booking),400,'Sunday booking blocked')
sunday_availability=client.get(f'/api/availability?date={sunday.isoformat()}').get_json()
assert sunday_availability['serviceOpen'] is False
assert sunday_availability['bookedTimes'] == []
expect(client.post('/api/logout'),200,'logout')
expect(client.get('/api/dashboard'),401,'API blocked after logout')
print('All AquaLux system checks passed.')
