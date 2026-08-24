// main.js - common helper functions
const appName = 'AquaLux Auto Spa';
function setActivePage(){
  const current = location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-menu a').forEach(link => {
    if(link.getAttribute('href') && link.getAttribute('href').includes(current)) link.classList.add('active');
  });
}
function formatLKR(value){ return 'LKR ' + Number(value || 0).toLocaleString('en-LK'); }
function formatServiceDuration(value){const minutes=Number(value||0);if(minutes&&minutes%60===0){const hours=minutes/60;return `${hours} hour${hours===1?'':'s'}`}return `${minutes} minutes`}
document.addEventListener('DOMContentLoaded',setActivePage);

const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function bookingStatusClass(status){const value=String(status||'').toLowerCase();return value==='completed'?'done':value==='cancelled'?'cancelled':'pending'}
function bookingAction(row,page){
 const status=String(row.status||'').toLowerCase(),id=encodeURIComponent(row.id);
 if(page==='manage-bookings.html')return `<a class="table-action" href="booking-details.html?id=${id}">${status==='completed'?'View receipt':status==='cancelled'?'Review':'View / update'}</a>`;
 if(status==='completed')return `<a class="table-action" href="receipt.html?bookingId=${id}">Receipt</a>`;
 if(status==='cancelled')return `<a class="table-action" href="create-booking.html?rebook=${id}">Rebook</a>`;
 return `<a class="table-action" href="update-booking.html?id=${id}">Update</a>`;
}
async function apiRows(url){const r=await fetch(url,{credentials:'include'});if(!r.ok)throw Error('Unable to load records');return r.json()}
function fillTable(rows,render){const body=document.querySelector('table tbody');if(!body)return;body.innerHTML=rows.length?rows.map(render).join(''):'<tr><td colspan="8">No records available yet.</td></tr>'}
async function loadCurrentDataPage(){
 const page=location.pathname.split('/').pop();
 try{
  if(['manage-customers.html','customer-list.html'].includes(page))fillTable(await apiRows('/api/customers'),r=>`<tr><td>C${r.id}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.phone)}</td><td>${escapeHtml(r.email)}</td><td>${escapeHtml(r.address)}</td></tr>`);
  if(['manage-vehicles.html','vehicle-list.html'].includes(page))fillTable(await apiRows('/api/vehicles'),r=>`<tr><td>V${r.id}</td><td>${escapeHtml(r.vehicle_no)}</td><td>${escapeHtml(r.vehicle_type)}</td><td>${escapeHtml(r.owner_name)}</td><td>${escapeHtml(r.notes)}</td></tr>`);
  if(['manage-packages.html','view-packages.html'].includes(page))fillTable(await apiRows('/api/packages'),r=>`<tr><td>${escapeHtml(r.package_name)}</td><td>${escapeHtml(r.vehicle_type)}</td><td>${formatServiceDuration(r.estimated_minutes)}</td><td>${formatLKR(r.price)}</td>${page==='manage-packages.html'?`<td><a href="edit-package.html?id=${r.id}">Edit</a></td>`:''}</tr>`);
  if(['manage-bookings.html','booking-list.html'].includes(page))fillTable(await apiRows('/api/bookings'),r=>`<tr><td>BK${r.id}</td><td>${escapeHtml(r.customer_name)}</td><td>${escapeHtml(r.vehicle_no)}<small class="vehicle-kind">${escapeHtml(r.vehicle_type)}</small></td><td>${escapeHtml(r.package_name)}</td><td>${escapeHtml(r.booking_date)}<small class="booking-time">${escapeHtml(r.booking_time)}</small></td><td><span class="status ${bookingStatusClass(r.status)}">${escapeHtml(r.status)}</span></td><td>${bookingAction(r,page)}</td></tr>`);
  if(['my-bookings.html','booking-status.html'].includes(page))fillTable(await apiRows('/api/bookings'),r=>`<tr><td>BK${r.id}</td><td>${escapeHtml(r.package_name)}</td><td>${r.booking_date}</td><td>${r.booking_time}</td><td>${escapeHtml(r.status)}</td></tr>`);
  if(['manage-payments.html','payment-list.html'].includes(page))fillTable(await apiRows('/api/payments'),r=>`<tr><td>PAY${r.id}</td><td>BK${r.booking_id}</td><td>${formatLKR(r.amount)}</td><td>${r.payment_date}</td><td>${escapeHtml(r.status)}</td></tr>`);
  if(page==='manage-users.html')fillTable(await apiRows('/api/admin/users'),r=>`<tr><td>${escapeHtml(r.full_name)}</td><td>${escapeHtml(r.username)}</td><td>${escapeHtml(r.role)}</td><td>${r.last_login?'Active':'Created'}</td><td><a href="edit-user.html?id=${r.id}">Edit</a></td></tr>`);
  if(page==='daily-report.html'||page==='weekly-report.html'){const p=page.startsWith('daily')?'daily':'weekly';fillTable(await apiRows('/api/reports/'+p),r=>`<tr><td>${r.label}</td><td>${r.bookings}</td><td>${r.completed}</td><td>${formatLKR(r.income)}</td></tr>`)}
 }catch(e){console.error(e)}
}
async function loadBookingDocumentPage(page){
 const params=new URLSearchParams(location.search),id=params.get('id')||params.get('bookingId');
 if(!id||!['booking-details.html','receipt.html'].includes(page))return;
 try{
  const response=await fetch(`/api/bookings/${encodeURIComponent(id)}`,{credentials:'include'}),row=await response.json();
  if(!response.ok)throw Error(row.error||'Booking unavailable');
  if(page==='booking-details.html'){
   const card=document.querySelector('.content>.card');
   if(card)card.innerHTML=`<h2>Booking BK${row.id}</h2><p><b>Customer:</b> ${escapeHtml(row.customer_name)}</p><p><b>Vehicle:</b> ${escapeHtml(row.vehicle_no)} · ${escapeHtml(row.vehicle_type)}</p><p><b>Package:</b> ${escapeHtml(row.package_name)}</p><p><b>Service:</b> ${escapeHtml(row.booking_date)} at ${escapeHtml(row.booking_time)}</p><p><b>Duration:</b> ${escapeHtml(row.estimated_time)}</p><p><b>Catalogue price:</b> ${formatLKR(row.package_price)}</p><p><b>Status:</b> ${escapeHtml(row.status)}</p><p><b>Payment:</b> ${row.payment_id?`${formatLKR(row.paid_amount)} · ${escapeHtml(row.payment_status)}`:'Not recorded'}</p>`;
  }else{
   const receipt=document.querySelector('.receipt-box');
   if(receipt)receipt.innerHTML=`<h1>AquaLux Auto Spa</h1><p style="text-align:center">Vehicle Wash Receipt</p><div class="receipt-row"><span>Receipt No</span><b>${row.payment_id?`PAY${row.payment_id}`:'Not paid'}</b></div><div class="receipt-row"><span>Booking</span><b>BK${row.id}</b></div><div class="receipt-row"><span>Customer</span><b>${escapeHtml(row.customer_name)}</b></div><div class="receipt-row"><span>Vehicle</span><b>${escapeHtml(row.vehicle_no)}</b></div><div class="receipt-row"><span>Package</span><b>${escapeHtml(row.package_name)}</b></div><div class="receipt-row"><span>Package price</span><b>${formatLKR(row.package_price)}</b></div><div class="receipt-row"><span>Discount</span><b>${formatLKR(row.discount||0)}</b></div><div class="receipt-row receipt-total"><span>Total paid</span><b>${formatLKR(row.paid_amount||0)}</b></div><br><button class="btn no-print" onclick="window.print()">Print Receipt</button>`;
  }
 }catch(error){console.error(error)}
}
async function saveSystemUser(e){e.preventDefault();const id=new URLSearchParams(location.search).get('id'),p={id,fullName:fullName.value,username:username.value,password:password.value,role:role.value};const r=await fetch('/api/admin/users',{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}),d=await r.json();alert(d.message||d.error);if(r.ok&&!id)e.target.reset()}
async function loadEditForm(page){const id=Number(new URLSearchParams(location.search).get('id'));if(!id)return;if(page==='edit-package.html'){const row=(await apiRows('/api/packages')).find(x=>x.id===id);if(row){packageName.value=row.package_name;vehicleType.value=row.vehicle_type;price.value=row.price;estimatedTime.value=row.estimated_minutes}}if(page==='edit-user.html'){const row=(await apiRows('/api/admin/users')).find(x=>x.id===id);if(row){fullName.value=row.full_name;username.value=row.username;role.value=row.role}}}
document.addEventListener('DOMContentLoaded',()=>{loadCurrentDataPage();const p=location.pathname.split('/').pop();loadEditForm(p);loadBookingDocumentPage(p);if(p==='add-user.html'||p==='edit-user.html'){const f=document.querySelector('form');if(f){f.removeAttribute('onsubmit');f.addEventListener('submit',saveSystemUser)}}document.querySelectorAll('.search-input').forEach(i=>i.addEventListener('input',()=>document.querySelectorAll('table tbody tr').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(i.value.toLowerCase())?'':'none')))})

