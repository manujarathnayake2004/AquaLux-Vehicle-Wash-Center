// main.js - AI Wash Center frontend interactions
// This file is used by index.html, login.html and dashboard.html.

const demoBookings = [
  { customer: 'Kasun Perera', vehicle: 'Car', package: 'Car Standard Wash', status: 'Completed' },
  { customer: 'Nimal Silva', vehicle: 'SUV', package: 'SUV Full Wash', status: 'Pending' },
  { customer: 'Ayesha Fernando', vehicle: 'Motorcycle', package: 'Bike Basic Wash', status: 'Completed' },
  { customer: 'Ruwan Jayasuriya', vehicle: 'Van', package: 'Van Full Wash', status: 'Pending' }
];

// Authentication must use the Flask address so session cookies work correctly.
// Pages opened directly or with Live Server are moved to port 5000 after the
// health check confirms that the AquaLux server is running.
const IS_AQUALUX_SERVER = ['127.0.0.1', 'localhost'].includes(window.location.hostname)
  && window.location.port === '5000';
const AI_SERVER_BASE = IS_AQUALUX_SERVER
  ? window.location.origin
  : 'http://127.0.0.1:5000';

const vehicleMedia = {
  Motorcycle: [
    {
      src: 'assets/images/recommendation-motorcycle.jpg',
      title: 'Motorcycle wash',
      caption: 'Focused foam and pressure care designed for motorcycles.'
    }
  ],
  Car: [
    {
      src: 'assets/images/recommendation-car.png',
      title: 'Car wash service',
      caption: 'Smart foam cleaning and finish protection for cars.'
    }
  ],
  Van: [
    {
      src: 'assets/images/recommendation-van.png',
      title: 'Van wash service',
      caption: 'Complete wash coverage for a larger body and passenger cabin.'
    }
  ],
  SUV: [
    {
      src: 'assets/images/recommendation-suv.png',
      title: 'SUV wash service',
      caption: 'High-pressure exterior and interior care for larger SUVs.'
    }
  ]
};

let vehicleSlideTimer;
let vehicleSlideIndex = 0;

function showResult(element, html, type = '') {
  if (!element) return;
  element.innerHTML = html;
  element.classList.remove('error', 'success');
  if (type) element.classList.add(type);
  if (type === 'error') element.setAttribute('role', 'alert');
  else if (type === 'success') element.setAttribute('role', 'status');
  else element.removeAttribute('role');
  element.classList.add('show');
}

function setupMobileMenu() {
  const menuButton = document.querySelector('.menu');
  const nav = document.querySelector('.nav');

  if (!menuButton || !nav) return;

  menuButton.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
}

function addWhatsAppButton() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (currentPage !== 'index.html') return;
  if (document.querySelector('.aqualux-whatsapp-float')) return;
  const link = document.createElement('a');
  link.className = 'aqualux-whatsapp-float';
  link.href = 'https://wa.me/94755004526?text=Hello%20AquaLux%20Auto%20Spa%2C%20I%20would%20like%20to%20ask%20about%20a%20vehicle%20wash%20service.';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', 'Chat with AquaLux on WhatsApp');
  link.innerHTML = `<span class="aqualux-whatsapp-label">Chat with us</span><span class="aqualux-whatsapp-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M26.8 15.6A10.8 10.8 0 0 1 11 25.1L5.2 27l1.9-5.6A10.8 10.8 0 1 1 26.8 15.6Z"/><path d="M12 10.2c.3-.7.7-.7 1.1-.7h.5c.2 0 .5.1.6.5l1.1 2.6c.1.4 0 .7-.2 1l-.8 1c-.2.2-.2.4 0 .7 1 1.8 2.4 3.1 4.2 4 .3.2.6.1.8-.1l1-1.2c.3-.3.6-.4.9-.2l2.5 1.2c.4.2.5.4.5.7 0 .5-.3 1.7-1.2 2.3-.8.7-2 1-3.1.7-1.2-.3-3.1-1-5.3-3-2.6-2.3-4.3-5.1-4.8-6.5-.5-1.5.3-2.4.7-2.9Z"/></svg></span>`;
  document.body.appendChild(link);
}

function setupScrollReveal() {
  const revealItems = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  revealItems.forEach((item) => observer.observe(item));
}

