let currentAquaLuxUser=null;

function populateSessionFields(user){
  document.querySelectorAll('[data-user-name]').forEach(element=>element.textContent=user.full_name||user.username||'AquaLux User');
  document.querySelectorAll('[data-user-email]').forEach(element=>element.textContent=user.email||'Not added');
  document.querySelectorAll('[data-user-phone]').forEach(element=>element.textContent=user.phone||'Not added');
  document.querySelectorAll('[data-user-role]').forEach(element=>element.textContent=(user.role||'user').replace(/^./,letter=>letter.toUpperCase()));
  document.querySelectorAll('[data-user-vehicle]').forEach(element=>{
    const parts=[user.vehicle_type,user.vehicle_number].filter(Boolean);
    element.textContent=parts.length?parts.join(' · '):'No customer vehicle saved on this login account';
  });
}

async function showLoggedUser(){
  try{
    const r=await fetch('/api/session',{credentials:'include'});
    if(!r.ok)throw Error('Authentication required');
    const d=await r.json();
    currentAquaLuxUser=d.user;
    populateSessionFields(d.user);
    document.dispatchEvent(new CustomEvent('aqualux:session-ready',{detail:d.user}));
  }catch(e){
    location.href='/login.html';
  }
}

async function logoutUser(){
  await fetch('/api/logout',{method:'POST',credentials:'include'});
  localStorage.removeItem('loggedUser');
  localStorage.removeItem('loggedRole');
  localStorage.removeItem('aqualuxTheme');
  location.href='/login.html';
}

document.addEventListener('DOMContentLoaded',showLoggedUser);
