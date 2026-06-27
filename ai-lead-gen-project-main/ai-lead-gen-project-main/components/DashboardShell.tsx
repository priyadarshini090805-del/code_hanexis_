'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, Megaphone, Workflow, PenLine, CalendarClock,
  MessagesSquare, Link2, BarChart3, ShieldCheck, Settings, LogOut, Menu, X, CheckSquare, BrainCircuit,
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

type User = { id: string; email: string; role: string; firstName?: string; lastName?: string }

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/dashboard/workflows', label: 'Workflows', icon: Workflow },
  { href: '/dashboard/ai', label: 'AI Generator', icon: BrainCircuit },
  { href: '/dashboard/ai/approvals', label: 'Approvals', icon: CheckSquare },
  { href: '/dashboard/content', label: 'Content', icon: PenLine },
  { href: '/dashboard/scheduler', label: 'Scheduler', icon: CalendarClock },
  { href: '/dashboard/conversations', label: 'Conversations', icon: MessagesSquare },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Link2 },
]
const ADMIN_NAV = [
  { href: '/dashboard/audit', label: 'Audit Logs', icon: ShieldCheck },
]

function rank(role: string) { return ({ USER: 0, SALES: 1, MANAGER: 2, ADMIN: 3, SUPER_ADMIN: 4 } as any)[role] ?? 0 }

export default function DashboardShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/')) || (href === '/dashboard' && pathname === '/dashboard')
  const initials = `${(user.firstName || user.email)[0] || 'U'}`.toUpperCase()

  async function logout() {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }) } catch {}
    signOut({ callbackUrl: '/login' })
  }

  const NavLink = ({ href, label, icon: Icon }: any) => (
    <Link href={href} onClick={() => setOpen(false)}
      className={`hx-nav-item ${isActive(href) ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}>
      {isActive(href) && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r bg-white" />}
      <Icon size={18} strokeWidth={2} /> {label}
    </Link>
  )

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col bg-[#0a0a0a] text-white">
      <div className="px-6 py-6">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">HaneXes</Link>
        <p className="text-[11px] uppercase tracking-widest text-neutral-500 mt-1">AI Sales Intelligence</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
        {NAV.map((i) => <NavLink key={i.href} {...i} />)}
        {rank(user.role) >= 3 && (
          <>
            <div className="px-3.5 pt-5 pb-2 text-[11px] uppercase tracking-widest text-neutral-600">Admin</div>
            {ADMIN_NAV.map((i) => <NavLink key={i.href} {...i} />)}
          </>
        )}
        <NavLink href="/dashboard/settings" label="Settings" icon={Settings} />
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-black text-sm font-bold">{initials}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user.firstName || user.email}</div>
            <div className="truncate text-xs text-neutral-500">{user.role}</div>
          </div>
          <button onClick={logout} title="Sign out" className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-neutral-50">
      <div className="hidden lg:block">{Sidebar}</div>
      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full animate-fade-in-down">{Sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-white/80 px-4 backdrop-blur lg:px-8">
          <button className="lg:hidden rounded-lg p-2 hover:bg-neutral-100" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="flex-1" />
          <NotificationBell />
        </header>
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