function setupFaq() {
  document.querySelectorAll('.faq-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const faq = button.closest('.faq');
      const isOpen = faq.classList.toggle('open');
      button.setAttribute('aria-expanded', String(isOpen));
      button.querySelector('span').textContent = isOpen ? '−' : '+';
    });
  });
}

function setServerStatus(state, message) {
  const status = document.getElementById('aiServerStatus');
  if (!status) return;
  status.className = `server-status ${state}`;
  status.querySelector('span:last-child').textContent = message;
}

async function checkAiServer() {
  try {
    const response = await fetch(`${AI_SERVER_BASE}/api/health`, { credentials: 'include' });
    if (!response.ok) throw new Error('Server unavailable');
    const data = await response.json();
    setServerStatus('online', `${data.engine} is online`);
  } catch (error) {
    setServerStatus('offline', 'AI server is offline — run server.py');
  }
}

function showVehicleSlide(vehicleType) {
  const image = document.getElementById('aiVehicleImage');
  const title = document.getElementById('aiVehicleTitle');
  const caption = document.getElementById('aiVehicleCaption');
  const slides = vehicleMedia[vehicleType] || vehicleMedia.Car;
  const slide = slides[vehicleSlideIndex % slides.length];

  if (!image || !title || !caption) return;

  image.classList.add('is-changing');
  window.setTimeout(() => {
    image.src = slide.src;
    image.alt = `${slide.title} wash preview`;
    title.textContent = slide.title;
    caption.textContent = slide.caption;
    image.classList.remove('is-changing');
  }, 180);
}

function startVehicleSlides(vehicleType) {
  window.clearInterval(vehicleSlideTimer);
  vehicleSlideIndex = 0;
  showVehicleSlide(vehicleType);

  const slides = vehicleMedia[vehicleType] || [];
  if (slides.length > 1) {
    vehicleSlideTimer = window.setInterval(() => {
      vehicleSlideIndex = (vehicleSlideIndex + 1) % slides.length;
      showVehicleSlide(vehicleType);
    }, 4500);
  }
}

function formatAdvisorDate(value) {
  if (!value) return 'Not available';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-LK', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

function renderAdvisorResult(recommendation) {
  const profile = recommendation.conditionProfile;
  const forecast = recommendation.demandForecast;
  const reasons = (profile.reasons || [])
    .map((reason) => `<li>${escapeAvailabilityText(reason)}</li>`)
    .join('');
  const waitValue = forecast.serviceOpen
    ? `${Number(forecast.estimatedWaitMinutes)} min`
    : 'Closed';

  return `
    <div class="ai-advisor-result">
      <div class="advisor-result-heading">
        <div>
          <small>Recommended package</small>
          <h3>${escapeAvailabilityText(recommendation.packageName)}</h3>
          <p>${escapeAvailabilityText(profile.level)} · ${escapeAvailabilityText(profile.urgency)} priority</p>
        </div>
        <span>${Number(profile.score)}/100</span>
      </div>
      <div class="condition-meter" aria-label="Vehicle care score ${Number(profile.score)} out of 100"><i style="width:${Math.min(100, Number(profile.score))}%"></i></div>
      <div class="advisor-result-grid">
        <article><span>Official price</span><strong>LKR ${Number(recommendation.price).toLocaleString('en-LK')}</strong></article>
        <article><span>Service duration</span><strong>${escapeAvailabilityText(recommendation.estimatedTime)}</strong></article>
        <article><span>Suggested next wash</span><strong>${formatAdvisorDate(profile.nextWashDate)}</strong></article>
        <article><span>Preferred-day wait</span><strong>${escapeAvailabilityText(waitValue)}</strong></article>
      </div>
      <div class="advisor-explanation">
        <strong>Why this result?</strong>
        <ul class="advisor-reason-list">${reasons}</ul>
        <p>${escapeAvailabilityText(profile.careAdvice)}</p>
        <p><small>${escapeAvailabilityText(profile.budgetNote)}</small></p>
      </div>
      <div class="forecast-panel">
        <header><strong>${escapeAvailabilityText(forecast.day)} demand forecast</strong><span class="forecast-level">${escapeAvailabilityText(forecast.demandLevel)}</span></header>
        <div class="forecast-stats">
          <div><span>Expected bookings</span><b>${Number(forecast.expectedBookings)}</b></div>
          <div><span>Estimated queue delay</span><b>${escapeAvailabilityText(waitValue)}</b></div>
          <div><span>Quieter alternative</span><b>${escapeAvailabilityText(forecast.bestAlternativeDay)}</b></div>
        </div>
        <small>${escapeAvailabilityText(forecast.dataQuality)} · ${escapeAvailabilityText(forecast.method)}. ${escapeAvailabilityText(forecast.reason)}</small>
      </div>
      ${recommendation.requestId ? `
        <div class="ai-feedback-box" data-ai-request="${Number(recommendation.requestId)}">
          <p>Was this recommendation useful?</p>
          <div class="ai-feedback-actions"><button type="button" data-helpful="true">✓ Yes, helpful</button><button type="button" data-helpful="false">✕ Not helpful</button></div>
          <div class="ai-feedback-message" aria-live="polite"></div>
        </div>` : ''}
      <p><small>${escapeAvailabilityText(recommendation.engine)} · ${escapeAvailabilityText(recommendation.ruleId)}</small></p>
    </div>
  `;
}

async function submitAdvisorFeedback(container, helpful) {
  const requestId = Number(container.dataset.aiRequest);
  const message = container.querySelector('.ai-feedback-message');
  const buttons = container.querySelectorAll('button');
  buttons.forEach((button) => { button.disabled = true; });
  message.textContent = 'Saving feedback...';
  try {
    const response = await fetch(`${AI_SERVER_BASE}/api/ai/feedback`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, helpful })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Feedback could not be saved.');
    message.textContent = data.message;
  } catch (error) {
    message.textContent = error.message;
    buttons.forEach((button) => { button.disabled = false; });
  }
}

