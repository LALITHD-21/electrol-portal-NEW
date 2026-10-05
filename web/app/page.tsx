import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let hasUser = false;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasUser = !!user;
  } catch {
    hasUser = false;
  }

  if (hasUser) {
    redirect('/search');
  } else {
    redirect('/login');
  }
}
