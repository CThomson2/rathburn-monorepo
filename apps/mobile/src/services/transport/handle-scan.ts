import { ScanAction } from "@/types/scan";
import { getSupabaseToken } from "@/lib/supabase/auth";

async function scanBarcode(barcode: string, jobId: number, action: ScanAction) {
    const token = await getSupabaseToken(); // Get the user's JWT token
  
  const response = await fetch('https://rathburn.app/api/logs/drum-scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include', // Important for cookies if needed
    body: JSON.stringify({
      barcode,
      jobId,
      action,
      deviceId: 'mobile-device-id' // Optional, can be detected server-side
    })
  });
  
  return response.json();
}

export { scanBarcode };

/**
 * create table logs.drum_scan (
 *  scan_id bigserial not null,
 *  scanned_at timestamp with time zone not null default now(),
 *  user_id uuid not null,
 *  device_id uuid not null,
 *  raw_barcode text not null,
 *  detected_drum uuid null,
 *  action_type inventory.action_type not null default 'barcode_scan'::inventory.action_type,
 *  status text not null,
 *  error_code text null,
 *  metadata jsonb not null default '{}'::jsonb,
 *  constraint drum_scan_pkey primary key (scan_id),
 *  constraint drum_scan_detected_drum_fkey foreign KEY (detected_drum) references inventory.drums (drum_id),
 *  constraint drum_scan_device_id_fkey foreign KEY (device_id) references logs.devices (device_id) on delete RESTRICT,
 *  constraint drum_scan_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete RESTRICT,
 *  constraint chk_status check (
 *    (
 *      status = any (array['success'::text, 'error'::text])
 *    )
 *  )
 *) TABLESPACE pg_default;

create trigger trg_apply_context
after INSERT on logs.drum_scan for EACH row
execute FUNCTION logs.fn_apply_context_to_drum ();

create trigger trg_detected_drum BEFORE INSERT on logs.drum_scan for EACH row
execute FUNCTION logs.set_detected_drum ();

create trigger trg_update_location
after INSERT on logs.drum_scan for EACH row
execute FUNCTION logs.update_drum_location ();
 */