function setupAiForm() {
  const aiForm = document.getElementById('aiForm');
  const aiResult = document.getElementById('aiResult');
  const vehicleTypeField = document.getElementById('vehicleType');
  const recommendButton = document.getElementById('recommendButton');

  if (!aiForm || !aiResult) return;

  checkAiServer();
  startVehicleSlides(vehicleTypeField.value);

  const preferredDate = document.getElementById('preferredServiceDate');
  if (preferredDate) {
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    preferredDate.min = localToday;
    preferredDate.value = localToday;
  }

  vehicleTypeField.addEventListener('change', () => {
    startVehicleSlides(vehicleTypeField.value);
  });

  aiForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const requestData = {
      vehicleType: vehicleTypeField.value,
      dirtLevel: document.getElementById('dirtLevel').value,
      interior: document.getElementById('interior').value,
      specialCondition: document.getElementById('specialCondition').value,
      daysSinceWash: Number(document.getElementById('daysSinceWash').value),
      usage: document.getElementById('vehicleUsage').value,
      budget: document.getElementById('serviceBudget').value,
      preferredDate: document.getElementById('preferredServiceDate').value
    };

    recommendButton.disabled = true;
    recommendButton.textContent = 'AI server is thinking...';
    aiResult.className = 'result loading';
    aiResult.innerHTML = '<p>Sending the vehicle details to the Flask AI server...</p>';

    try {
      const response = await fetch(`${AI_SERVER_BASE}/api/recommend`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const recommendation = await response.json();
      if (!response.ok) throw new Error(recommendation.error || 'Recommendation failed');

      aiResult.classList.remove('loading');
      showResult(aiResult, renderAdvisorResult(recommendation));
      aiResult.querySelectorAll('[data-helpful]').forEach((button) => {
        button.addEventListener('click', () => {
          submitAdvisorFeedback(button.closest('[data-ai-request]'), button.dataset.helpful === 'true');
        });
      });
      setServerStatus('online', `${recommendation.engine} is online`);
    } catch (error) {
      aiResult.classList.remove('loading');
      showResult(aiResult, `
        <h3>Recommendation unavailable</h3>
        <p>${escapeAvailabilityText(error.message)}</p>
      `, 'error');
      if (error instanceof TypeError) setServerStatus('offline', 'AI server is offline — run server.py');
    } finally {
      recommendButton.disabled = false;
      recommendButton.textContent = 'Ask AI Server';
    }
  });
}

function setupBookingForm() {
  const bookingForm = document.getElementById('bookingForm');
  const bookingMessage = document.getElementById('bookingMessage');

  if (!bookingForm || !bookingMessage) return;

  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();

    showResult(bookingMessage, `
      <h3>Booking request submitted</h3>
      <p>Please sign in as a customer to save and track a booking securely.</p>
      <p>The customer workspace checks time-slot availability before saving the request.</p>
    `);

    bookingForm.reset();
  });
}

