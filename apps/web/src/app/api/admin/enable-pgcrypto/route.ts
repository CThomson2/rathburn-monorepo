import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createNewClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/api/utils/logger';

const logger = createLogger('api/admin/enable-pgcrypto');

/**
 * Admin-only endpoint to enable the pgcrypto extension
 * This should only be called by authorized administrators
 */
export async function POST(request: NextRequest) {
  logger.info('Received request to enable pgcrypto extension');

  try {
    // Get the admin authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Create a Supabase client with the token
    const supabase = createNewClient();
    
    // Verify the user and check if they are an administrator
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData.user) {
      logger.warn(`Invalid authentication token: ${authError?.message || 'No user data'}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
    
    // Check if user has admin role (you'd need to implement your own role check)
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .single();
    
    const isAdmin = userRoles?.role === 'admin';
    
    if (rolesError || !isAdmin) {
      logger.warn(`User does not have admin privileges: ${userData.user.id}`);
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin privileges required' },
        { status: 403 }
      );
    }
    
    // Execute the SQL to enable the pgcrypto extension
    logger.info('Enabling pgcrypto extension');
    const { error: enableError } = await supabase.rpc('admin_enable_pgcrypto');
    
    if (enableError) {
      logger.error(`Failed to enable pgcrypto extension: ${enableError.message}`);
      return NextResponse.json(
        { success: false, error: `Failed to enable pgcrypto: ${enableError.message}` },
        { status: 500 }
      );
    }
    
    logger.info('Successfully enabled pgcrypto extension');
    return NextResponse.json({ 
      success: true, 
      message: 'pgcrypto extension has been enabled successfully' 
    });
    
  } catch (error) {
    logger.error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 