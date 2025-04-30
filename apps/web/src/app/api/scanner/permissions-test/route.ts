import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Diagnostic endpoint to test Supabase permissions
 */
export async function GET(request: NextRequest) {
  console.log('API: Starting permissions test');
  try {
    // Create service client
    const supabase = createServiceClient();
    console.log('API: Service client created successfully');
    
    // Test list of schemas
    const { data: schemas, error: schemaError } = await supabase.rpc('list_schemas');
    console.log('API: Schemas result:', schemas || 'none', 'Error:', schemaError || 'none');
    
    // Test listing all tables in public schema
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public')
      .limit(10);
    
    console.log('API: Tables result:', tables || 'none', 'Error:', tablesError || 'none');

    // Try directly checking the logs schema
    const { data: logTables, error: logTablesError } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'logs')
      .limit(10);
    
    console.log('API: Logs schema tables:', logTables || 'none', 'Error:', logTablesError || 'none');
    
    // Try direct SQL query to test raw permissions
    const { data: sqlResult, error: sqlError } = await supabase.rpc('test_service_role_permissions');
    console.log('API: SQL test result:', sqlResult || 'none', 'Error:', sqlError || 'none');
    
    // Return the results
    return NextResponse.json({
      success: true,
      schemas: schemas || null,
      schemaError: schemaError || null,
      tables: tables || null, 
      tablesError: tablesError || null,
      logTables: logTables || null,
      logTablesError: logTablesError || null,
      sqlResult: sqlResult || null,
      sqlError: sqlError || null
    });
    
  } catch (error) {
    console.error('API: Error in permissions test:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
} 