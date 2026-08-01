import { NextResponse } from 'next/server';
import { loadContentCandidateById, updateContentCandidate } from '@/lib/content-curation/curate';
import { candidateActionSchema, candidateStatusSchema } from '@/lib/content-curation/types';
import { AdminAuthError, createSupabaseServerClient, requireAdminUser } from '@/lib/supabase/server';
import { z } from 'zod';

const patchSchema = z
  .object({
    status: candidateStatusSchema.optional(),
    action: candidateActionSchema.optional(),
  })
  .refine((v) => v.status !== undefined || v.action !== undefined, {
    message: 'No fields to update',
  });

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();
    const candidate = await loadContentCandidateById(supabase, id);
    if (!candidate) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ candidate });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const body = patchSchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const candidate = await updateContentCandidate(supabase, id, body);
    if (!candidate) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ candidate });
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
