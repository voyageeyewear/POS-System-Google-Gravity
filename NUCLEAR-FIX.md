# 🔥 NUCLEAR FIX - Complete System Reset

## Run these commands in browser console IN ORDER:

### Step 1: Clear Everything
```javascript
localStorage.clear();
sessionStorage.clear();
console.log('✅ Step 1: Cache cleared');
```

### Step 2: Login as Admin
Go to: https://[your-frontend-url]/login
- Email: admin@pos.com
- Password: admin123

### Step 3: Force Create Demo Data (Run in console AFTER logging in as admin)
```javascript
fetch('https://pos-system-final-nov-2025-production.up.railway.app/api/data-management/refresh', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Demo data created:', data);
  alert('✅ Demo data created! Now assign store to cashier.');
})
.catch(err => console.error('❌ Error:', err));
```

### Step 4: Assign Store to Cashier
1. Go to "Manage Users" in admin panel
2. Find your cashier user
3. Click "Edit"
4. Select a store (e.g., "Delhi Store")
5. Click "Save"

### Step 5: Logout and Login as Cashier
```javascript
localStorage.clear();
location.href = '/login';
```

Then login with cashier credentials.

