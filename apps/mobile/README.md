# Barcode Scanner PWA

A progressive web app for barcode scanning using keyboard wedge style scanners.

## Features

- Hidden input field always active for keyboard wedge scanners
- Works offline with PWA capabilities
- Stores scan history locally
- Copy scanned codes to clipboard
- Mobile responsive design

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage Instructions

1. Open the app in a browser
2. Install as PWA (optional) by clicking "Add to Home Screen" in your browser menu
3. Scan any barcode using a keyboard wedge barcode scanner
4. Scanned barcodes will appear in the history list
5. Click on any scan to copy it to clipboard

## Technical Notes

- The app uses a hidden input field that is always focused to capture barcode scanner input
- Multiple strategies are employed to keep the input focused across different devices and browsers
- The app works offline with service worker caching
- Scan history is stored in localStorage

## Deployment

After building, deploy the contents of the `dist` folder to your web server or hosting provider. The app is ready to be used as a PWA.

For example, to deploy to a static file host:

```bash
# Build the app
npm run build

# Zip the dist folder
cd dist
zip -r ../barcode-scanner.zip *

# Upload barcode-scanner.zip to your hosting provider
```

## Browser Compatibility

The app is compatible with:

- Chrome/Edge 76+
- Firefox 67+
- Safari 13.1+
- iOS Safari 13.4+

## Barcode Scanner Compatibility

Works with any keyboard wedge/HID barcode scanner that emulates keyboard input, including:

- Honeywell scanners
- Zebra/Symbol scanners
- Datalogic scanners
- And most USB or Bluetooth barcode scanners that support HID keyboard mode
