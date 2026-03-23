import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.app_metadata?.role !== 'admin') {
    return null;
  }
  return user;
}

export async function GET() {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to load settings' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      delayed_responses_enabled,
      min_response_time,
      max_response_time,
    } = body;

    if (typeof delayed_responses_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'delayed_responses_enabled must be a boolean' },
        { status: 400 }
      );
    }

    if (
      typeof min_response_time !== 'number' ||
      min_response_time < 1 ||
      !Number.isInteger(min_response_time)
    ) {
      return NextResponse.json(
        { error: 'min_response_time must be a positive integer' },
        { status: 400 }
      );
    }

    if (
      typeof max_response_time !== 'number' ||
      max_response_time < min_response_time ||
      !Number.isInteger(max_response_time)
    ) {
      return NextResponse.json(
        { error: 'max_response_time must be >= min_response_time' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('app_settings')
      .update({
        delayed_responses_enabled,
        min_response_time,
        max_response_time,
        updated_at: new Date().toISOString(),
      })
      .eq('singleton', true)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
