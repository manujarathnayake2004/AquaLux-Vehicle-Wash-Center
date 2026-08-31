let selectedBookingPrice = 0;

function calculatePayment() {
  const discountValue = Math.max(Number(document.getElementById('discount')?.value || 0), 0);
  const total = Math.max(selectedBookingPrice - discountValue, 0);
  const output = document.getElementById('paymentTotal');
  if (output) output.textContent = formatLKR(total);
}

async function readJsonResponse(response) {
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    const message = response.redirected || /<!doctype|<html/i.test(text)
      ? 'The AquaLux server returned a web page instead of payment data. Please make sure you are logged in as Staff/Admin and the Flask server is running.'
      : 'The AquaLux server returned an unexpected response.';
    throw new Error(message);
  }
  return response.json();
}

async function loadPaymentBooking() {
  const bookingField = document.getElementById('paymentBookingId');
  const priceField = document.getElementById('packagePrice');
  const raw = String(bookingField?.value || '').toUpperCase().replace('BK', '').trim();
  selectedBookingPrice = 0;
  if (priceField) priceField.value = '';
  calculatePayment();
  if (!/^\d+$/.test(raw)) return;

  try {
    const response = await fetch(`/api/bookings/${raw}`, { credentials: 'include' });
    const booking = await readJsonResponse(response);
    if (!response.ok) throw new Error(booking.error || 'Booking unavailable');

    selectedBookingPrice = Number(booking.package_price || 0);
    if (priceField) {
      priceField.value = selectedBookingPrice;
      priceField.title = `${booking.package_name} · ${booking.estimated_time}`;
    }
    calculatePayment();
  } catch (error) {
    if (priceField) priceField.placeholder = error.message;
  }
}

async function recordPayment(event) {
  event.preventDefault();
  const bookingIdField = document.getElementById('paymentBookingId');
  const bookingId = bookingIdField?.value || '';
  const rawBookingId = String(bookingId).toUpperCase().replace('BK', '').trim();
  const method = event.target.querySelector('select')?.value || 'Cash';
  const payload = {
    bookingId,
    discount: document.getElementById('discount')?.value || 0,
    method
  };

  try {
    const response = await fetch('/api/payments', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await readJsonResponse(response);
    if (!response.ok) throw new Error(data.error || 'Unable to record the payment.');

    alert(data.message || 'Payment recorded successfully.');

    // Successful checkout immediately opens the printable receipt for the
    // exact booking/payment that was just recorded.
    location.href = `receipt.html?bookingId=${encodeURIComponent(rawBookingId)}`;
  } catch (error) {
    alert(error.message || 'Error recording payment.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[onsubmit*="recordPayment"]');
  if (!form) return;

  const inputs = form.querySelectorAll('input');
  const bookingField = inputs[0];
  bookingField.id = 'paymentBookingId';
  bookingField.addEventListener('change', loadPaymentBooking);
  bookingField.addEventListener('blur', loadPaymentBooking);

  const priceField = document.getElementById('packagePrice');
  priceField.value = '';
  priceField.readOnly = true;
  priceField.removeAttribute('oninput');
  priceField.placeholder = 'Loaded from booking';

  document.getElementById('discount')?.addEventListener('input', calculatePayment);
  calculatePayment();
});
