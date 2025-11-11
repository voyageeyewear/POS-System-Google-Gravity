// 🔥 PASTE THIS IN BROWSER CONSOLE TO SEE THE ACTUAL ERROR

fetch('https://pos-system-final-nov-2025-production.up.railway.app/api/sales/1/invoice', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(async response => {
  console.log('Status:', response.status);
  
  if (!response.ok) {
    const text = await response.text();
    console.error('❌ ERROR RESPONSE:', text);
    alert('Error: ' + text);
  } else {
    console.log('✅ Success!');
  }
})
.catch(err => {
  console.error('❌ NETWORK ERROR:', err);
  alert('Network error: ' + err.message);
});
