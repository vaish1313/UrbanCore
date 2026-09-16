'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Map,
  Building2,
  AlertTriangle,
  Mountain,
  FileText,
  Mail,
  Settings,
  Bell,
  User,
  LogOut,
  Satellite,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Satellite className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">UrbanCore</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <NavLink href="/dashboard" icon={<LayoutDashboard />}>
            Dashboard
          </NavLink>
          <NavLink href="/dashboard/projects" icon={<Map />}>
            Projects
          </NavLink>
          <NavLink href="/dashboard/detection" icon={<Building2 />}>
            Detection
          </NavLink>
          <NavLink href="/dashboard/violations" icon={<AlertTriangle />}>
            Violations
          </NavLink>
          <NavLink href="/dashboard/terrain" icon={<Mountain />}>
            Terrain
          </NavLink>
          <NavLink href="/dashboard/reports" icon={<FileText />}>
            Reports
          </NavLink>
          <NavLink href="/dashboard/complaints" icon={<Mail />}>
            Complaints
          </NavLink>
          <NavLink href="/dashboard/settings" icon={<Settings />}>
            Settings
          </NavLink>
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <User className="h-4 w-4" />
                <span className="flex-1 text-left">Account</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className="w-full justify-start gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        {icon}
        {children}
      </Button>
    </Link>
  )
}
