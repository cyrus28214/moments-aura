import { useRef, useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModeToggle } from '../theme/mode-toggle'
import { register } from '@/api'
import { useAuth } from './hooks'
import { X, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { refreshAuth } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (name === '') {
      nameInputRef.current?.focus()
      setError('Name is required')
      return
    }
    if (email === '') {
      emailInputRef.current?.focus()
      setError('Email is required')
      return
    }
    if (password === '') {
      passwordInputRef.current?.focus()
      setError('Password is required')
      return
    }
    if (confirmPassword === '') {
      confirmPasswordInputRef.current?.focus()
      setError('Confirm password is required')
      return
    }
    if (password !== confirmPassword) {
      confirmPasswordInputRef.current?.focus()
      setError('Passwords do not match')
      return
    }


    setLoading(true)

    try {
      const result = await register({ name, email, password })
      await refreshAuth(result.token)
      setError(null)
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      console.error(err)
      const errorData = err.response?.data
      if (errorData?.details) {
        const details = errorData.details;
        if (typeof details?.name?.[0]?.message === 'string') {
          nameInputRef.current?.focus()
          setError(details.name[0].message)
          return
        } else if (typeof details?.email?.[0]?.message === 'string') {
          emailInputRef.current?.focus()
          setError(details.email[0].message)
          return
        } else if (typeof details?.password?.[0]?.message === 'string') {
          passwordInputRef.current?.focus()
          setError(details.password[0].message)
          return
        } else {
          setError('Invalid form, please check your inputs')
        }
      } else {
        setError(errorData?.message || errorData || 'Register failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Register</h1>
          <p className="text-muted-foreground mt-2">Create a new account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Username</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              minLength={6}
              maxLength={256}
              ref={nameInputRef}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              maxLength={256}
              placeholder="your@email.com"
              ref={emailInputRef}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
              maxLength={256}
              ref={passwordInputRef}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              ref={confirmPasswordInputRef}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md relative whitespace-pre-wrap flex items-center gap-2">
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="shrink-0 hover:opacity-70 transition-opacity"
                aria-label="Close error"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : 'Register'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

