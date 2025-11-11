// 🔥 PASTE THIS IN BROWSER CONSOLE TO READ THE BLOB ERROR

// This will read the actual error message from the Blob response
(async () => {
  try {
    const response = await fetch('https://pos-system-final-nov-2025-production.up.railway.app/api/sales/1/invoice', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.log('%c❌ BACKEND ERROR:', 'background: red; color: white; font-size: 16px; padding: 5px;');
      console.log(text);
      
      try {
        const json = JSON.parse(text);
        console.log('%c📋 ERROR DETAILS:', 'background: orange; color: white; font-size: 14px; padding: 5px;');
        console.log(json);
        alert('Backend Error: ' + json.error);
      } catch (e) {
        alert('Backend Error: ' + text);
      }
    } else {
      console.log('✅ Success! Invoice should download.');
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    alert('Network error: ' + error.message);
  }
})();

