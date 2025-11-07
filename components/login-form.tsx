'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/protected')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'flex max-h-screen w-full items-center justify-center bg-background',
        className
      )}
      {...props}
    >
      <Card className="w-full max-w-md overflow-hidden border border-border shadow-2xl rounded-4xl bg-card">
        {/* UMass Campus Image */}
        <Image
          src="/images/umass-campus.jpg"
          alt="UMass Amherst Campus"
          width={800}
          height={300}
          priority
          className="h-48 w-full object-cover"
        />

        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-foreground">
            Welcome back to Minuteman Tickets
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Log in to access the Minuteman Tickets marketplace
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">UMass Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@umass.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto text-sm text-primary hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                {isLoading ? 'Logging in...' : 'Log In'}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/sign-up" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
