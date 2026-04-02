import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  try {
    const { ids, updates } = await req.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('resumes')
      .update(updates)
      .in('id', ids)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, count: data?.length })
  } catch (err: any) {
    console.error('Bulk update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
