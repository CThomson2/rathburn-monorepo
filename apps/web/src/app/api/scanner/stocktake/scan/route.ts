// app/api/stocktake/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { broadcastScanEvent } from "@/lib/events/sse";

export async function POST(request: NextRequest) {
  try {
    const { materialCode, drumId, deviceId, userId } = await request.json();
    
    const supabase = createClient();
    
    // Get material info
    const { data: material, error: materialError } = await supabase
      .from('inventory.materials')
      .select('*')
      .eq('code', materialCode)
      .single();
    
    if (materialError || !material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    // Record the scan
        const scanEvent = {
        id: crypto.randomUUID(),
      materialId: material.id,
      materialCode,
      materialName: material.name,
      drumId,
      scannedAt: new Date().toISOString(),
      deviceId,
      userId
    };
    
    // Save to database
    const { error: scanError } = await supabase
      .from('stocktake_scans')
      .insert(scanEvent);
    
    if (scanError) {
      return NextResponse.json({ error: 'Failed to record scan' }, { status: 500 });
    }
    
    // Broadcast the scan event
    await broadcastScanEvent(scanEvent);
    
    return NextResponse.json({ success: true, scanEvent });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
