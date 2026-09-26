import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerId = process.env.SUPABASE_OWNER_ID;

if (!url || !serviceRoleKey || !ownerId) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_OWNER_ID are required.');
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase
  .from('profiles')
  .upsert({ user_id: ownerId }, { onConflict: 'user_id' })
  .select('id,user_id')
  .single();

if (error) throw error;
console.log('Owner profile is ready:', data);
