import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    // If no folders exist, return the defaults
    if (!data || data.length === 0) {
        return NextResponse.json(['Uncategorized','AI','Software Engineer','Sales','Marketing','Design'])
    }

    return NextResponse.json(data.map(f => f.name))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const { data, error } = await supabase
      .from('folders')
      .insert({ name })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
