let activeWashPackages = [];

function ensureBookingSelects() {
  const currentPackageField = document.getElementById('package');
  if (currentPackageField && currentPackageField.tagName !== 'SELECT') {
    const select = document.createElement('select');
    select.id = 'package';
    select.required = true;
    select.innerHTML = '<option value="">Select vehicle type first</option>';
    currentPackageField.replaceWith(select);
  }
  const currentStatusField = document.getElementById('status');
  if (currentStatusField && currentStatusField.tagName !== 'SELECT') {
    const select = document.createElement('select');
    select.id = 'status';
    select.required = true;
    select.innerHTML = '<option>Pending</option><option>Completed</option><option>Cancelled</option>';
    currentStatusField.replaceWith(select);
  }
}

function packageOptionLabel(item) {
  return `${item.package_name} — ${formatLKR(item.price)} · ${formatServiceDuration(item.estimated_minutes)}`;
}

function populatePackageOptions(vehicleType, selectedName = '') {
  const field = document.getElementById('package');
  if (!field) return;
  const matches = activeWashPackages.filter((item) => !vehicleType || item.vehicle_type === vehicleType);
  field.innerHTML = '<option value="">Select package</option>' + matches.map((item) =>
    `<option value="${escapeHtml(item.package_name)}"${item.package_name === selectedName ? ' selected' : ''}>${escapeHtml(packageOptionLabel(item))}</option>`
  ).join('');
}

async function loadBookingPackages() {
  try {
    activeWashPackages = await apiRows('/api/public/packages');
    const vehicleField = document.getElementById('vehicleType');
    populatePackageOptions(vehicleField?.value || '');
    vehicleField?.addEventListener('change', () => populatePackageOptions(vehicleField.value));
  } catch (error) {
    const field = document.getElementById('package');
    if (field) field.innerHTML = '<option value="">Packages unavailable</option>';
  }
}

async function loadBookingIntoForm() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || params.get('rebook');
  if (!id) return;
  try {
    const response = await fetch(`/api/bookings/${encodeURIComponent(id)}`, { credentials: 'include' });
    const row = await response.json();
    if (!response.ok) throw new Error(row.error || 'Booking unavailable');
    if (document.getElementById('bookingId')) bookingId.value = `BK${row.id}`;
    if (document.getElementById('customer')) customer.value = row.customer_name;
    if (document.getElementById('vehicleNo')) vehicleNo.value = row.vehicle_no;
    if (document.getElementById('vehicleType')) vehicleType.value = row.vehicle_type;
    populatePackageOptions(row.vehicle_type, row.package_name);
    if (document.getElementById('date') && !params.has('rebook')) date.value = row.booking_date;
    if (document.getElementById('time') && !params.has('rebook')) time.value = row.booking_time;
    if (document.getElementById('status')) status.value = row.status;
  } catch (error) {
    alert(error.message);
  }
}

async function saveBooking(event) {
  event.preventDefault();
  if (!validateRequiredForm(event.target)) return alert('Please fill all required fields');
  const cancelField = document.getElementById('reason');
  const bookingField = document.getElementById('bookingId');
  const customerField = document.getElementById('customer');
  const packageField = document.getElementById('package');
  let payload;
  if (cancelField) {
    payload = { action: 'cancel', bookingId: bookingField.value, reason: cancelField.value };
  } else if (bookingField) {
    payload = { bookingId: bookingField.value, packageName: packageField.value, date: date.value, time: time.value, status: status.value };
  } else {
    payload = { customer: customerField?.value || '', vehicleNo: vehicleNo.value, vehicleType: vehicleType.value, packageName: packageField.value, date: date.value, time: time.value };
  }
  const response = await fetch('/api/bookings', { method: bookingField ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await response.json();
  alert(data.message || data.error);
  if (response.ok) {
    event.target.reset();
    populatePackageOptions('');
  }
}

function updateBookingStatus(statusName) {
  alert(`Use Update Booking to change the status to ${statusName}.`);
}

document.addEventListener('DOMContentLoaded', async () => {
  ensureBookingSelects();
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const dateField = document.getElementById('date');
  const timeField = document.getElementById('time');
  if (dateField) dateField.min = localToday;
  if (timeField) { timeField.min = '08:00'; timeField.max = '17:30'; timeField.step = '1800'; }
  await loadBookingPackages();
  await loadBookingIntoForm();
});
