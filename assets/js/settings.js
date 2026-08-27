async function loadSystemSettings(){
  try{
    const response=await fetch('/api/admin/settings',{credentials:'include'});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Unable to load system settings.');
    centerName.value=data.center_name||'AquaLux Auto Spa';
    contact.value=data.contact_number||'';
    openTime.value=data.opening_time||'08:00';
    closeTime.value=data.closing_time||'18:00';
  }catch(error){alert(error.message)}
}

async function saveSystemSettings(event){
  event.preventDefault();
  const payload={
    centerName:centerName.value.trim(),
    contactNumber:contact.value.trim(),
    openingTime:openTime.value,
    closingTime:closeTime.value
  };
  if(payload.centerName.length<3)return alert('Please enter a valid centre name.');
  if(!/^\+?[0-9 ()-]{9,18}$/.test(payload.contactNumber))return alert('Please enter a valid contact number.');
  if(!payload.openingTime||!payload.closingTime)return alert('Please select opening and closing times.');
  const response=await fetch('/api/admin/settings',{
    method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)
  });
  const data=await response.json();
  alert(data.message||data.error);
  if(response.ok)loadSystemSettings();
}

document.addEventListener('DOMContentLoaded',loadSystemSettings);
