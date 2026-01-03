import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { SparklesIcon, ShieldCheckIcon, ZapIcon, ArrowRightIcon } from 'lucide-react'
import { PublicHeader } from '../layout/public-header'

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      {...props}
    >
      <title>GitHub</title>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <PublicHeader 
        actions={
          <>
            <Link to="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/register">
              <Button>Sign up</Button>
            </Link>
          </>
        }
      />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center px-4 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
          
          <div className="container mx-auto max-w-4xl space-y-8">
            {/* <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
              v1.0 Public Preview
            </div> */}
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-foreground">
              Your Photos, <br />
              <span className="text-primary bg-clip-text">Organized by AI</span>
            </h1>
            {/* <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Rediscover your life's memories with intelligent tagging and semantic search.
            </p> */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/photos">
                <Button size="lg" className="h-12 px-8 text-lg gap-2">
                  Get Started <ArrowRightIcon className="w-4 h-4" />
                </Button>
              </Link>
              {/* <Link to="/photos">
                <Button size="lg" variant="outline" className="h-12 px-8 text-lg">  
                  View Demo Gallery
                </Button>
              </Link> */}
            </div>
            
            {/* Hero Image */}
            <div className="mt-16 rounded-xl border bg-muted/50 shadow-2xl overflow-hidden w-full max-w-5xl mx-auto relative group">
               <img 
                 src="/images/ui-light.png" 
                 alt="App Screenshot Light" 
                 className="w-full h-auto dark:hidden block"
               />
               <img 
                 src="/images/ui-dark.png" 
                 alt="App Screenshot Dark" 
                 className="w-full h-auto hidden dark:block"
               />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Everything you need</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Powerful features to help you manage, organize, and enjoy your photo collection.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <FeatureCard 
                icon={<SparklesIcon className="w-6 h-6 text-primary" />}
                title="AI Auto-Tagging"
                description="Automatically analyzes your photos to detect objects, scenes, and events. No more manual tagging required."
              />
              <FeatureCard 
                icon={<ShieldCheckIcon className="w-6 h-6 text-primary" />}
                title="Private & Secure"
                description="Your photos and data stay on your server. We don't train models on your personal memories."
              />
              <FeatureCard 
                icon={<ZapIcon className="w-6 h-6 text-primary" />}
                title="Blazing Fast"
                description="Built with Rust and React. Experience instant page loads and smooth scrolling, even with thousands of photos."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg">
            {/* <div className="bg-primary text-primary-foreground p-1 rounded">
              <CameraIcon className="w-4 h-4" />
            </div> */}
            Moments Aura
          </div>
          {/* <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Moments Aura. Open Source Project.
          </p> */}
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="https://github.com/cyrus28214/moments-aura" className="hover:text-foreground transition-colors flex items-center gap-2">
              <GithubIcon className="w-4 h-4" />
              GitHub
            </a>
            {/* <a href="#" className="hover:text-foreground transition-colors">Docs</a>
            <a href="#" className="hover:text-foreground transition-colors">License</a> */}
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-background p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow flex flex-col space-y-4">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}