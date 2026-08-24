// ai-recommendation.js - staff page connection to the Flask AI server
const staffAiBase = window.location.port === '5000' ? '' : 'http://127.0.0.1:5000';
const staffVehicleImages = {
  Motorcycle: '../../assets/images/recommendation-motorcycle.jpg',
  Car: '../../assets/images/recommendation-car.png',
  Van: '../../assets/images/recommendation-van.png',
  SUV: '../../assets/images/recommendation-suv.png'
};

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
      body: JSON.stringify({ vehicleType: type, dirtLevel, interior })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Recommendation failed');

    result.innerHTML = `
      <h3>${data.packageName}</h3>
      <p><b>Estimated Time:</b> ${data.estimatedTime}</p>
      <p><b>Price:</b> ${formatLKR(data.price)}</p>
      <p><b>AI Reason:</b> ${data.reason}</p>
      <p><small>${data.engine} · ${data.ruleId}</small></p>
    `;
  } catch (error) {
    result.innerHTML = '<p>The AI server is offline. Run <b>python server.py</b> and try again.</p>';
  } finally {
    button.disabled = false;
    button.textContent = 'Ask AI Server';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkStaffAiServer();
  document.getElementById('vehicleType')?.addEventListener('change', updateStaffVehiclePreview);
  updateStaffVehiclePreview();
  document.getElementById('staffRecommendButton')?.addEventListener('click', recommendPackageFromServer);
});
