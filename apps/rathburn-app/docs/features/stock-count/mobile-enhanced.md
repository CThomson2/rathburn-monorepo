# Mobile Enhanced Stock Count View

```ts
// Add these to your _app.js or layout component

// In your <head> section
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

// Mobile-specific styles
.mobile-input {
  font-size: 16px; /* Prevents iOS zoom on focus */
}

// Add this to the stock-count.js page

// Mobile detection
useEffect(() => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // Add a class to the body for mobile-specific styling
    document.body.classList.add('mobile-view');
  }
}, []);

// Mobile-specific adjustments to the stock-count.js page
// Add this to the form elements
className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mobile-input"
```
