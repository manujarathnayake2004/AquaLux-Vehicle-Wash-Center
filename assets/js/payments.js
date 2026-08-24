let selectedBookingPrice = 0;

function calculatePayment() {
  const discountValue = Math.max(Number(document.getElementById('discount')?.value || 0), 0);
  const total = Math.max(selectedBookingPrice - discountValue, 0);
  const output = document.getElementById('paymentTotal');
  if (output) output.textContent = formatLKR(total);
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
    const booking = await response.json();
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
  const bookingId = document.getElementById('paymentBookingId')?.value || '';
  const method = event.target.querySelector('select')?.value || 'Cash';
  const payload = { bookingId, discount: document.getElementById('discount')?.value || 0, method };
  const response = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await response.json();
  alert(data.message || data.error);
  if (response.ok) {
    event.target.reset();
    selectedBookingPrice = 0;
    document.getElementById('packagePrice').value = '';
    calculatePayment();
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
