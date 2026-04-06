import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('action, created_at, user_name')
    .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString()) // Current year

  if (!logs) return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })

  // 1. Individual counts
  const individualCounts: Record<string, { uploads: number, deletes: number, logins: number }> = {}
  
  // 2. Monthly counts (individual by action)
  const monthlyCounts: Record<string, { uploads: number, deletes: number }> = {}
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  months.forEach(m => monthlyCounts[m] = { uploads: 0, deletes: 0 })

  logs.forEach(log => {
      const u = log.user_name || 'Unknown'
      if (!individualCounts[u]) individualCounts[u] = { uploads: 0, deletes: 0, logins: 0 }
      
      const date = new Date(log.created_at)
      const monthLabel = months[date.getMonth()]
      
      if (log.action === 'upload') {
          individualCounts[u].uploads++
          if (monthlyCounts[monthLabel]) monthlyCounts[monthLabel].uploads++
      } else if (log.action === 'delete') {
          individualCounts[u].deletes++
          if (monthlyCounts[monthLabel]) monthlyCounts[monthLabel].deletes++
      } else if (log.action === 'login') {
          individualCounts[u].logins++
      }
  })

  return NextResponse.json({
    individual: Object.entries(individualCounts).map(([name, stats]) => ({ name, ...stats })),
    monthly: Object.entries(monthlyCounts).map(([month, stats]) => ({ month, ...stats })),
    totalUploads: logs.filter(l => l.action === 'upload').length,
    totalDeletes: logs.filter(l => l.action === 'delete').length,
    totalLogins: logs.filter(l => l.action === 'login').length
  })
}
