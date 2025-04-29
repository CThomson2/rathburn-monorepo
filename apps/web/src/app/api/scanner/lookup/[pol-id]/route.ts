import { NextRequest, NextResponse } from "next/server";
import { executeServerDbOperation } from "@/lib/database";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * API route for looking up a purchase order line by ID
 * Primary endpoint fetched when a drum label QR code is scanned
 * QR code has the format:
 * "https://<api-url>/api/scanner/lookup/<pol-id>"
 * Returns HTML response on GET request
 * HTML contains information on the drums in the purchase order line
 */

// Function to fetch purchase order line data and associated drums
async function fetchPurchaseOrderLineData(polId: string) {
  return executeServerDbOperation(async (supabase: SupabaseClient) => {
    try {
      // First get the purchase order line details with joins to get material and supplier info
      const { data: polData, error: polError } = await supabase
        .schema("inventory")
        .from("purchase_order_lines")
        .select(`
          pol_id,
          po_id,
          items!inner (
            item_id,
            name
          ),
          purchase_orders!inner (
            po_number,
            order_date,
            suppliers!inner (
              name
            )
          )
        `)
        .eq("pol_id", polId)
        .single();

      if (polError) {
        console.error("Error fetching purchase order line:", polError);
        throw new Error("Failed to fetch purchase order line data");
      }

      if (!polData) {
        throw new Error("Purchase order line not found");
      }

      // Then get all drums associated with this purchase order line
      const { data: drums, error: drumsError } = await supabase
        .schema("inventory")
        .from("purchase_order_drums")
        .select("pod_id, serial_number, is_printed, created_at")
        .eq("pol_id", polId)
        .order("created_at", { ascending: true });

      if (drumsError) {
        console.error("Error fetching drums:", drumsError);
        throw new Error("Failed to fetch drum data");
      }

      return {
        polData,
        drums: drums || []
      };
    } catch (error) {
      console.error("Error in fetchPurchaseOrderLineData:", error);
      throw error;
    }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { "pol-id": string } }
) {
  try {
    const polId = params["pol-id"];
    
    if (!polId) {
      return new NextResponse("Missing purchase order line ID", { status: 400 });
    }

    const data = await fetchPurchaseOrderLineData(polId);
    
    // Format date for display
    const poDate = data.polData.purchase_orders?.order_date 
      ? new Date(data.polData.purchase_orders.order_date).toLocaleDateString()
      : "N/A";
      
    // Generate HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Drum Information</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 5px solid #007bff;
          }
          h1 {
            margin-top: 0;
            color: #333;
          }
          .info-row {
            display: flex;
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            min-width: 150px;
          }
          .info-value {
            flex: 1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          tr:hover {
            background-color: #f5f5f5;
          }
          .logo {
            text-align: center;
            margin-bottom: 20px;
            font-size: 24px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="logo">RATHBURN CHEMICALS</div>
        
        <div class="header">
          <h1>${data.polData.items?.name || 'Unknown Material'}</h1>
        </div>
        
        <div class="info-section">
          <div class="info-row">
            <div class="info-label">Purchase Order:</div>
            <div class="info-value">${data.polData.purchase_orders?.po_number || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Supplier:</div>
            <div class="info-value">${data.polData.purchase_orders?.suppliers?.name || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Date:</div>
            <div class="info-value">${poDate}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Total Drums:</div>
            <div class="info-value">${data.drums.length}</div>
          </div>
        </div>
        
        <h2>Drum List</h2>
        <table>
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${data.drums.map(drum => `
              <tr>
                <td>${drum.serial_number}</td>
                <td>${new Date(drum.created_at).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p style="margin-top: 40px; text-align: center; color: #666; font-size: 14px;">
          Scanned on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        </p>
      </body>
      </html>
    `;

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error handling QR code scan:", error);
    return new NextResponse("An error occurred while processing your request", {
      status: 500,
      headers: {
        "Content-Type": "text/html",
      },
    });
  }
}

