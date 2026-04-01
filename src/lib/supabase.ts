import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Used for admin operations that bypass RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Used for operations with RLS if needed
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
