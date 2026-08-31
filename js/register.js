const isRegistrationServer = ['127.0.0.1', 'localhost'].includes(window.location.hostname)
  && window.location.port === '5000';
const registrationApiBase = isRegistrationServer
  ? window.location.origin
  : 'http://127.0.0.1:5000';
const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');
const registerButton = document.getElementById('registerButton');
let registrationServerReady = false;

function clearRegistrationMessage() {
  registerMessage.className = 'login-result';
  registerMessage.removeAttribute('role');
  registerMessage.replaceChildren();
}

function showRegistrationMessage(type, title, message) {
  registerMessage.className = `login-result show ${type}`;
  registerMessage.setAttribute('role', type === 'error' ? 'alert' : 'status');

  const heading = document.createElement('h3');
  heading.textContent = title;

  const paragraph = document.createElement('p');
  paragraph.textContent = message;

  registerMessage.replaceChildren(heading, paragraph);
}

async function connectRegistrationServer() {
  registerButton.disabled = true;

  try {
    const response = await fetch(`${registrationApiBase}/api/health`, {
      credentials: 'include',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Server unavailable');

    if (!isRegistrationServer) {
      window.location.replace(`${registrationApiBase}/register.html${window.location.search}`);
      return;
    }

    registrationServerReady = true;
    registerButton.disabled = false;
  } catch (error) {
    registrationServerReady = false;
    showRegistrationMessage(
      'error',
      'AquaLux server is not running',
      'Close this page and double-click START-AQUALUX.bat. The registration page will then work correctly.'
    );
  }
}

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearRegistrationMessage();

  if (!registrationServerReady) {
    await connectRegistrationServer();
    if (!registrationServerReady) return;
  }

  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  if (password !== confirmPassword) {
    showRegistrationMessage(
      'error',
      'Passwords do not match',
      'Enter the same password in both password fields.'
    );
    return;
  }

  const account = {
    fullName: document.getElementById('fullName').value.trim(),
    username: document.getElementById('registerUsername').value.trim(),
    email: document.getElementById('registerEmail').value.trim(),
    phone: document.getElementById('registerPhone').value.trim(),
    vehicleType: document.getElementById('registerVehicleType').value,
    vehicleNumber: document.getElementById('vehicleNumber').value.trim(),
    password
  };

  registerButton.disabled = true;
  registerButton.textContent = 'Creating account...';
  let accountCreated = false;

  try {
    const response = await fetch(`${registrationApiBase}/api/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Account creation failed.');

    accountCreated = true;
    showRegistrationMessage(
      'success',
      'Account created successfully',
      'Your details were saved securely. Redirecting to the login page...'
    );
    registerButton.textContent = 'Account created ✓';
    setTimeout(() => {
      window.location.href = `login.html?registered=1&username=${encodeURIComponent(data.username)}&next=customer-ai.html`;
    }, 1800);
  } catch (error) {
    if (error instanceof TypeError) registrationServerReady = false;
    const message = error instanceof TypeError
      ? 'The secure server connection was lost. Restart START-AQUALUX.bat and try again.'
      : error.message;
    showRegistrationMessage('error', 'Unable to create account', message);
  } finally {
    if (!accountCreated) {
      registerButton.disabled = !registrationServerReady;
      registerButton.innerHTML = 'Create customer account <span>→</span>';
    }
  }
});

connectRegistrationServer();
