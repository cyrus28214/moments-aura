
import { Outlet } from '@tanstack/react-router'
import { PublicHeader } from '../layout/public-header'

export function AuthLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <PublicHeader />
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md space-y-8">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
