let currentAquaLuxUser=null;
async function showLoggedUser(){try{const r=await fetch('/api/session',{credentials:'include'});if(!r.ok)throw Error();const d=await r.json();currentAquaLuxUser=d.user;document.querySelectorAll('[data-user-name]').forEach(e=>e.textContent=d.user.full_name)}catch(e){location.href='/login.html'}}
async function logoutUser(){await fetch('/api/logout',{method:'POST',credentials:'include'});localStorage.clear();location.href='/login.html'}
document.addEventListener('DOMContentLoaded',showLoggedUser);
