import { createClient } from "@/lib/supabase/server"; // Corrected import
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import {
  Package,
  Truck,
  CalendarDays,
  Info,
  Hash,
  Layers,
  FileText,
  Clock,
} from "lucide-react"; // Added more icons

interface BatchDetailsPageProps {
  params: {
    "pol-id": string; // This is the incoming polId from the URL
  };
}

// Updated BatchData interface to match v_batches_with_drums
interface BatchData {
  batch_id: string;
  batch_type: string | null;
  item_name: string | null;
  material_name: string | null;
  chemical_group: string | null;
  supplier_name: string | null;
  total_volume: number | null;
  created_at: string; // Batch creation date
  updated_at: string | null;
  po_number: string | null;
  input_recorded_at: string | null; // Batch input recording date
  batch_code: string | null;
  drum_count: number;
  drums_in_stock: number;
}

async function getBatchDetails(polId: string): Promise<BatchData | null> {
  const supabase = createClient(); // Instantiate client

  // Call the RPC to get batch_id from pol_id
  const { data: actualBatchId, error: rpcError } = await supabase
    .schema("inventory") // Specify the schema for the RPC function
    .rpc("get_batch_id_from_pol_id", { p_pol_id: polId }); // Corrected RPC name and parameter name

  if (rpcError) {
    console.error(
      "[BatchDetailsPage] Error calling RPC to get batch ID:",
      rpcError
    );
    return null;
  }

  if (!actualBatchId) {
    console.warn(
      `[BatchDetailsPage] RPC returned no batch ID for pol_id: ${polId}`
    );
    return null;
  }

  const { data: batchViewData, error: viewError } = await supabase
    .from("v_batches_with_drums") // This view is in the public schema by default unless specified otherwise
    .select("*")
    .eq("batch_id", actualBatchId)
    .single();

  if (viewError) {
    console.error(
      "[BatchDetailsPage] Error fetching batch details from view:",
      viewError
    );
    return null;
  }

  return batchViewData as BatchData | null;
}

/**
 * Page component for displaying batch details.
 *
 * Fetches batch details from the server given the URL param "pol-id".
 *
 * If the batch details are not found, redirects to a 404 page.
 *
 * Displays the batch details in a table with columns for:
 * - Item Name
 * - Material Name
 * - PO Number
 * - Supplier
 * - Batch Created
 * - Input Recorded
 * - Batch Code
 * - Batch Type
 * - Chemical Group
 * - Total Volume
 *
 * Also displays a progress bar indicating the percentage of drums received vs. expected.
 *
 * The progress bar is colored based on the status of the batch:
 * - Green if all drums are received
 * - Yellow if some drums are received but not all
 * - Red if no drums are received
 *
 * If the batch has no drums associated, displays a message indicating this.
 *
 * @param {BatchDetailsPageProps} props - The URL param "pol-id"
 * @returns {JSX.Element}
 * */
