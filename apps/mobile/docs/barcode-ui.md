# Barcode Scanning Documentation

## `src/pages/Index.tsx`

> This is the main component for the barcode scanning feature. It handles the barcode input, validation, and processing.

**State variables**:

```tsx
const Index = () => {
  // View switching navigation
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("Transport");
  const [isLoading, setIsLoading] = useState(true);

  // Search input visibility
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Drum IDs scanned
  const [scannedDrums, setScannedDrums] = useState<string[]>([]);
  // Barcode input (using hidden HTML input element)
  const [barcodeInput, setBarcodeInput] = useState("");
  // Last scanned value
  const [lastScannedValue, setLastScannedValue] = useState("");

  // Scan feedback visibility
  const [showScanFeedback, setShowScanFeedback] = useState(false);
  // Search and scan feedback timeout references
  const searchTimeoutRef = useRef<number | null>(null);
  const scanFeedbackTimeoutRef = useRef<number | null>(null);

  // Input reference
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
```

**Event handlers**:

```tsx
// Navigation handler for the floating menu
const handleNavigation = (itemId: string) => {
  switch (itemId) {
    case "stats":
      navigate("/");
      break;
    case "team":
      navigate("/team");
      break;
    case "scan":
      navigate("/scan");
      break;
    case "search":
      setIsSearchVisible(true);
      // Focus the search input after it's visible
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      startSearchTimeout();
      break;
    case "settings":
      setActiveView("Settings");
      break;
    default:
      navigate("/");
  }
};
```

```tsx
// Handle barcode scan input
const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  console.log("Barcode input changed:", value);

  setBarcodeInput(value);
  setLastScannedValue(value);
  setShowScanFeedback(true);

  // Clear previous timeout if exists
  if (scanFeedbackTimeoutRef.current) {
    window.clearTimeout(scanFeedbackTimeoutRef.current);
  }

  // Set timeout to hide the feedback after 3 seconds
  scanFeedbackTimeoutRef.current = window.setTimeout(() => {
    setShowScanFeedback(false);
  }, 3000);

  // Process the scan when input contains a complete barcode
  // This is a simple implementation that processes on every change
  // Real implementation might want to detect a complete scan (e.g., by enter key)
  processBarcodeScan(value);
};

// Handle keydown events for the barcode input
const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  console.log("Barcode key pressed:", e.key, "Current value:", barcodeInput);

  // If Enter key is pressed, process the current input
  if (e.key === "Enter") {
    console.log("Enter key pressed, processing scan:", barcodeInput);
    processBarcodeScan(barcodeInput);
  }
};
```

(Deprecated - demo only. Replace with server action or API route handler)

Process scanned barcode, with respect to the type of task being performed.

**Goods inwards** (scanning drums arrived from supplier):

- Drum IDs known in advance
- Labels printed and scanned upon fixing new labels to drums
- UI: Show drum ID badges for ordered batch

**Transport for production** (scanning drums from given batch to be transported to lab):

- Full batch of drums known to database
- User can scan and transport any drum matching the `item_id` batch criteria defined by the production manager in `production.jobs.batch_id` field
- UI: Show suggested drum IDs from the batch, but do not impose any restrictions on what can be scanned (for operational practicality reasons)

CRUD actions for processing drum scans:

- Add new scan record to `logs.drum_scan` table

```tsx
// Process the scanned barcode to find matching drum IDs
const processBarcodeScan = (scannedValue: string) => {
  console.log("Processing barcode scan:", scannedValue);

  // Add validation logic here
  // For this demo, we'll process immediately on any input
  handleDrumScan(scannedValue);

  // Clear the input field after processing
  setTimeout(() => {
    console.log("Clearing input field");
    setBarcodeInput("");
    // Re-focus the input for the next scan
    barcodeInputRef.current?.focus();
  }, 100);
};
```

```tsx
// Check if scanned value contains any of the drum IDs and update state
const handleDrumScan = (scannedValue: string) => {
  console.log("Handling drum scan for value:", scannedValue);

  // All potential drum IDs to check against (demo only)
  const pentaneDrumIds = ["17583", "17584", "17585", "17586", "17587"];
  const aceticAcidDrumIds = [
    "16120",
    "16121",
    "16122",
    "16123",
    "16124",
    "16125",
    "16126",
    "16127",
    "16128",
    "16129",
    "16130",
    "16131",
  ];

  // Check if the scanned value contains any drum IDs
  const allDrumIds = [...pentaneDrumIds, ...aceticAcidDrumIds];
  console.log("Checking against all drum IDs:", allDrumIds);

  const foundDrumId = allDrumIds.find((drumId) =>
    scannedValue.includes(drumId)
  );

  if (foundDrumId) {
    console.log(`Found matching drum ID: ${foundDrumId}`);

    if (scannedDrums.includes(foundDrumId)) {
      console.log(`Drum ID ${foundDrumId} already scanned, skipping`);
    } else {
      // Add the drum ID to the scanned list
      console.log(`Adding drum ID ${foundDrumId} to scanned list`);
      setScannedDrums((prev) => [...prev, foundDrumId]);
    }
  } else {
    console.log("No matching drum ID found in scanned value");
  }
};
```
