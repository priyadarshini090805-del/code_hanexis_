import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/session'
import DashboardShell from '@/components/DashboardShell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()
  if (!user) redirect('/login')
  return <DashboardShell user={user}>{children}</DashboardShell>
}