export default async function BatchDetailsPage({
  params,
}: BatchDetailsPageProps) {
  const polId = params["pol-id"];
  const batchDetails = await getBatchDetails(polId);

  if (!batchDetails) {
    console.warn(
      `[BatchDetailsPage] No batch details could be resolved for pol_id: ${polId}.`
    );
    notFound();
  }

  const {
    batch_id,
    batch_type,
    item_name,
    material_name,
    supplier_name,
    created_at,
    po_number,
    input_recorded_at,
    batch_code,
    drum_count,
    drums_in_stock,
    chemical_group,
    total_volume,
  } = batchDetails;

  const receivedPercentage =
    drum_count > 0 ? (drums_in_stock / drum_count) * 100 : 0;

  let statusText = "Pending";
  let statusVariant: "default" | "secondary" | "destructive" | "outline" =
    "secondary";

  if (drum_count > 0) {
    if (drums_in_stock === drum_count) {
      statusText = "Fully Received / In Stock";
      statusVariant = "default";
    } else if (drums_in_stock > 0) {
      statusText = "Partially Received / In Stock";
      statusVariant = "outline";
    }
  } else if (drum_count === 0) {
    statusText = "No Drums Associated";
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <CardTitle className="text-2xl font-semibold flex items-center">
                <Package className="mr-3 h-7 w-7 text-primary" />
                {item_name || "Batch Details"}
              </CardTitle>
              <CardDescription className="mt-1 text-md">
                Batch ID: {batch_id} (Derived from POL ID: {polId})
              </CardDescription>
            </div>
            <Badge
              variant={statusVariant}
              className="mt-2 sm:mt-0 text-sm px-3 py-1 self-start sm:self-center"
            >
              {statusText}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <InfoItem
              icon={<Layers className="h-5 w-5 text-muted-foreground" />}
              label="Item Name"
              value={item_name}
            />
            <InfoItem
              icon={<FileText className="h-5 w-5 text-muted-foreground" />}
              label="Material Name (Chemical)"
              value={material_name}
            />
            {po_number && (
              <InfoItem
                icon={<Hash className="h-5 w-5 text-muted-foreground" />}
                label="PO Number"
                value={po_number}
              />
            )}
            {supplier_name && (
              <InfoItem
                icon={<Truck className="h-5 w-5 text-muted-foreground" />}
                label="Supplier"
                value={supplier_name}
              />
            )}
            <InfoItem
              icon={<CalendarDays className="h-5 w-5 text-muted-foreground" />}
              label="Batch Created"
              value={new Date(created_at).toLocaleDateString()}
            />
            {input_recorded_at && (
              <InfoItem
                icon={<Clock className="h-5 w-5 text-muted-foreground" />}
                label="Input Recorded"
                value={new Date(input_recorded_at).toLocaleDateString()}
              />
            )}
            {batch_code && (
              <InfoItem
                icon={<Info className="h-5 w-5 text-muted-foreground" />}
                label="Batch Code"
                value={batch_code}
              />
            )}
            {batch_type && (
              <InfoItem
                icon={<Info className="h-5 w-5 text-muted-foreground" />}
                label="Batch Type"
                value={batch_type}
              />
            )}
            {chemical_group && (
              <InfoItem
                icon={<Info className="h-5 w-5 text-muted-foreground" />}
                label="Chemical Group"
                value={chemical_group}
              />
            )}
            {typeof total_volume === "number" && (
              <InfoItem
                icon={<Info className="h-5 w-5 text-muted-foreground" />}
                label="Total Volume"
                value={total_volume}
              />
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium text-foreground">
              Drum Inventory Status
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Drums in Stock:</span>
              <span className="font-semibold text-foreground">
                {drums_in_stock} / {drum_count}
              </span>
            </div>
            <Progress value={receivedPercentage} className="h-3" />
            {drum_count === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No drums associated with this batch line yet.
              </p>
            )}
          </div>

          {/* 
            Placeholder for individual drum listing. 
            To implement this, v_batches_with_drums would need to aggregate drum serials and statuses per batch_id,
            or we would need a separate query here based on batch_id to fetch related drums.
            Example if individual_drums were part of BatchData:
            {batchDetails.individual_drums && batchDetails.individual_drums.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">Individual Drums</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serial Number</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchDetails.individual_drums.map((drum) => (
                        <TableRow key={drum.pod_id}> // Assuming pod_id or similar unique key for drum
                          <TableCell className="font-mono">{drum.serial_number}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={drum.is_received ? 'default' : 'secondary'}>
                              {drum.is_received ? 'Received' : 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          */}
        </CardContent>
      </Card>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined | null;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  if (value === null || value === undefined || String(value).trim() === "")
    return null;
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 text-muted-foreground pt-1">{icon}</div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-md font-semibold text-foreground">{String(value)}</p>
      </div>
    </div>
  );
}
