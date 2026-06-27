'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, Megaphone, Workflow, PenLine, CalendarClock,
  MessagesSquare, Link2, BarChart3, ShieldCheck, Settings, LogOut, Menu, CheckSquare, BrainCircuit,
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
  const [open, setOpen] = useState(false)
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/')) || (href === '/dashboard' && pathname === '/dashboard')
  const initials = `${(user.firstName || user.email)[0] || 'H'}`.toUpperCase()

  async function logout() {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }) } catch {}
    signOut({ callbackUrl: '/login' })
  }

  const NavLink = ({ href, label, icon: Icon }: any) => {
    const active = isActive(href)
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={`
          group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium
          transition-all duration-200
          ${active
            ? 'text-[#6D1E2A] bg-[#6D1E2A]/[0.06]'
            : 'text-[#6B6560] hover:text-[#242424] hover:bg-[#F8F5F2]'
          }
        `}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#6D1E2A]" />
        )}
        <Icon size={17} strokeWidth={active ? 2 : 1.5} />
        {label}
      </Link>
    )
  }

  const SidebarContent = (
    <aside className="flex h-full w-[260px] flex-col" style={{ background: '#FFFFFF', borderRight: '1px solid #E7DED5' }}>
      {/* Brand */}
      <div className="px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: '#6D1E2A' }}>
            H
          </div>
          <div>
            <span className="text-[15px] font-bold tracking-tight" style={{ color: '#242424' }}>Hanexis</span>
            <span className="block text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: '#C5B9AC' }}>Sales Intelligence</span>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-4 hx-divider" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
        {NAV.map((i) => <NavLink key={i.href} {...i} />)}
        {rank(user.role) >= 3 && (
          <>
            <div className="px-3 pt-5 pb-2 text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: '#C5B9AC' }}>
              Admin
            </div>
            {ADMIN_NAV.map((i) => <NavLink key={i.href} {...i} />)}
          </>
        )}
      </nav>

      {/* Settings at bottom */}
      <div className="px-3 pb-2">
        <NavLink href="/dashboard/settings" label="Settings" icon={Settings} />
      </div>

      {/* User */}
      <div className="mx-4 hx-divider" />
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2.5">
          <div
            className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6D1E2A, #8B2F3D)' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium" style={{ color: '#242424' }}>
              {user.firstName || user.email}
            </div>
            <div className="truncate text-[11px]" style={{ color: '#C5B9AC' }}>
              {user.role}
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="rounded-md p-1.5 transition-colors hover:bg-[#F8F5F2]"
            style={{ color: '#C5B9AC' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen" style={{ background: '#F8F5F2' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{SidebarContent}</div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full animate-fade-in-down shadow-xl">
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header
          className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6"
          style={{ background: 'rgba(255,253,249,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E7DED5' }}
        >
          <button
            className="lg:hidden rounded-lg p-2 hover:bg-[#F8F5F2] transition-colors"
            onClick={() => setOpen(true)}
          >
            <Menu size={18} style={{ color: '#242424' }} />
          </button>
          <div className="flex-1" />
          <NotificationBell />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
