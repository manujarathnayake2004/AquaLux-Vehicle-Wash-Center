const aiInsightEscape = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
})[character]);

function renderAiDemand(items) {
  const chart = document.getElementById('aiDemandChart');
  const max = Math.max(1, ...items.map((item) => Number(item.bookings) || 0));
  chart.innerHTML = items.map((item) => {
    const value = Number(item.bookings) || 0;
    const height = Math.max(4, Math.round(value / max * 100));
    return `
      <div class="ai-demand-column${item.day === 'Saturday' ? ' peak' : ''}">
        <strong>${value}</strong>
        <div class="ai-demand-track"><i style="height:${height}%"></i></div>
        <span>${aiInsightEscape(item.shortDay)}</span>
      </div>`;
  }).join('');
}

function renderAiVehicleActivity(items) {
  const target = document.getElementById('aiVehicleActivity');
  if (!items.length) {
    target.innerHTML = '<p>No recommendation activity has been recorded yet.</p>';
    return;
  }
  const max = Math.max(1, ...items.map((item) => Number(item.total) || 0));
  target.innerHTML = items.map((item) => `
    <div class="ai-vehicle-row">
      <span>${aiInsightEscape(item.vehicle_type || 'Unknown')}</span>
      <div><i style="width:${Math.max(5, Math.round(Number(item.total) / max * 100))}%"></i></div>
      <b>${Number(item.total)}</b>
    </div>`).join('');
}

function renderAiFeedback(items) {
  const target = document.getElementById('aiFeedbackList');
  if (!items.length) {
    target.innerHTML = '<p>No customer feedback has been recorded yet. Feedback buttons appear after each customer recommendation.</p>';
    return;
  }
  target.innerHTML = items.map((item) => {
    const helpful = Boolean(item.helpful);
    const comment = item.comment || (helpful ? 'Recommendation marked helpful.' : 'Recommendation marked not helpful.');
    return `
      <div class="ai-feedback-item${helpful ? '' : ' not-helpful'}">
        <b>${helpful ? '✓' : '✕'}</b>
        <div><strong>${aiInsightEscape(item.full_name)} · ${aiInsightEscape(item.vehicle_type || 'General question')}</strong><small>${aiInsightEscape(comment)}</small></div>
        <time>${aiInsightEscape(String(item.created_at).slice(0, 16))}</time>
      </div>`;
  }).join('');
}

async function loadAiInsights() {
  try {
    const response = await fetch('/api/admin/ai-insights', { credentials: 'include' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'AI performance information could not be loaded.');

    document.getElementById('aiModelReadiness').textContent = data.modelReadiness;
    document.getElementById('aiModelMethod').textContent = data.modelMethod;
    document.getElementById('aiRecommendationCount').textContent = data.recommendationCount;
    document.getElementById('aiFeedbackCount').textContent = data.feedbackCount;
    document.getElementById('aiFeedbackCoverage').textContent = `${data.feedbackCoverage}% response coverage`;
    document.getElementById('aiHelpfulRate').textContent = data.helpfulRate === null ? 'Not available' : `${data.helpfulRate}%`;
    document.getElementById('aiBookingRecords').textContent = data.totalBookingRecords;
    document.getElementById('aiAccuracyNote').textContent = data.accuracyNote;
    document.getElementById('aiTrainingProgress').textContent = `${Math.min(data.totalBookingRecords, data.minimumTrainingRecords)} / ${data.minimumTrainingRecords}`;

    renderAiDemand(data.weekdayDemand || []);
    renderAiVehicleActivity(data.vehicleActivity || []);
    renderAiFeedback(data.recentFeedback || []);
  } catch (error) {
    const hero = document.querySelector('.ai-insight-hero');
    hero.insertAdjacentHTML('afterend', `<div class="ai-insight-error" role="alert">${aiInsightEscape(error.message)}</div>`);
  }
}

document.addEventListener('DOMContentLoaded', loadAiInsights);
