# Express Server for Mobile App

This Express server provides API endpoints for the mobile app, particularly handling drum scan logs that previously relied on the Next.js API routes.

## Setup

1. Make sure you have these environment variables in your `.env` file:

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key (optional)
   SERVER_PORT=3001 (optional, defaults to 3001)
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Running the Server

Run the Express server:

```
npm run server
```

The server will start on port 3001 (or the port specified in SERVER_PORT environment variable).

## Available Endpoints

### POST /api/logs/drum-scan

Records a drum scan in the database.

**Request Body:**

```json
{
  "rawBarcode": "string",
  "deviceId": "string",
  "actionType": "string",
  "metadata": {
    "context": "string",
    "timestamp": "string",
    "source": "string"
  }
}
```

**Response:**

```json
{
  "scan": {
    // The inserted scan record
  }
}
```

## Development

The mobile app's ScanView component is configured to use this Express server in development mode.
The API_BASE_URL is set to `http://localhost:3001/api` when running locally.

## Authentication

The server attempts to authenticate requests using the Authorization header. If no valid user is found,
it falls back to using an anonymous user ID for development purposes.

In production, you might want to modify this behavior to reject unauthenticated requests.
