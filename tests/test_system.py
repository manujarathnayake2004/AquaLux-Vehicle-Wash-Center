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
customers_response=client.get('/api/customers');expect(customers_response,200,'customer records')
customer_rows=customers_response.get_json()
assert customer_rows and {'id','name','phone','email','address'} <= customer_rows[0].keys()
vehicles_response=client.get('/api/vehicles');expect(vehicles_response,200,'vehicle records')
vehicle_rows=vehicles_response.get_json()
assert vehicle_rows and {'id','vehicle_no','vehicle_type','owner_name','notes'} <= vehicle_rows[0].keys()

customer_headers=['Customer ID','Name','Phone','Email','City','Action']
vehicle_headers=['Vehicle ID','Vehicle No','Vehicle Type','Owner','Service Notes','Action']
for relative_path,expected_headers in [
    ('pages/admin/manage-customers.html',customer_headers),
    ('pages/staff/customer-list.html',customer_headers),
    ('pages/admin/manage-vehicles.html',vehicle_headers),
    ('pages/staff/vehicle-list.html',vehicle_headers),
]:
    page=(ROOT/relative_path).read_text(encoding='utf-8')
    positions=[page.index(f'<th>{header}</th>') for header in expected_headers]
    assert positions == sorted(positions),f'Incorrect table-column order in {relative_path}'
    assert page.count('<th>Action</th>') == 1
table_script=(ROOT/'assets/js/main.js').read_text(encoding='utf-8')
assert "escapeHtml(r.address||'Not added')}</td><td>${directoryAction('customer',r.id)}" in table_script
assert "escapeHtml(r.notes||'No service notes')}</td><td>${directoryAction('vehicle',r.id)}" in table_script
print('PASS directory fields and actions use separate columns')
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
recommendation=client.post('/api/recommend',json={
    'vehicleType':'Car','dirtLevel':'High','interior':'Yes','specialCondition':'Mud',
    'daysSinceWash':60,'usage':'Daily','budget':'10000-20000','preferredDate':future
});expect(recommendation,200,'explainable AI recommendation')
recommendation_data=recommendation.get_json()
assert recommendation_data['packageName'] == 'Car Standard Wash'
assert recommendation_data['price'] == 15000
assert recommendation_data['estimatedMinutes'] == 180
assert recommendation_data['conditionProfile']['score'] >= 70
assert recommendation_data['conditionProfile']['level'] == 'Deep care recommended'
assert recommendation_data['conditionProfile']['nextWashDate']
assert recommendation_data['demandForecast']['method'] == 'Transparent historical weekday estimator'
assert recommendation_data['demandForecast']['dataQuality'] in {'Early estimate','Growing estimate','Established estimate'}
assert recommendation_data['requestId']
feedback=client.post('/api/ai/feedback',json={'requestId':recommendation_data['requestId'],'helpful':True})
expect(feedback,200,'AI recommendation feedback')
insights=client.get('/api/admin/ai-insights');expect(insights,200,'admin AI performance')
insight_data=insights.get_json()
assert insight_data['helpfulRate'] == 100
assert insight_data['accuracy'] is None
assert insight_data['modelReadiness'] in {'Collecting operational data','Ready for model experimentation'}
assert len(insight_data['weekdayDemand']) == 6
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

# Deep page review checks added after the full 45-page audit.
expect(client.post('/api/login',json={'username':'admin','password':'admin123'}),200,'admin re-login for deep checks')
settings=client.get('/api/admin/settings');expect(settings,200,'load system settings')
settings_update=client.put('/api/admin/settings',json={
    'centerName':'AquaLux Auto Spa','contactNumber':'0755004526','openingTime':'08:30','closingTime':'17:30'
});expect(settings_update,200,'update system settings')
public_settings=client.get('/api/public/settings');expect(public_settings,200,'public service settings')
assert public_settings.get_json()['opening_time']=='08:30'
assert public_settings.get_json()['closing_time']=='17:30'
updated_availability=client.get(f'/api/availability?date={future}').get_json()
assert updated_availability['openingTime']=='08:30'
assert updated_availability['closingTime']=='17:30'
assert updated_availability['freeTimes'][0] >= '08:30'
expect(client.post('/api/bookings',json={**booking,'time':'08:00'}),400,'booking before configured opening blocked')

users=client.get('/api/admin/users').get_json()
staff_user=next(row for row in users if row['username']=='staff')
expect(client.put('/api/admin/users',json={
    'id':staff_user['id'],'fullName':staff_user['full_name'],'username':'staff','password':'','role':'staff'
}),200,'edit user without forcing password reset')

expect(client.get('/data/aqualux.db'),404,'SQLite database is not publicly exposed')
expect(client.get('/server.py'),404,'Python source is not publicly exposed')

static_expectations={
    'pages/admin/system-settings.html':['saveSystemSettings(event)','assets/js/settings.js','Opening Time','Closing Time'],
    'pages/admin/add-user.html':['saveSystemUser(event)','<select id="role"'],
    'pages/admin/edit-user.html':['saveSystemUser(event)','New Password (optional)','Leave blank to keep current password'],
    'pages/staff/customer-details.html':['customerDetailContent','assets/js/customer-details.js'],
    'pages/customer/customer-profile.html':['data-user-email','data-user-phone','data-user-vehicle'],
}
for relative_path,tokens in static_expectations.items():
    page=(ROOT/relative_path).read_text(encoding='utf-8')
    for token in tokens:
        assert token in page,f'Missing {token!r} from {relative_path}'
print('PASS deep page review static fixes')
