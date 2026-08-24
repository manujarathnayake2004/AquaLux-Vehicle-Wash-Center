// validation.js - reusable frontend validations
function isEmpty(value){ return !value || value.trim() === ''; }
function isPhone(value){ return /^0\d{9}$/.test(value.trim()); }
function isVehicleNumber(value){ return /^[A-Z]{2,3}[- ]?\d{4}$|^[A-Z]{2,3}[- ]?[A-Z]{2,3}[- ]?\d{4}$/i.test(value.trim()); }
function validateRequiredForm(form){
  let valid = true;
  form.querySelectorAll('[required]').forEach(input => {
    if(isEmpty(input.value)){ input.style.borderColor = '#b00020'; valid = false; }
    else input.style.borderColor = '#d6e1e1';
  });
  return valid;
}
