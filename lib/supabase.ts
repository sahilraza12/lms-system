import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const hasValidSupabaseConfig = Boolean(
  supabaseUrl &&
    supabaseServiceKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('your-project')
);

// Server-side upload ke liye admin client
export const supabaseAdmin = hasValidSupabaseConfig
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your real Supabase project values.'
    );
  }

  return supabaseAdmin;
}