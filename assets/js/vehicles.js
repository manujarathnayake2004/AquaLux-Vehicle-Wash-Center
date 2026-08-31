async function saveVehicle(event){
  event.preventDefault();
  if(!validateRequiredForm(event.target))return alert('Please fill all required fields.');
  const number=vehicleNo.value.trim().toUpperCase();
  const kind=vehicleType.value;
  const ownerName=owner.value.trim();
  const serviceNotes=notes.value.trim();

  if(number.length<3||number.length>20||!/^[A-Z0-9 -]+$/.test(number))return alert('Please enter a valid vehicle registration number.');
  if(!['Motorcycle','Car','Van','SUV'].includes(kind))return alert('Please select a valid vehicle type.');
  if(ownerName.length<3)return alert('Please enter the owner or customer name.');

  const response=await fetch('/api/vehicles',{
    method:'POST',
    credentials:'include',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({vehicleNo:number,vehicleType:kind,owner:ownerName,notes:serviceNotes})
  });
  const data=await response.json();
  alert(data.message||data.error);
  if(response.ok){
    event.target.reset();
    location.href='vehicle-list.html';
  }
}
