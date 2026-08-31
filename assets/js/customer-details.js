function customerDetailValue(value,fallback='Not added'){return escapeHtml(value||fallback)}

async function loadCustomerDetailsPage(){
  const container=document.getElementById('customerDetailContent');
  if(!container)return;
  const id=Number(new URLSearchParams(location.search).get('id'));
  if(!id){container.innerHTML='<p class="table-error-message">No customer was selected. Return to the customer list and choose View details.</p>';return}
  try{
    const [customers,vehicles,bookings]=await Promise.all([
      apiRows('/api/customers'),apiRows('/api/vehicles'),apiRows('/api/bookings')
    ]);
    const customer=customers.find(item=>Number(item.id)===id);
    if(!customer)throw new Error('The selected customer could not be found.');
    const customerVehicles=vehicles.filter(item=>String(item.owner_name).trim().toLowerCase()===String(customer.name).trim().toLowerCase());
    const customerBookings=bookings.filter(item=>String(item.customer_name).trim().toLowerCase()===String(customer.name).trim().toLowerCase()).slice(0,6);
    container.innerHTML=`
      <div class="record-summary-grid">
        <article class="record-summary-card"><span>Customer ID</span><strong>C${customer.id}</strong></article>
        <article class="record-summary-card"><span>Name</span><strong>${customerDetailValue(customer.name)}</strong></article>
        <article class="record-summary-card"><span>Phone</span><strong>${customerDetailValue(customer.phone)}</strong></article>
        <article class="record-summary-card"><span>Email</span><strong>${customerDetailValue(customer.email)}</strong></article>
        <article class="record-summary-card"><span>City / Address</span><strong>${customerDetailValue(customer.address)}</strong></article>
        <article class="record-summary-card"><span>Registered Vehicles</span><strong>${customerVehicles.length}</strong></article>
      </div>
      <h3>Registered vehicles</h3>
      <div class="related-record-list">${customerVehicles.length?customerVehicles.map(vehicle=>`<div><strong>${customerDetailValue(vehicle.vehicle_no)}</strong><span>${customerDetailValue(vehicle.vehicle_type)}</span><small>${customerDetailValue(vehicle.notes,'No service notes')}</small></div>`).join(''):'<p class="empty-related-record">No vehicle record is linked to this customer name.</p>'}</div>
      <h3>Recent bookings</h3>
      <div class="related-record-list">${customerBookings.length?customerBookings.map(booking=>`<div><strong>BK${booking.id} · ${customerDetailValue(booking.package_name)}</strong><span>${customerDetailValue(booking.booking_date)} at ${customerDetailValue(String(booking.booking_time).slice(0,5))}</span><small>${customerDetailValue(booking.status)}</small></div>`).join(''):'<p class="empty-related-record">No bookings are recorded for this customer.</p>'}</div>`;
  }catch(error){container.innerHTML=`<p class="table-error-message">${escapeHtml(error.message||'Unable to load customer details.')}</p>`}
}

document.addEventListener('DOMContentLoaded',loadCustomerDetailsPage);
