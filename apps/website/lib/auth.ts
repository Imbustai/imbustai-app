import { createClient } from '@/lib/supabase/server';

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getProfileForUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', userId)
    .single();
  return data;
}

export async function isCurrentUserAdmin() {
  const user = await getSessionUser();
  if (!user) return false;
  const profile = await getProfileForUser(user.id);
  return profile?.role === 'admin';
}
