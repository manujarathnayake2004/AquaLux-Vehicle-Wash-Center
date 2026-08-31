// ai-recommendation.js - staff page connection to the Flask AI server
const staffAiBase = window.location.port === '5000' ? '' : 'http://127.0.0.1:5000';
const staffVehicleImages = {
  Motorcycle: '../../assets/images/recommendation-motorcycle.jpg',
  Car: '../../assets/images/recommendation-car.png',
  Van: '../../assets/images/recommendation-van.png',
  SUV: '../../assets/images/recommendation-suv.png'
};

function escapeStaffAi(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function formatStaffAiDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-LK', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function updateStaffVehiclePreview() {
  const type = document.getElementById('vehicleType')?.value || 'Motorcycle';
  const image = document.getElementById('staffAiVehicleImage');
  const label = document.getElementById('staffAiVehicleLabel');
  if (!image) return;
  image.classList.add('is-changing');
  window.setTimeout(() => {
    image.src = staffVehicleImages[type] || staffVehicleImages.Motorcycle;
    image.alt = `${type} wash service preview`;
    if (label) label.textContent = `${type.toUpperCase()} WASH PREVIEW`;
    image.classList.remove('is-changing');
  }, 160);
}

async function checkStaffAiServer() {
  const status = document.getElementById('staffAiServerStatus');
  if (!status) return;

  try {
    const response = await fetch(`${staffAiBase}/api/health`, { credentials: 'include' });
    if (!response.ok) throw new Error('Offline');
    const data = await response.json();
    status.textContent = `${data.engine} is online and ready.`;
  } catch (error) {
    status.textContent = 'AI server is offline. Run python server.py from the project folder.';
  }
}

async function recommendPackageFromServer() {
  const type = document.getElementById('vehicleType')?.value;
  const dirtLevel = document.getElementById('dirtLevel')?.value;
  const interior = document.getElementById('interior')?.value;
  const specialCondition = document.getElementById('specialCondition')?.value;
  const daysSinceWash = Number(document.getElementById('daysSinceWash')?.value || 0);
  const usage = document.getElementById('vehicleUsage')?.value;
  const budget = document.getElementById('serviceBudget')?.value;
  const preferredDate = document.getElementById('preferredServiceDate')?.value;
  const result = document.getElementById('aiResult');
  const button = document.getElementById('staffRecommendButton');

  if (!result || !type) {
    if (result) result.innerHTML = '<p>Please select a vehicle type.</p>';
    return;
  }

  button.disabled = true;
  button.textContent = 'AI server is thinking...';
  result.innerHTML = '<p>Sending vehicle details to the Flask AI server...</p>';

  try {
    const response = await fetch(`${staffAiBase}/api/recommend`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleType: type, dirtLevel, interior, specialCondition, daysSinceWash, usage, budget, preferredDate })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Recommendation failed');

    const profile = data.conditionProfile;
    const forecast = data.demandForecast;
    result.innerHTML = `
      <div class="staff-ai-result-heading"><div><span>RECOMMENDED PACKAGE</span><h3>${escapeStaffAi(data.packageName)}</h3><p>${escapeStaffAi(profile.level)}</p></div><strong>${Number(profile.score)}/100</strong></div>
      <div class="staff-ai-score"><i style="width:${Math.min(100, Number(profile.score))}%"></i></div>
      <div class="staff-ai-result-grid">
        <div><span>Official price</span><b>${formatLKR(data.price)}</b></div>
        <div><span>Service duration</span><b>${escapeStaffAi(data.estimatedTime)}</b></div>
        <div><span>Demand on ${escapeStaffAi(forecast.day)}</span><b>${escapeStaffAi(forecast.demandLevel)}</b></div>
        <div><span>Estimated queue delay</span><b>${forecast.serviceOpen ? `${Number(forecast.estimatedWaitMinutes)} min` : 'Closed'}</b></div>
        <div><span>Suggested next wash</span><b>${formatStaffAiDate(profile.nextWashDate)}</b></div>
        <div><span>Quieter alternative</span><b>${escapeStaffAi(forecast.bestAlternativeDay)}</b></div>
      </div>
      <div class="staff-ai-reasons"><b>Why this result?</b><ul>${profile.reasons.map((reason) => `<li>${escapeStaffAi(reason)}</li>`).join('')}</ul><p>${escapeStaffAi(profile.budgetNote)}</p></div>
      <p class="staff-ai-method"><small>${escapeStaffAi(forecast.dataQuality)} · ${escapeStaffAi(forecast.method)} using ${Number(forecast.totalBookingRecords || 0)} booking records.</small></p>
    `;
  } catch (error) {
    result.innerHTML = `<p>${escapeStaffAi(error.message || 'The AI server is offline. Run python server.py and try again.')}</p>`;
  } finally {
    button.disabled = false;
    button.textContent = 'Ask AI Server';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkStaffAiServer();
  const preferredDate = document.getElementById('preferredServiceDate');
  if (preferredDate) {
    const now = new Date();
    const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    preferredDate.min = localToday;
    preferredDate.value = localToday;
  }
  document.getElementById('vehicleType')?.addEventListener('change', updateStaffVehiclePreview);
  updateStaffVehiclePreview();
  document.getElementById('staffRecommendButton')?.addEventListener('click', recommendPackageFromServer);
});
