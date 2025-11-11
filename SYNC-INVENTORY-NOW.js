// 🔥 MANUAL SYNC SCRIPT - Run this in browser console to sync inventory NOW

// Step 1: Make sure you're logged in as cashier
// Step 2: Paste this entire script in browser console (F12 → Console)
// Step 3: Press Enter

console.log('🔥 Starting manual inventory sync...');

fetch('https://pos-system-final-nov-2025-production.up.railway.app/api/data-management/refresh', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ SYNC RESULT:', data);
  
  if (data.message || data.results) {
    alert(`✅ Sync complete!\n\nStores: ${data.results?.stores?.synced || 'N/A'}\nProducts: ${data.results?.products?.created || 0} created, ${data.results?.products?.updated || 0} updated\nInventory: ${data.results?.inventory?.updated || 0} updated\n\nReloading page...`);
    
    // Clear cache and reload
    localStorage.removeItem('products_all_stores');
    setTimeout(() => location.reload(), 2000);
  } else {
    alert('⚠️ Sync may have completed. Check console for details. Reloading...');
    setTimeout(() => location.reload(), 2000);
  }
})
.catch(err => {
  console.error('❌ SYNC ERROR:', err);
  alert('❌ Sync failed. Check console for details.');
});

