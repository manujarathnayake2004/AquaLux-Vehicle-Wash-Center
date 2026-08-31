let activeWashPackages = [];
let serviceHours = { opening_time: '08:00', closing_time: '18:00' };

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

function previousHalfHour(timeValue) {
  const [hour, minute] = String(timeValue || '18:00').split(':').map(Number);
  let total = hour * 60 + minute - 30;
  total = Math.max(0, total);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

async function loadServiceHours() {
  try {
    const response = await fetch('/api/public/settings', { credentials: 'include' });
    if (response.ok) serviceHours = await response.json();
  } catch (error) {
    console.info('Using default AquaLux service hours.');
  }
  const timeField = document.getElementById('time');
  if (timeField) {
    timeField.min = serviceHours.opening_time || '08:00';
    timeField.max = previousHalfHour(serviceHours.closing_time || '18:00');
    timeField.step = '1800';
    timeField.title = `Available starts: ${timeField.min} to ${timeField.max}, every 30 minutes`;
  }
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

async function prefillCustomerBooking() {
  if (!location.pathname.includes('/pages/customer/') || !document.getElementById('vehicleNo')) return;
  try {
    const response = await fetch('/api/session', { credentials: 'include' });
    const data = await response.json();
    if (!response.ok || data.user?.role !== 'customer') return;
    const vehicleNoField = document.getElementById('vehicleNo');
    const vehicleTypeField = document.getElementById('vehicleType');
    if (data.user.vehicle_number && !vehicleNoField.value) vehicleNoField.value = data.user.vehicle_number;
    if (data.user.vehicle_type && vehicleTypeField) {
      vehicleTypeField.value = data.user.vehicle_type;
      populatePackageOptions(data.user.vehicle_type);
    }
  } catch (error) {
    console.info('Customer vehicle could not be prefilled.');
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
    if (document.getElementById('time') && !params.has('rebook')) time.value = String(row.booking_time).slice(0, 5);
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
    payload = { action: 'cancel', bookingId: bookingField.value, reason: cancelField.value.trim() };
  } else if (bookingField) {
    payload = {
      bookingId: bookingField.value,
      packageName: packageField.value,
      date: date.value,
      time: time.value,
      status: status.value
    };
  } else {
    payload = {
      customer: customerField?.value.trim() || '',
      vehicleNo: vehicleNo.value.trim(),
      vehicleType: vehicleType.value,
      packageName: packageField.value,
      date: date.value,
      time: time.value
    };
  }

  const response = await fetch('/api/bookings', {
    method: bookingField ? 'PUT' : 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  alert(data.message || data.error);

  if (response.ok) {
    if (cancelField) {
      location.href = 'booking-list.html';
      return;
    }
    if (bookingField) {
      location.href = 'booking-list.html';
      return;
    }
    event.target.reset();
    populatePackageOptions('');
    if (location.pathname.includes('/pages/customer/')) {
      location.href = 'my-bookings.html';
    }
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
  if (dateField) dateField.min = localToday;

  await Promise.all([loadBookingPackages(), loadServiceHours()]);
  await prefillCustomerBooking();
  await loadBookingIntoForm();
});
