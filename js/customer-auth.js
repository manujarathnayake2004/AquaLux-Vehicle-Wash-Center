const customerAuthBase = window.location.port === '5000' ? '' : 'http://127.0.0.1:5000';

async function loadCustomerSession() {
  try {
    const response = await fetch(`${customerAuthBase}/api/session`, { credentials: 'include' });
    if (!response.ok) throw new Error('Authentication required');
    const data = await response.json();
    const user = data.user;

    document.querySelectorAll('[data-customer-name]').forEach((element) => {
      element.textContent = user.full_name;
    });
    document.querySelectorAll('[data-vehicle-summary]').forEach((element) => {
      element.textContent = `${user.vehicle_type || 'Vehicle'} · ${user.vehicle_number || 'Number not added'}`;
    });

    const vehicleType = document.getElementById('vehicleType');
    if (vehicleType && user.vehicle_type) {
      vehicleType.value = user.vehicle_type;
      vehicleType.dispatchEvent(new Event('change'));
    }
  } catch (error) {
    window.location.href = 'login.html?next=customer-ai.html';
  }
}

document.getElementById('customerLogoutButton')?.addEventListener('click', async () => {
  await fetch(`${customerAuthBase}/api/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  localStorage.removeItem('loggedUser');
  localStorage.removeItem('loggedRole');
  window.location.href = 'login.html';
});

loadCustomerSession();
