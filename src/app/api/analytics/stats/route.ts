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

  // Gracefully handle if RLS blocks the read — return zeros rather than crash
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('action, created_at, user_name')
    .gte('created_at', new Date(new Date().getFullYear(), 0, 1).toISOString())

  const safeLogs = logs || []

  // 1. Individual counts per user
  const individualCounts: Record<string, { uploads: number, deletes: number, logins: number }> = {}
  
  // 2. Monthly counts
  const monthlyCounts: Record<string, { uploads: number, deletes: number }> = {}
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  months.forEach(m => monthlyCounts[m] = { uploads: 0, deletes: 0 })

  // All delete-type actions
  const DELETE_ACTIONS = ['delete', 'delete_resume', 'bulk_update']

  safeLogs.forEach(log => {
      const u = log.user_name || 'Unknown'
      if (!individualCounts[u]) individualCounts[u] = { uploads: 0, deletes: 0, logins: 0 }
      
      const date = new Date(log.created_at)
      const monthLabel = months[date.getMonth()]
      
      if (log.action === 'upload') {
          individualCounts[u].uploads++
          if (monthlyCounts[monthLabel]) monthlyCounts[monthLabel].uploads++
      } else if (DELETE_ACTIONS.includes(log.action)) {
          individualCounts[u].deletes++
          if (monthlyCounts[monthLabel]) monthlyCounts[monthLabel].deletes++
      } else if (log.action === 'login') {
          individualCounts[u].logins++
      }
  })

  return NextResponse.json({
    individual: Object.entries(individualCounts).map(([name, stats]) => ({ name, ...stats })),
    monthly: Object.entries(monthlyCounts).map(([month, stats]) => ({ month, ...stats })),
    totalUploads: safeLogs.filter(l => l.action === 'upload').length,
    totalDeletes: safeLogs.filter(l => DELETE_ACTIONS.includes(l.action)).length,
    totalLogins: safeLogs.filter(l => l.action === 'login').length
  })
}