function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  const serverState = document.getElementById('loginServerState');
  const retryButton = document.getElementById('retryServerButton');

  if (!loginForm || !loginMessage) return;

  const query = new URLSearchParams(window.location.search);
  const button = loginForm.querySelector('button[type="submit"]');
  let serverReady = false;
  let connectionCheck = null;

  const updateServerState = (state, message) => {
    if (!serverState) return;
    serverState.className = `login-server-state ${state}`;
    serverState.querySelector('span').textContent = message;
    if (retryButton) retryButton.hidden = state !== 'offline';
  };

  const connectToLoginServer = () => {
    if (connectionCheck) return connectionCheck;

    connectionCheck = (async () => {
      button.disabled = true;
      if (retryButton) retryButton.disabled = true;
      updateServerState('checking', 'Checking the AquaLux secure server...');

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 4500);

      try {
        const response = await fetch(`${AI_SERVER_BASE}/api/health`, {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal
        });
        if (!response.ok) throw new Error('Server unavailable');

        // Use one origin for the page and API. This avoids CORS and session errors.
        if (!IS_AQUALUX_SERVER) {
          window.location.replace(`${AI_SERVER_BASE}/login.html${window.location.search}`);
          return false;
        }

        serverReady = true;
        updateServerState('online', 'Secure server online — ready to sign in');
        if (loginMessage.dataset.serverError === 'true') {
          loginMessage.classList.remove('show');
          loginMessage.innerHTML = '';
          delete loginMessage.dataset.serverError;
        }
        return true;
      } catch (error) {
        serverReady = false;
        updateServerState('offline', 'Server offline — start START-AQUALUX.bat');
        loginMessage.dataset.serverError = 'true';
        showResult(loginMessage, `
          <h3>AquaLux server is not running</h3>
          <p>Double-click <strong>START-AQUALUX.bat</strong> and keep its black window open. Then choose <strong>Retry</strong> or press the sign-in button again.</p>
          <p><a class="server-login-link" href="${AI_SERVER_BASE}/login.html">Open the secure server login page</a></p>
        `, 'error');
        return false;
      } finally {
        window.clearTimeout(timeoutId);
        button.disabled = false;
        if (retryButton) retryButton.disabled = false;
        connectionCheck = null;
      }
    })();

    return connectionCheck;
  };

  const registeredUsername = query.get('username');
  if (registeredUsername) document.getElementById('username').value = registeredUsername;
  if (query.get('registered') === '1') {
    showResult(loginMessage, `
      <h3>Account created successfully</h3>
      <p>Sign in with your new username and password to access AquaLux AI.</p>
    `, 'success');
  }

  if (retryButton) {
    retryButton.addEventListener('click', connectToLoginServer);
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!serverReady) {
      const connected = await connectToLoginServer();
      if (!connected) return;
    }

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    button.disabled = true;
    button.textContent = 'Signing in...';

    try {
      const response = await fetch(`${AI_SERVER_BASE}/api/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, next: query.get('next') || '' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed.');

      localStorage.setItem('loggedUser', data.user.username);
      localStorage.setItem('loggedRole', data.user.role);

      showResult(loginMessage, `
        <h3>Login successful</h3>
        <p>Welcome ${escapeAvailabilityText(data.user.fullName)}. Opening your secure workspace...</p>
      `, 'success');

      setTimeout(() => {
        window.location.href = data.redirect;
      }, 900);
    } catch (error) {
      if (error instanceof TypeError) {
        serverReady = false;
        updateServerState('offline', 'Server connection lost — restart START-AQUALUX.bat');
      }
      const message = error instanceof TypeError
        ? 'The secure server connection was lost. Restart START-AQUALUX.bat and try again.'
        : error.message;
      showResult(loginMessage, `
        <h3>Login failed</h3>
        <p>${escapeAvailabilityText(message)}</p>
      `, 'error');
    } finally {
      // Keep the button usable. A later click will retry the server connection.
      button.disabled = false;
      button.innerHTML = 'Sign in securely <span>→</span>';
    }
  });

  connectToLoginServer();
}

function loadBookingRows() {
  const bookingRows = document.getElementById('bookingRows');
  if (!bookingRows) return;

  bookingRows.innerHTML = demoBookings.map((booking) => {
    const badgeClass = booking.status === 'Completed' ? 'completed' : 'pending';

    return `
      <div class="booking-row">
        <strong>${booking.customer}</strong>
        <span>${booking.vehicle}</span>
        <span>${booking.package}</span>
        <span class="badge ${badgeClass}">${booking.status}</span>
      </div>
    `;
  }).join('');
}

function setupActiveNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav a').forEach((link) => {
    const linkPage = link.getAttribute('href').split('#')[0];

    if (linkPage === currentPage) {
      link.classList.add('active');
    }
  });
}

function escapeAvailabilityText(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatAvailabilityDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-LK', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

function drawBusyDayChart(items) {
  const canvas = document.getElementById('busyDaysChart');
  if (!canvas || !items?.length) return;
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 520;
  const height = 170;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  const max = Math.max(1, ...items.map(item => Number(item.bookings) || 0));
  const gap = 12;
  const left = 12;
  const chartHeight = 118;
  const barWidth = (width - left * 2 - gap * (items.length - 1)) / items.length;
  items.forEach((item, index) => {
    const value = Number(item.bookings) || 0;
    const barHeight = Math.max(5, chartHeight * value / max);
    const x = left + index * (barWidth + gap);
    const y = chartHeight - barHeight + 12;
    const gradient = ctx.createLinearGradient(0, y, 0, 130);
    gradient.addColorStop(0, item.day === 'Saturday' ? '#ffad65' : '#29d5c4');
    gradient.addColorStop(1, item.day === 'Saturday' ? '#d87340' : '#137c89');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, 8);
    ctx.fill();
    ctx.fillStyle = '#dcebec';
    ctx.font = '700 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(value, x + barWidth / 2, Math.max(10, y - 6));
    ctx.fillStyle = '#88a7aa';
    ctx.font = '10px Arial';
    ctx.fillText(item.shortDay, x + barWidth / 2, 151);
  });
}

function renderAvailability(data) {
  const summary = document.getElementById('availabilitySummary');
  if (!summary) return;

  let stateLabel = 'Service available';
  let stateClass = 'available';
  if (!data.serviceOpen) {
    stateLabel = 'Service centre closed';
    stateClass = 'closed';
  } else if (!data.canReceiveService) {
    stateLabel = data.freeTimes.length ? 'Past service day' : 'Fully booked';
    stateClass = 'busy';
  }

  const slotChips = (slots, type, emptyMessage) => slots.length
    ? slots.map((slot) => `<span class="slot-chip ${type}">${escapeAvailabilityText(slot)}</span>`).join('')
    : `<p class="empty-slot-message">${escapeAvailabilityText(emptyMessage)}</p>`;

  summary.innerHTML = `
    <div class="availability-overview">
      <article class="availability-card availability-card-primary">
        <span class="availability-label">Selected service day</span>
        <strong>${escapeAvailabilityText(data.selectedDay)}</strong>
        <small>${formatAvailabilityDate(data.selectedDate)}</small>
        <span class="availability-state ${stateClass}">${stateLabel}</span>
      </article>
      <article class="availability-card">
        <span class="availability-label">Service hours</span>
        <strong>${escapeAvailabilityText(data.openingTime)} – ${escapeAvailabilityText(data.closingTime)}</strong>
        <small>Monday to Saturday</small>
      </article>
      <article class="availability-card">
        <span class="availability-label">Free appointments</span>
        <strong>${data.freeTimes.length}</strong>
        <small>30-minute start times</small>
      </article>
      <article class="availability-card">
        <span class="availability-label">Peak day${data.peakDays.length === 1 ? '' : 's'}</span>
        <strong>${data.peakDays.map(escapeAvailabilityText).join(', ')}</strong>
        <small>${data.peakBookingCount ? `${data.peakBookingCount} booking${data.peakBookingCount === 1 ? '' : 's'} in stored data` : 'Updates from booking records'}</small>
      </article>
    </div>

    <div class="availability-times">
      <article class="time-slot-card">
        <div class="time-slot-heading">
          <div><span class="slot-dot free"></span><h3>Free start times</h3></div>
          <small>Choose one when creating a booking</small>
        </div>
        <div class="slot-list">${slotChips(data.freeTimes, 'free', data.serviceOpen ? 'No free times remain for this day.' : 'The service centre is closed on this day.')}</div>
      </article>
      <article class="time-slot-card">
        <div class="time-slot-heading">
          <div><span class="slot-dot booked"></span><h3>Already booked</h3></div>
          <small>Live records from SQLite</small>
        </div>
        <div class="busy-chart-heading"><strong>Bookings by operating day</strong><small>${data.peakDays?.length && data.peakBookingCount ? `Peak: ${data.peakDays.map(escapeAvailabilityText).join(", ")}` : "Based on stored booking records"}</small></div>
        <canvas id="busyDaysChart" aria-label="Bookings by operating day"></canvas>
        <div class="slot-list">${slotChips(data.bookedTimes, 'booked', data.serviceOpen ? 'No bookings have been recorded for this day.' : 'Closed Sunday — no bookings accepted.')}</div>
      </article>
    </div>

    <article class="next-service-card">
      <div class="next-service-heading">
        <div>
          <span class="availability-label">Next opportunities</span>
          <h3>Days that can receive your vehicle</h3>
        </div>
        <p>Booking days: ${data.bookingDays.map(escapeAvailabilityText).join(', ')}. Closed ${data.closedDays.map(escapeAvailabilityText).join(', ')}.</p>
      </div>
      <div class="next-days-grid">
        ${data.nextAvailableDays.map((day, index) => `
          <button class="next-day-card${index === 0 ? ' recommended' : ''}" type="button" data-service-date="${escapeAvailabilityText(day.date)}">
            <span>${escapeAvailabilityText(day.day)}</span>
            <strong>${formatAvailabilityDate(day.date)}</strong>
            <small>${day.freeSlots} free · first at ${escapeAvailabilityText(day.firstFreeTime)}</small>
          </button>
        `).join('')}
      </div>
    </article>
  `;

  drawBusyDayChart(data.busyDayChart);

  summary.querySelectorAll('[data-service-date]').forEach((card) => {
    card.addEventListener('click', () => {
      document.getElementById('availabilityDate').value = card.dataset.serviceDate;
      loadAvailability(card.dataset.serviceDate);
    });
  });
}

async function loadAvailability(selectedDate) {
  const summary = document.getElementById('availabilitySummary');
  const button = document.getElementById('checkAvailabilityButton');
  if (!summary || !button) return;

  button.disabled = true;
  button.textContent = 'Checking...';
  summary.classList.add('is-loading');
  try {
    const response = await fetch(`${AI_SERVER_BASE}/api/availability?date=${encodeURIComponent(selectedDate)}`, {
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Availability could not be loaded.');
    renderAvailability(data);
  } catch (error) {
    summary.innerHTML = `<div class="availability-error"><strong>Availability is unavailable</strong><p>${escapeAvailabilityText(error.message)}</p></div>`;
  } finally {
    summary.classList.remove('is-loading');
    button.disabled = false;
    button.textContent = 'Check day';
  }
}

function setupAvailability() {
  const dateField = document.getElementById('availabilityDate');
  const button = document.getElementById('checkAvailabilityButton');
  if (!dateField || !button) return;

  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateField.min = localToday;
  dateField.value = localToday;
  button.addEventListener('click', () => loadAvailability(dateField.value));
  dateField.addEventListener('change', () => loadAvailability(dateField.value));
  loadAvailability(localToday);
}

async function loadHomePackages() {
  const grid = document.getElementById('homePackageGrid');
  if (!grid) return;
  // This loader belongs only to the Wash packages section. Keeping a strict
  // section check protects the Vehicle care services cards from replacement.
  if (!grid.closest('#packages')) return;
  try {
    const response = await fetch(`${AI_SERVER_BASE}/api/public/packages`);
    const packages = await response.json();
    if (!response.ok || !Array.isArray(packages) || !packages.length) return;
    grid.innerHTML = packages.map((item) => `
      <article class="card reveal in-view">
        <h3>${escapeAvailabilityText(item.package_name)}</h3>
        <p>${escapeAvailabilityText(item.description)}</p>
        <div class="price">LKR ${Number(item.price).toLocaleString('en-LK')}</div>
        <ul class="list">
          <li>${escapeAvailabilityText(item.estimated_time)}</li>
          ${(item.features || []).map((feature) => `<li>${escapeAvailabilityText(feature)}</li>`).join('')}
        </ul>
      </article>
    `).join('');
  } catch (error) {
    console.info('Using the built-in Home package catalogue.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  addWhatsAppButton();
  setupMobileMenu();
  setupScrollReveal();
  setupFaq();
  setupAiForm();
  setupBookingForm();
  setupLoginForm();
  loadBookingRows();
  setupActiveNavigation();
  setupAvailability();
  loadHomePackages();
});
