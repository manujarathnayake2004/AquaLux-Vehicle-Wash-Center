// Staff payment list receipt actions.
// This intentionally overrides main.js only on pages/staff/payment-list.html.
loadCurrentDataPage = async function () {
  const page = location.pathname.split('/').pop();
  if (page !== 'payment-list.html') return;
  try {
    const payments = await apiRows('/api/payments');
    fillTable(payments, row => `
      <tr>
        <td>PAY${row.id}</td>
        <td>BK${row.booking_id}</td>
        <td>${formatLKR(row.amount)}</td>
        <td>${escapeHtml(row.payment_date)}</td>
        <td><span class="status done">${escapeHtml(row.status || 'Paid')}</span></td>
        <td><a class="table-action receipt-action" href="receipt.html?bookingId=${encodeURIComponent(row.booking_id)}">Receipt</a></td>
      </tr>
    `);
  } catch (error) {
    console.error(error);
    showTableLoadError(error.message || 'Unable to load payment records from the AquaLux server.');
  }
};
