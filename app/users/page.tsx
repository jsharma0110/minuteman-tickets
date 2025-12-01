'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type TicketEvent = {
  id: string
  title?: string | null
  name?: string | null
  location?: string | null
  date?: string | null
}

type TicketItem = {
  id: string
  section?: string | null
  row?: string | null
  seat?: string | null
  price?: number | string | null
  events?: TicketEvent[] | null
}

export default function UsersPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPath, setAvatarPath] = useState<string | null>(null) // 👈 stored path in bucket
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()

      const { data, error } = await supabase.auth.getUser()

      if (error || !data?.user) {
        router.push('/auth/login')
        return
      }

      const user = data.user
      setUserId(user.id)

      const email = user.email ?? ''
      const namePart = email.split('@')[0] || email
      setDisplayName(namePart)

      // Load profile avatar
      const { data: profileData } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      if (profileData?.avatar_url) {
        setAvatarPath(profileData.avatar_url)
        const {
          data: { publicUrl },
        } = supabase.storage
          .from('avatars')
          .getPublicUrl(profileData.avatar_url)
        setAvatarUrl(publicUrl)
      }

      // Load this user's tickets (no join for now)
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, section, row, seat, price, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (ticketsError) {
        console.warn('Error loading tickets:', ticketsError)
        setError('Failed to load your tickets.')
        setTickets([])
      } else if (ticketsData) {
        setTickets((ticketsData ?? []) as TicketItem[])
      }

      setIsLoading(false)
    }

    load()
  }, [router])

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    try {
      setUploading(true)
      setError(null)
      const supabase = createClient()

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        console.error(uploadError)
        setError(uploadError.message)
        return
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: userId,
            avatar_url: filePath,
          },
          { onConflict: 'id' }
        )

      if (upsertError) {
        console.error(upsertError)
        setError(upsertError.message)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      setAvatarPath(filePath)
    } catch (err) {
      console.error(err)
      setError('Error uploading avatar.')
    } finally {
      setUploading(false)
    }
  }

  // 🔥 NEW: delete/remove profile picture
  const handleDeleteAvatar = async () => {
    if (!userId) return

    try {
      setError(null)
      const supabase = createClient()

      // Delete from storage if we know the path
      if (avatarPath) {
        const { error: storageError } = await supabase.storage
          .from('avatars')
          .remove([avatarPath])

        if (storageError) {
          console.warn('Error deleting avatar file:', storageError)
          // Not fatal – we still clear DB + UI
        }
      }

      // Clear avatar_url in profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (profileError) {
        console.error(profileError)
        setError(profileError.message)
        return
      }

      setAvatarUrl(null)
      setAvatarPath(null)
    } catch (err) {
      console.error(err)
      setError('Error deleting avatar.')
    }
  }

  const handleDeleteTicket = async (ticketId: string | number) => {
    if (!userId) return
    const supabase = createClient()

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId)
      .eq('user_id', userId)

    if (error) {
      console.error(error)
      setError('Failed to remove ticket.')
      return
    }

    setTickets((prev) => prev.filter((t) => t.id !== ticketId))
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading your profile…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-background py-10 px-4">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Your Profile
          </h1>
          <Button
            variant="outline"
            className="border-none bg-secondary text-xs text-foreground shadow-md hover:bg-secondary/80"
            onClick={() => router.push('/events')}
          >
            Back to Events
          </Button>
        </header>

        <main className="space-y-6 px-6 py-6">
          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Account card */}
          <Card className="border border-border bg-secondary/30 text-foreground">
            <CardHeader>
              <h2 className="text-lg font-semibold">Account</h2>
              <p className="text-sm text-muted-foreground">
                Manage your display info and profile picture.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full bg-muted">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Profile avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      No photo
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Display name
                  </p>
                  <p className="text-xl font-semibold">{displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    (Derived from your @umass.edu email)
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <label className="text-xs font-medium text-muted-foreground">
                  Update profile picture
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                  className="cursor-pointer bg-background text-xs file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                />
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/60 bg-transparent text-xs text-red-500 hover:bg-red-500/10 hover:text-red-300"
                    onClick={handleDeleteAvatar}
                    disabled={!avatarUrl || uploading}
                  >
                    Remove photo
                  </Button>
                </div>
                {uploading && (
                  <p className="text-xs text-muted-foreground">
                    Uploading…
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tickets card */}
          <Card className="border border-border bg-secondary/30 text-foreground">
            <CardHeader>
              <h2 className="text-lg font-semibold">Your Listed Tickets</h2>
              <p className="text-sm text-muted-foreground">
                View and remove tickets you&apos;ve listed for different
                events.
              </p>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have any active ticket listings yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => {
                    const evArray = ticket.events ?? []
                    const ev = evArray[0]

                    const title =
                      ev?.title || ev?.name || 'Ticket listing'
                    const location = ev?.location || ''
                    const date = ev?.date || ''

                    const priceNumber =
                      ticket.price != null
                        ? Number(ticket.price)
                        : null

                    return (
                      <div
                        key={ticket.id}
                        className="flex flex-col gap-2 rounded-md border border-border bg-card/60 p-3 text-sm md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-semibold">{title}</p>
                          <p className="text-xs text-muted-foreground">
                            {location}
                            {location && date ? ' • ' : ''}
                            {date}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Section {ticket.section ?? '-'} • Row{' '}
                            {ticket.row ?? '-'} • Seat{' '}
                            {ticket.seat ?? '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 md:text-right">
                          <div className="text-sm font-semibold">
                            {priceNumber != null
                              ? `$${priceNumber.toFixed(2)}`
                              : '—'}
                          </div>
                          <Button
                            variant="outline"
                            className="border-red-500/60 bg-transparent text-xs text-red-500 hover:bg-red-500/10 hover:text-red-300"
                            onClick={() =>
                              handleDeleteTicket(ticket.id)
                            }
                          >
                            Remove listing
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
