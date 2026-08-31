// Professional staff payment receipt renderer.
// This page-specific override keeps booking-details.html behavior untouched.
function receiptMoney(value) {
  return 'LKR ' + Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function receiptDate(value, withTime = false) {
  if (!value) return 'Not available';
  const text = String(value).trim();
  let date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [y, m, d] = text.split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(text.replace(' ', 'T'));
  }
  if (Number.isNaN(date.getTime())) return escapeHtml(text);
  return date.toLocaleString('en-US', withTime
    ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function receiptClock(value) {
  const raw = String(value || '').trim();
  if (!/^\d{2}:\d{2}/.test(raw)) return escapeHtml(raw || 'Not available');
  const [hour, minute] = raw.slice(0, 5).split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function prettyPhone(value) {
  const text = String(value || '').trim();
  if (/^0\d{9}$/.test(text)) return `${text.slice(0, 3)} ${text.slice(3, 6)} ${text.slice(6)}`;
  return text || 'Not available';
}

async function findReceiptCustomer(name) {
  try {
    const customers = await apiRows('/api/customers');
    return customers.find(row => String(row.name || '').trim().toLowerCase() === String(name || '').trim().toLowerCase()) || null;
  } catch (error) {
    console.warn('Customer contact details were not available for the receipt.', error);
    return null;
  }
}

loadBookingDocumentPage = async function (page) {
  if (page !== 'receipt.html') return;
  const receipt = document.getElementById('professionalReceipt');
  const bookingId = new URLSearchParams(location.search).get('bookingId') || new URLSearchParams(location.search).get('id');
  if (!receipt) return;
  if (!bookingId || !/^\d+$/.test(String(bookingId))) {
    receipt.innerHTML = '<div class="receipt-error"><strong>Receipt unavailable.</strong><br>Select a payment from the Staff Payment List and click Receipt.</div>';
    return;
  }

  try {
    const [bookingResponse, settingsResponse] = await Promise.all([
      fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, { credentials: 'include' }),
      fetch('/api/public/settings', { credentials: 'include' })
    ]);
    const booking = await bookingResponse.json();
    const settings = settingsResponse.ok ? await settingsResponse.json() : { center_name: 'AquaLux Auto Spa', contact_number: '' };
    if (!bookingResponse.ok) throw new Error(booking.error || 'Unable to load the selected booking.');
    if (!booking.payment_id) {
      receipt.innerHTML = `<div class="receipt-error"><strong>No payment record found for BK${escapeHtml(booking.id)}.</strong><br>Record the payment first, then generate the receipt.</div>`;
      return;
    }

    const customer = await findReceiptCustomer(booking.customer_name);
    const generated = new Date();
    const receiptYear = generated.getFullYear();
    const receiptId = `RCPT-${receiptYear}-${String(booking.payment_id).padStart(5, '0')}`;
    const formattedBookingId = `BK-${receiptYear}-${String(booking.id).padStart(5, '0')}`;
    const packagePrice = Number(booking.package_price || 0);
    const discount = Number(booking.discount || 0);
    const subtotal = packagePrice;
    const paidAmount = Number(booking.paid_amount || Math.max(packagePrice - discount, 0));
    const centerName = settings.center_name || 'AquaLux Auto Spa';
    const contactNumber = prettyPhone(settings.contact_number || '');

    receipt.innerHTML = `
      <div class="receipt-brand-row">
        <div class="receipt-brand">
          <small>${escapeHtml(String(centerName).toUpperCase())}</small>
          <h1>Payment Receipt</h1>
          <p>Vehicle Wash Center Management System</p>
        </div>
        <div class="receipt-meta">
          <div><b>Generated:</b><br>${escapeHtml(generated.toLocaleString('en-US', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }))}</div>
          <div style="margin-top:8px"><b>Receipt ID:</b> ${escapeHtml(receiptId)}</div>
        </div>
      </div>
      <div class="receipt-rule"></div>

      <div class="receipt-two-col">
        <section class="receipt-section">
          <h2>Booking &amp; Customer Details</h2>
          <div class="receipt-field"><span>Booking ID</span><strong>${escapeHtml(formattedBookingId)}</strong></div>
          <div class="receipt-field"><span>Customer Name</span><strong>${escapeHtml(booking.customer_name)}</strong></div>
          <div class="receipt-field"><span>Phone Number</span><strong>${escapeHtml(customer?.phone || 'Not available')}</strong></div>
          <div class="receipt-field"><span>Email</span><strong>${escapeHtml(customer?.email || 'Not available')}</strong></div>
          <div class="receipt-field"><span>Vehicle Number</span><strong>${escapeHtml(booking.vehicle_no)}</strong></div>
          <div class="receipt-field"><span>Vehicle Type</span><strong>${escapeHtml(booking.vehicle_type)}</strong></div>
        </section>
        <section class="receipt-section">
          <h2>Service Details</h2>
          <div class="receipt-field"><span>Wash Package</span><strong>${escapeHtml(booking.package_name)} — ${receiptMoney(packagePrice)} · ${escapeHtml(booking.estimated_time || 'Not available')}</strong></div>
          <div class="receipt-field"><span>Service Date</span><strong>${escapeHtml(receiptDate(booking.booking_date))}</strong></div>
          <div class="receipt-field"><span>Service Time</span><strong>${escapeHtml(receiptClock(booking.booking_time))}</strong></div>
          <div class="receipt-field"><span>Service Duration</span><strong>${escapeHtml(booking.estimated_time || 'Not available')}</strong></div>
          <div class="receipt-field"><span>Service Location</span><strong>${escapeHtml(centerName)}</strong></div>
        </section>
      </div>

      <hr class="summary-divider">
      <section class="payment-summary">
        <h2>Payment Summary</h2>
        <div class="payment-summary-grid">
          <div class="money-lines">
            <div class="money-row"><span>Package Price</span><strong>${receiptMoney(packagePrice)}</strong></div>
            <div class="money-row"><span>Discount</span><strong>${receiptMoney(discount)}</strong></div>
            <div class="money-row"><span>Subtotal</span><strong>${receiptMoney(subtotal)}</strong></div>
            <div class="money-row total"><span>Total Amount</span><strong>${receiptMoney(paidAmount)}</strong></div>
          </div>
          <div>
            <div class="payment-info-row"><span>Payment Method</span><strong>${escapeHtml(booking.method || 'Not available')}</strong></div>
            <div class="payment-info-row"><span>Paid Amount</span><strong>${receiptMoney(paidAmount)}</strong></div>
            <div class="payment-info-row"><span>Payment Date</span><strong>${escapeHtml(receiptDate(booking.payment_date, false))}</strong></div>
            <div class="payment-info-row"><span>Payment Status</span><strong><span class="paid-badge">${escapeHtml(booking.payment_status || 'Paid')}</span></strong></div>
          </div>
        </div>
      </section>

      <div class="receipt-bottom">
        <div class="receipt-thanks">
          <strong>Thank you for choosing ${escapeHtml(centerName)}!</strong>
          <p>For any inquiries, please contact us${contactNumber ? ` at <a href="tel:${escapeHtml(String(settings.contact_number || ''))}">${escapeHtml(contactNumber)}</a>` : '.'}</p>
        </div>
        <button class="receipt-print-btn no-print" type="button" id="printReceiptButton"><span aria-hidden="true">▣</span> Print Receipt</button>
      </div>

      <div class="receipt-footer"><span>Generated from live AquaLux SQLite booking and payment records.</span><span>1/1</span></div>
    `;

    document.getElementById('printReceiptButton')?.addEventListener('click', () => window.print());
    document.title = `${receiptId} | AquaLux Payment Receipt`;
  } catch (error) {
    console.error(error);
    receipt.innerHTML = `<div class="receipt-error"><strong>Error generating receipt.</strong><br>${escapeHtml(error.message || 'Please return to the payment list and try again.')}</div>`;
  }
};
