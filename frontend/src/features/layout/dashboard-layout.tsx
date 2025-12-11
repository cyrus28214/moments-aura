import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks';
import { ImagesProvider } from '@/features/photos/image-context';
import { createContext, useContext, useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { get_server_info } from '@/api';

import { useTheme } from '@/features/theme/hooks';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MonitorIcon, MoonIcon, SunIcon, HeartIcon, Trash2Icon, LogOutIcon, ImageIcon } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from "@/components/ui/sheet"

interface DashboardContextType {
    sidebarOpen: boolean;
    setSidebarOpen: (sidebarOpen: boolean) => void;
    features: string[];
    isMobile: boolean;
    toggleMobileSidebar: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboardContext() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error("useDashboardContext must be used within a DashboardLayout");
    }
    return context;
}

export function DashboardLayout() {
    const { token, logout, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !token) {
            navigate({ to: '/login' });
        }
    }, [token, isLoading, navigate]);

    if (!token) return null;

    return (
        <ImagesProvider token={token}>
            <DashboardLayoutContent onLogout={logout} />
            <Toaster position="top-center" />
        </ImagesProvider>
    )
}

function ThemeToggler() {
    const { setTheme } = useTheme();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-secondary/50 hover:text-foreground justify-start"
                >
                    <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    Theme
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    <SunIcon className="mr-2 h-4 w-4" />
                    <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <MoonIcon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    <MonitorIcon className="mr-2 h-4 w-4" />
                    <span>System</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function SidebarContent({ onLogout, onNavClick }: { onLogout: () => void, onNavClick?: () => void }) {
    const location = useLocation();
    const navItems = [
        { href: '/photos', icon: <ImageIcon className="w-5 h-5" />, label: 'Photos' },
        { href: '/favorites', icon: <HeartIcon className="w-5 h-5" />, label: 'Favorites' },
        { href: '/trash', icon: <Trash2Icon className="w-5 h-5" />, label: 'Trash' },
    ].map(nav => ({ ...nav, isActive: location.pathname.startsWith(nav.href) }));

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Sidebar Header */}
                <div className="px-2 py-2 flex items-center justify-between">
                    <h1 className="text-xl font-bold truncate">
                        <span className="text-foreground">Moments</span>
                        <span className="text-foreground/70 ml-1">Aura</span>
                    </h1>
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => {
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={onNavClick}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    item.isActive
                                        ? "bg-secondary text-secondary-foreground"
                                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="border-t pt-4 flex flex-col gap-2">
                    <ThemeToggler />
                    <Button
                        variant="ghost"
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-destructive/10 hover:text-destructive justify-start"
                        onClick={onLogout}
                    >
                        <LogOutIcon className="w-5 h-5" />
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
}

function DashboardLayoutContent({ onLogout }: { onLogout: () => void }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [features, setFeatures] = useState<string[]>([]);
    const [mobileOpen, setMobileOpen] = useState(false);
    // Simple check for mobile, can be improved with window resize listener or useMediaQuery
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        get_server_info().then(info => setFeatures(info.features)).catch(console.error);
    }, []);

    const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);

    return (
        <div className="flex h-screen bg-background">
            {/* Desktop Sidebar */}
            <div className={cn(
                "hidden md:block transition-all duration-300 ease-in-out relative z-20 bg-background h-full text-nowrap overflow-hidden border-r",
                sidebarOpen ? "w-64" : "w-0 border-none"
            )}>
                <div className="w-64 p-4 h-full">
                    <SidebarContent onLogout={onLogout} />
                </div>
            </div>

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="p-4 w-64">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SidebarContent onLogout={onLogout} onNavClick={() => setMobileOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex-1 overflow-y-scroll">
                <DashboardContext.Provider value={{ sidebarOpen, setSidebarOpen, features, isMobile, toggleMobileSidebar }}>
                    <Outlet />
                </DashboardContext.Provider>
            </div>
        </div>
    );
}
