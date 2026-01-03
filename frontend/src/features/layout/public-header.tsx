import { Link } from '@tanstack/react-router'
import { ThemeToggle } from '../theme/theme-toggle'

interface PublicHeaderProps {
    actions?: React.ReactNode
}

export function PublicHeader({ actions }: PublicHeaderProps) {
    return (
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
                    <span>Moments Aura</span>
                </Link>
                <nav className="flex items-center gap-4">
                    <ThemeToggle />
                    {actions}
                </nav>
            </div>
        </header>
    )
}
