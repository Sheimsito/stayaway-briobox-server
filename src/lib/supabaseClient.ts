import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.js';
import config from '../config/config.js';

const url: string = config.databaseUrl;
const serviceRoleKey: string = config.serviceRoleKey;
if (!url || !serviceRoleKey) {
  throw new Error('Supabase URL or service role key is not set');
}
// This is the supabase client with typed Database, but allowing flexibility for dynamic tables
export const supabase: SupabaseClient<Database> = createClient<Database>(url, serviceRoleKey, {
  auth: { persistSession: false },
});



// This is the supabase client without strict types for the generic BaseDAO
export const supabaseGeneric: SupabaseClient = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});



