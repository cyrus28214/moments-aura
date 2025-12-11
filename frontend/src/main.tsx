import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import './styles.css'
import reportWebVitals from './reportWebVitals.ts'

import HomePage from './features/home/home-page.tsx'
import PhotosPage from './features/photos/photos-page.tsx'
import LoginPage from './features/auth/login-page.tsx'
import RegisterPage from './features/auth/register-page.tsx'
import { AuthProvider } from './features/auth/hooks.tsx'
import { ThemeProvider } from './features/theme/hooks.tsx'
import { DashboardLayout } from './features/layout/dashboard-layout.tsx'
import { AuthLayout } from './features/auth/auth-layout.tsx'
import FavoritesPage from './features/favorites/favorites-page.tsx'
import TrashPage from './features/trash/trash-page.tsx'

const rootRoute = createRootRoute({
  component: () => (
    <>
      {/* <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        <Link to="/playground" className="[&.active]:font-bold">
          Playground
        </Link>
      </div>
      <hr /> */}
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'dashboard-layout',
  component: DashboardLayout,
})

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth-layout',
  component: AuthLayout,
})

const photosRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/photos',
  component: PhotosPage,
})


const favoritesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/favorites',
  component: FavoritesPage,
})

const trashRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: '/trash',
  component: TrashPage,
})

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/register',
  component: RegisterPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  authLayoutRoute.addChildren([
    loginRoute,
    registerRoute,
  ]),
  dashboardLayoutRoute.addChildren([
    photosRoute,
    favoritesRoute,
    trashRoute,
  ]),
])

const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
