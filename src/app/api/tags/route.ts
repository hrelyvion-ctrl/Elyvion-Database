import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET() {
  try {
    const { data: tags, error } = await supabase.from('tags').select('*').order('name', { ascending: true })
    if (error) throw error
    return NextResponse.json(tags || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, color } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    
    // Ignore duplicates via upsert
    const { data: tag, error } = await supabase.from('tags').upsert(
      { name: name.trim(), color: color || '#6366f1' }, 
      { onConflict: 'name' }
    ).select().single()
    
    if (error) throw error
    return NextResponse.json(tag)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const { error } = await supabase.from('tags').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
