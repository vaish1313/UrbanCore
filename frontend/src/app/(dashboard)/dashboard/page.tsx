'use client'

import { useQuery } from '@tanstack/react-query'
import { projects } from '@/lib/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Building2, AlertTriangle, FileText, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projects.list(),
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const totalProjects = projectsData?.data?.total || 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your projects and detections
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={totalProjects.toString()}
          icon={<FileText className="h-4 w-4" />}
          description="Active analysis projects"
        />
        <StatCard
          title="Buildings Detected"
          value="1,234"
          icon={<Building2 className="h-4 w-4" />}
          description="+180 from last month"
          trend="+15%"
        />
        <StatCard
          title="Violations Found"
          value="87"
          icon={<AlertTriangle className="h-4 w-4" />}
          description="+12 from last month"
          trend="+14%"
        />
        <StatCard
          title="Reports Generated"
          value="23"
          icon={<TrendingUp className="h-4 w-4" />}
          description="+7 from last month"
          trend="+30%"
        />
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>
            Your most recently created projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectsData?.data?.projects?.slice(0, 5).map((project: any) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
              >
                <div>
                  <h4 className="font-semibold">{project.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {project.description || 'No description'}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {project.status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  description,
  trend,
}: {
  title: string
  value: string
  icon: React.ReactNode
  description: string
  trend?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
          {trend && (
            <span className="ml-2 text-green-600 font-medium">{trend}</span>
          )}
        </p>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
