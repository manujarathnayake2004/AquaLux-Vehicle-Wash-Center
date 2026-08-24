function currentReportPeriod() {
  return location.pathname.endsWith('weekly-report.html') ? 'weekly' : 'daily';
}

function reportEscape(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function reportCurrency(value) {
  return `LKR ${Number(value || 0).toLocaleString('en-LK')}`;
}

async function getReportRows(period) {
  const response = await fetch(`/api/reports/${period}`, { credentials: 'include' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The report could not be generated.');
  return data;
}

function reportTotals(rows) {
  return rows.reduce((totals, row) => ({
    bookings: totals.bookings + Number(row.bookings || 0),
    completed: totals.completed + Number(row.completed || 0),
    income: totals.income + Number(row.income || 0)
  }), { bookings: 0, completed: 0, income: 0 });
}

function printableReportHtml(period, rows) {
  const title = period === 'weekly' ? 'Weekly Business Report' : 'Daily Business Report';
  const firstColumn = period === 'weekly' ? 'Week' : 'Date';
  const totals = reportTotals(rows);
  const generatedAt = new Date().toLocaleString('en-LK', { dateStyle: 'long', timeStyle: 'short' });
  const bodyRows = rows.length ? rows.map((row) => `
    <tr><td>${reportEscape(row.label)}</td><td>${Number(row.bookings || 0)}</td><td>${Number(row.completed || 0)}</td><td>${reportCurrency(row.income)}</td></tr>
  `).join('') : '<tr><td colspan="4">No report records are available.</td></tr>';

  return `<!doctype html><html><head><meta charset="utf-8"><title>AquaLux ${title}</title><style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#13272e;margin:0;background:#eef5f4}.report{max-width:980px;margin:28px auto;background:#fff;padding:42px;border-radius:18px;box-shadow:0 16px 45px rgba(19,39,46,.13)}
    header{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #149ea6;padding-bottom:20px}h1{margin:5px 0 7px;font-size:30px}.brand{color:#149ea6;font-weight:900;letter-spacing:.12em}.meta{text-align:right;color:#587075;font-size:13px;line-height:1.6}
    .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:26px 0}.summary div{padding:18px;border-radius:12px;background:#eff8f7;border:1px solid #cfe6e3}.summary span{display:block;color:#617b7f;font-size:12px;text-transform:uppercase;letter-spacing:.08em}.summary strong{display:block;margin-top:7px;font-size:23px;color:#0b737c}
    table{width:100%;border-collapse:collapse}th{background:#13272e;color:#fff;text-align:left;padding:13px}td{padding:13px;border-bottom:1px solid #dce8e7}tbody tr:nth-child(even){background:#f7fbfa}footer{margin-top:28px;padding-top:15px;border-top:1px solid #dce8e7;color:#62777a;font-size:12px}
    .print-button{display:block;margin:0 auto 18px;padding:11px 20px;border:0;border-radius:999px;background:#149ea6;color:#fff;font-weight:700;cursor:pointer}@media print{body{background:#fff}.report{margin:0;max-width:none;box-shadow:none;padding:20px}.print-button{display:none}@page{size:A4;margin:12mm}}
    @media(max-width:700px){.report{margin:0;border-radius:0;padding:22px}.summary{grid-template-columns:1fr}header{display:block}.meta{text-align:left;margin-top:12px}}
  </style></head><body><div class="report"><button class="print-button" onclick="window.print()">Print / Save as PDF</button><header><div><div class="brand">AQUALUX AUTO SPA</div><h1>${title}</h1><div>Vehicle Wash Center Management System</div></div><div class="meta"><b>Generated:</b><br>${reportEscape(generatedAt)}<br><b>Service:</b> Monday–Saturday, 08:00–18:00</div></header>
  <section class="summary"><div><span>Total bookings</span><strong>${totals.bookings}</strong></div><div><span>Completed services</span><strong>${totals.completed}</strong></div><div><span>Recorded income</span><strong>${reportCurrency(totals.income)}</strong></div></section>
  <table><thead><tr><th>${firstColumn}</th><th>Bookings</th><th>Completed</th><th>Income</th></tr></thead><tbody>${bodyRows}</tbody></table><footer>Generated from live AquaLux SQLite booking and payment records.</footer></div></body></html>`;
}

async function generateReport() {
  const period = currentReportPeriod();
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) {
    alert('Please allow pop-ups for 127.0.0.1 so the printable report can open.');
    return;
  }
  reportWindow.document.write('<p style="font-family:Arial;padding:30px">Preparing AquaLux report...</p>');
  try {
    const rows = await getReportRows(period);
    await loadCurrentDataPage();
    reportWindow.document.open();
    reportWindow.document.write(printableReportHtml(period, rows));
    reportWindow.document.close();
    reportWindow.focus();
    window.setTimeout(() => reportWindow.print(), 450);
  } catch (error) {
    reportWindow.close();
    alert(error.message);
  }
}

async function downloadReportCsv() {
  const period = currentReportPeriod();
  try {
    const rows = await getReportRows(period);
    const totals = reportTotals(rows);
    const firstColumn = period === 'weekly' ? 'Week' : 'Date';
    const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = [
      [firstColumn, 'Bookings', 'Completed', 'Income (LKR)'],
      ...rows.map((row) => [row.label, row.bookings, row.completed, row.income]),
      ['TOTAL', totals.bookings, totals.completed, totals.income]
    ];
    const csv = '\uFEFF' + lines.map((line) => line.map(quote).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `AquaLux_${period === 'weekly' ? 'Weekly' : 'Daily'}_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert(error.message);
  }
}
