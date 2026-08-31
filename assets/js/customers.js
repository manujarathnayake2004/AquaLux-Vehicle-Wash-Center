async function saveCustomer(event){
  event.preventDefault();
  if(!validateRequiredForm(event.target))return alert('Please fill all required fields.');
  const name=customerName.value.trim();
  const phoneValue=phone.value.trim();
  const emailValue=email.value.trim().toLowerCase();
  const addressValue=address.value.trim();

  if(name.length<3)return alert('Please enter a valid customer name.');
  if(!/^\+?[0-9 ()-]{9,18}$/.test(phoneValue))return alert('Please enter a valid phone number.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue))return alert('Please enter a valid email address.');
  if(addressValue.length<2)return alert('Please enter the customer city or address.');

  const response=await fetch('/api/customers',{
    method:'POST',
    credentials:'include',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name,phone:phoneValue,email:emailValue,address:addressValue})
  });
  const data=await response.json();
  alert(data.message||data.error);
  if(response.ok){
    event.target.reset();
    location.href='customer-list.html';
  }
}
