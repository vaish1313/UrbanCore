import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Satellite, 
  Map, 
  AlertTriangle, 
  FileText, 
  BarChart3,
  Shield,
  Zap,
  Globe
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Satellite className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">UrbanCore</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          AI-Powered Geospatial Platform
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Detect newly constructed buildings from satellite imagery and automatically identify zoning violations using advanced AI and GIS technology.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              <Zap className="h-5 w-5" />
              Start Free Trial
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="gap-2">
              <Globe className="h-5 w-5" />
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Satellite className="h-10 w-10" />}
            title="Satellite Imagery"
            description="Automatic download of Sentinel-2 imagery from 2021-2025 with cloud filtering"
          />
          <FeatureCard
            icon={<Map className="h-10 w-10" />}
            title="AI Detection"
            description="U-Net deep learning model for accurate building segmentation and change detection"
          />
          <FeatureCard
            icon={<AlertTriangle className="h-10 w-10" />}
            title="Violation Checking"
            description="Automated detection of zoning violations, buffer zones, and protected areas"
          />
          <FeatureCard
            icon={<FileText className="h-10 w-10" />}
            title="Reports & Complaints"
            description="AI-generated professional reports and official complaint letters"
          />
          <FeatureCard
            icon={<BarChart3 className="h-10 w-10" />}
            title="Terrain Analysis"
            description="SRTM DEM analysis for elevation, slope, and land suitability scoring"
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10" />}
            title="Role-Based Access"
            description="Admin, government officer, and builder roles with permission control"
          />
          <FeatureCard
            icon={<Globe className="h-10 w-10" />}
            title="Interactive Maps"
            description="Draw polygons, upload GeoJSON/Shapefiles, search locations"
          />
          <FeatureCard
            icon={<Zap className="h-10 w-10" />}
            title="Real-Time Processing"
            description="Background task queue with progress tracking and notifications"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join government officers and urban planners using UrbanCore for smart city management
          </p>
          <Link href="/register">
            <Button size="lg">Create Account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 UrbanCore. All rights reserved.</p>
          <p className="mt-2">Built for sustainable urban development</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
