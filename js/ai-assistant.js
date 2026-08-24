const assistantApiBase = window.location.port === '5000' ? '' : 'http://127.0.0.1:5000';

const assistantForm = document.getElementById('assistantForm');
const assistantInput = document.getElementById('assistantInput');
const sendButton = document.getElementById('assistantSendButton');
const chatWindow = document.getElementById('chatWindow');
const quickPrompts = document.getElementById('quickPrompts');
const serverStatus = document.getElementById('assistantServerStatus');
const storyImage = document.getElementById('assistantVehicleImage');
const assistantUserName = document.getElementById('assistantUserName');

const assistantImages = {
  Motorcycle: 'assets/images/recommendation-motorcycle.jpg',
  Car: 'assets/images/recommendation-car.png',
  Van: 'assets/images/recommendation-van.png',
  SUV: 'assets/images/recommendation-suv.png'
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function scrollChat() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addMessage(role, text, details) {
  const message = document.createElement('article');
  message.className = `chat-message ${role === 'user' ? 'user-message' : 'assistant-message'}`;

  let detailHtml = '';
  if (details?.recommendation) {
    const recommendation = details.recommendation;
    detailHtml = `
      <div class="ai-result-card">
        <span>Package<strong>${escapeHtml(recommendation.packageName)}</strong></span>
        <span>Price<strong>LKR ${Number(recommendation.price).toLocaleString()}</strong></span>
        <span>Estimated time<strong>${escapeHtml(recommendation.estimatedTime)}</strong></span>
        <span>Applied rule<strong>${escapeHtml(recommendation.ruleId)}</strong></span>
      </div>
      <small>${escapeHtml(details.engine)}</small>
    `;

    const vehicleType = recommendation.inputs?.vehicleType;
    if (assistantImages[vehicleType]) {
      storyImage.style.opacity = '.25';
      setTimeout(() => {
        storyImage.src = assistantImages[vehicleType];
        storyImage.style.opacity = '1';
      }, 220);
    }
  } else if (details?.busyDay) {
    detailHtml = `
      <div class="ai-result-card">
        <span>Predicted busy day<strong>${escapeHtml(details.busyDay.day)}</strong></span>
        <span>Stored bookings<strong>${escapeHtml(details.busyDay.bookings)}</strong></span>
      </div>
      <small>${escapeHtml(details.engine)}</small>
    `;
  } else if (details?.engine) {
    detailHtml = `<small>${escapeHtml(details.engine)}</small>`;
  }

  message.innerHTML = `
    <div class="message-avatar">${role === 'user' ? 'YOU' : 'AI'}</div>
    <div class="message-content"><p>${escapeHtml(text)}</p>${detailHtml}</div>
  `;
  chatWindow.appendChild(message);
  scrollChat();
}

function showTyping() {
  const typing = document.createElement('article');
  typing.className = 'chat-message assistant-message';
  typing.id = 'typingMessage';
  typing.innerHTML = `
    <div class="message-avatar">AI</div>
    <div class="message-content"><div class="typing-dots"><i></i><i></i><i></i></div></div>
  `;
  chatWindow.appendChild(typing);
  scrollChat();
}

function removeTyping() {
  document.getElementById('typingMessage')?.remove();
}

function renderSuggestions(suggestions = []) {
  quickPrompts.innerHTML = '';
  suggestions.slice(0, 3).forEach((suggestion) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = suggestion;
    quickPrompts.appendChild(button);
  });
}

async function checkAssistantServer() {
  try {
    const response = await fetch(`${assistantApiBase}/api/health`, { credentials: 'include' });
    if (!response.ok) throw new Error('Offline');
    serverStatus.className = 'ai-connection online';
    serverStatus.innerHTML = '<i></i>AI server online';
  } catch (error) {
    serverStatus.className = 'ai-connection offline';
    serverStatus.innerHTML = '<i></i>AI server offline';
  }
}

async function checkAssistantSession() {
  try {
    const response = await fetch(`${assistantApiBase}/api/session`, { credentials: 'include' });
    if (!response.ok) throw new Error('Authentication required');
    const data = await response.json();
    assistantUserName.textContent = data.user.full_name;
  } catch (error) {
    window.location.href = 'login.html?next=ai-assistant.html';
  }
}

async function sendAssistantMessage(message) {
  const cleanMessage = message.trim();
  if (!cleanMessage) return;

  addMessage('user', cleanMessage);
  assistantInput.value = '';
  sendButton.disabled = true;
  showTyping();

  try {
    const response = await fetch(`${assistantApiBase}/api/assistant`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: cleanMessage })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Assistant request failed');

    removeTyping();
    addMessage('assistant', data.reply, data);
    renderSuggestions(data.suggestions);
    serverStatus.className = 'ai-connection online';
    serverStatus.innerHTML = '<i></i>AI server online';
  } catch (error) {
    removeTyping();
    addMessage('assistant', 'I cannot reach the AquaLux AI server. Run python server.py from the project folder, then try again.');
    serverStatus.className = 'ai-connection offline';
    serverStatus.innerHTML = '<i></i>AI server offline';
  } finally {
    sendButton.disabled = false;
    assistantInput.focus();
  }
}

assistantForm.addEventListener('submit', (event) => {
  event.preventDefault();
  sendAssistantMessage(assistantInput.value);
});

assistantInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    assistantForm.requestSubmit();
  }
});

quickPrompts.addEventListener('click', (event) => {
  if (event.target.matches('button')) sendAssistantMessage(event.target.textContent);
});

document.getElementById('assistantLogoutButton').addEventListener('click', async () => {
  await fetch(`${assistantApiBase}/api/logout`, { method: 'POST', credentials: 'include' });
  localStorage.removeItem('loggedUser');
  localStorage.removeItem('loggedRole');
  window.location.href = 'login.html';
});

checkAssistantSession();
checkAssistantServer();
