const axios = require("axios");

// Configuration - default to development URL
const API_ENDPOINT =
  process.env.SCANNER_API_URL || "http://localhost:3000/api/barcodes/scan/drum";

// Sample barcode data - format must match "XX-HXXXX" where XX is order_id and XXXX is drum_id
const testBarcode = "52-H1024";

async function testScannerApi() {
  console.log(`Testing API endpoint: ${API_ENDPOINT}`);

  try {
    const payload = {
      barcode: testBarcode,
      timestamp: new Date().toISOString(),
    };

    console.log(`Sending test payload: ${JSON.stringify(payload)}`);

    const response = await axios.post(API_ENDPOINT, payload);

    console.log(`Response status: ${response.status}`);
    console.log(`Response data: ${JSON.stringify(response.data, null, 2)}`);

    console.log("API test completed successfully");
  } catch (error) {
    console.error("Error testing API:");
    console.error(error.message);

    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(
        `Response data: ${JSON.stringify(error.response.data, null, 2)}`
      );
    }
  }
}

// Run the test
testScannerApi();
