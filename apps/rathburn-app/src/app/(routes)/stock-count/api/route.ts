import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Ensure environment variables are set
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  // Continue execution but log the error
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DrumData {
  oldId: string;
  material: string;
  batchCode: string;
  supplier: string;
  status: string;
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const drums: DrumData[] = await request.json();
    
    console.log(`Received ${drums.length} drums for processing`);

    // Basic validation
    if (!Array.isArray(drums) || drums.length === 0) {
      console.error('Invalid data format received');
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of drums.' },
        { status: 400 }
      );
    }

    // Validate each drum entry
    const invalidDrums = drums.filter(drum => !drum.oldId || !drum.material);
    if (invalidDrums.length > 0) {
      console.error(`Found ${invalidDrums.length} invalid drums missing ID or material`);
      return NextResponse.json(
        { error: 'All drums must have an ID and material type' },
        { status: 400 }
      );
    }

    // Add timestamps to each entry
    const timestamp = new Date().toISOString();
    const drumsWithTimestamp = drums.map(drum => ({
      ...drum,
      created_at: timestamp,
      updated_at: timestamp,
    }));

    console.log('Inserting drums into database...');
    
    // Insert data into Supabase
    const { data, error } = await supabase
      .from('drums')
      .insert(drumsWithTimestamp)
      .select();

    if (error) {
      console.error('Error inserting drums:', error);
      
      // More detailed error information for debugging
      if (error.code) {
        console.error(`Supabase error code: ${error.code}`);
      }
      
      return NextResponse.json(
        { error: 'Failed to save drums to database', details: error.message },
        { status: 500 }
      );
    }

    console.log(`Successfully saved ${drums.length} drums to database`);
    
    // Return success response
    return NextResponse.json({ 
      message: `Successfully saved ${drums.length} drums`,
      data 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