// Builds a richer shared interface for every admin and staff page.
function enhanceInternalInterface(){
 const path=location.pathname,page=path.split('/').pop(),isAdmin=path.includes('/admin/'),isStaff=path.includes('/staff/');
 if(!isAdmin&&!isStaff)return;
 document.body.classList.add('internal-app',isAdmin?'admin-interface':'staff-interface');
 const savedTheme=localStorage.getItem('aqualuxTheme')||'light';
 document.documentElement.setAttribute('data-theme',savedTheme);
 const topbar=document.querySelector('.topbar');
 const userBadge=topbar?.querySelector('.badge');
 if(topbar&&!topbar.querySelector('.theme-toggle')){
   const toggle=document.createElement('button');
   toggle.type='button';toggle.className='theme-toggle';toggle.setAttribute('aria-label','Switch dark and light mode');
   const sync=()=>{const dark=document.documentElement.getAttribute('data-theme')==='dark';toggle.innerHTML=`<span>${dark?'☀':'☾'}</span><b>${dark?'Light':'Dark'} mode</b>`;toggle.setAttribute('aria-pressed',String(dark))};
   toggle.addEventListener('click',()=>{const next=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',next);localStorage.setItem('aqualuxTheme',next);sync()});
   sync();
   if(userBadge)userBadge.parentElement.insertBefore(toggle,userBadge);else topbar.appendChild(toggle);
 }
 const icons={dashboard:'⌂',user:'♙',customer:'♙',vehicle:'◇',package:'▣',booking:'▦',payment:'◈',report:'▥',insight:'✦',setting:'⚙',profile:'◉',logout:'↗'};
 document.querySelectorAll('.sidebar-menu a').forEach(link=>{
   const label=link.textContent.replace(/^\s*•\s*/,'').trim(),href=(link.getAttribute('href')||'').toLowerCase();
   const key=Object.keys(icons).find(k=>href.includes(k))||(href==='#'?'logout':'dashboard');
   link.innerHTML=`<span class="nav-symbol">${icons[key]}</span><span class="nav-label">${escapeHtml(label)}</span>`;
 });
 const sidebar=document.querySelector('.sidebar');
 if(sidebar&&!sidebar.querySelector('.sidebar-role-card'))sidebar.insertAdjacentHTML('beforeend',`<div class="sidebar-role-card"><span>${isAdmin?'ADMIN CONTROL':'SERVICE TEAM'}</span><strong>${isAdmin?'Business command':'Daily operations'}</strong><small>Secure AquaLux workspace</small></div>`);
 if(page.endsWith('dashboard.html')||document.body.classList.contains('static-staff-redesign'))return;
 const title=document.querySelector('.page-title h1')?.textContent||'AquaLux Workspace';
 const groups=[
  {words:['customer','user','profile'],type:'people',eyebrow:'PEOPLE & ACCESS',text:'Keep customer and team information accurate, organised and protected.'},
  {words:['vehicle'],type:'vehicle',eyebrow:'VEHICLE RECORDS',text:'Track every registered vehicle and connect it with the correct owner.'},
  {words:['booking'],type:'booking',eyebrow:'SERVICE SCHEDULE',text:'Coordinate wash appointments, availability and progress without conflicts.'},
  {words:['payment','receipt'],type:'payment',eyebrow:'PAYMENT DESK',text:'Complete services with clear, reliable and searchable payment records.'},
  {words:['package'],type:'package',eyebrow:'WASH SERVICES',text:'Build consistent service packages with clear prices and estimated times.'},
  {words:['report','insight'],type:'report',eyebrow:'BUSINESS INTELLIGENCE',text:'Turn daily operations into useful performance and planning information.'},
  {words:['setting'],type:'settings',eyebrow:'SYSTEM CONTROL',text:'Maintain the centre’s core preferences and administrative configuration.'}
 ];
 const group=groups.find(g=>g.words.some(w=>page.includes(w)))||groups[0];
 if(topbar)topbar.insertAdjacentHTML('afterend',`<section class="page-context-banner ${group.type}"><div><span>${group.eyebrow}</span><h2>${escapeHtml(title)}</h2><p>${group.text}</p></div><div class="context-emblem"><i></i><strong>${isAdmin?'A':'S'}</strong><small>${isAdmin?'ADMIN':'STAFF'}</small></div></section>`);
 const primary=document.querySelector('.form-card,.table-card,.content>.card');
 if(primary)primary.classList.add('featured-work-card');
}
document.addEventListener('DOMContentLoaded',enhanceInternalInterface);
