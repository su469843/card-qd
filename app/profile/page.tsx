'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Upload, User, Mail, Shield, AlertTriangle, Check } from 'lucide-react'
import { compressImage, formatFileSize, isValidImageSize } from '@/lib/image-compression'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState('')
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [devices, setDevices] = useState<any[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/profile')
      return
    }

    if (user) {
      fetchProfile()
      fetchDevices()
    }
  }, [user, authLoading, router])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/profile/update?userId=${user.id}`)
      const data = await response.json()

      if (data.user) {
        setEmail(data.user.email || '')
        setProfilePicture(data.user.profile_picture)
      }
    } catch (error) {
      console.error('[v0] Failed to fetch profile:', error)
    }
  }

  const fetchDevices = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/device/register?userId=${user.id}`)
      const data = await response.json()

      if (data.devices) {
        setDevices(data.devices)
      }
    } catch (error) {
      console.error('[v0] Failed to fetch devices:', error)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('[v0] File selected:', { name: file.name, size: file.size })

    if (!isValidImageSize(file.size)) {
      toast({
        title: 'File too large',
        description: 'Profile picture must be less than 10MB',
        variant: 'destructive',
      })
      return
    }

    setCompressing(true)

    try {
      // Compress image if needed
      const result = await compressImage(file)

      if (!result.success) {
        toast({
          title: 'Compression failed',
          description: result.error || 'Failed to process image',
          variant: 'destructive',
        })
        setCompressing(false)
        return
      }

      console.log('[v0] Image compressed:', {
        original: formatFileSize(result.originalSize),
        compressed: formatFileSize(result.compressedSize),
        ratio: result.compressionRatio.toFixed(2),
      })

      // Convert data URL to File
      if (result.dataUrl) {
        const response = await fetch(result.dataUrl)
        const blob = await response.blob()
        const compressedFile = new File([blob], file.name, { type: 'image/jpeg' })
        
        setSelectedFile(compressedFile)
        setPreviewUrl(result.dataUrl)

        toast({
          title: 'Image ready',
          description: `Compressed from ${formatFileSize(result.originalSize)} to ${formatFileSize(result.compressedSize)}`,
        })
      }
    } catch (error) {
      console.error('[v0] Image processing error:', error)
      toast({
        title: 'Processing failed',
        description: 'Failed to process image',
        variant: 'destructive',
      })
    }

    setCompressing(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('userId', user.id)
      
      if (email !== user.email) {
        formData.append('email', email)
      }

      if (selectedFile) {
        formData.append('profilePicture', selectedFile)
      }

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      console.log('[v0] Profile updated:', data)

      if (data.profilePicture) {
        setProfilePicture(data.profilePicture)
        setPreviewUrl(null)
        setSelectedFile(null)
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
    } catch (error) {
      console.error('[v0] Profile update error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

        <div className="grid gap-6">
          {/* Profile Picture Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Upload and manage your profile picture (max 10MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {previewUrl || profilePicture ? (
                    <img
                      src={previewUrl || profilePicture || ''}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-border"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                      <User className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={compressing}
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {compressing ? 'Compressing...' : 'Choose Image'}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max 10MB. Images will be automatically optimized.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Section */}
          <Card>
            <CardHeader>
              <CardTitle>Email Address</CardTitle>
              <CardDescription>Update your email address</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>

                <Button type="submit" disabled={loading || compressing}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Trusted Devices Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Trusted Devices
              </CardTitle>
              <CardDescription>Devices that have accessed your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {devices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No devices registered yet</p>
                ) : (
                  devices.map((device) => (
                    <div key={device.id} className="flex items-start justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium">{device.platform}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {device.user_agent}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last seen: {new Date(device.last_seen_at).toLocaleDateString()}
                        </p>
                      </div>
                      {device.is_trusted ? (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <Check className="w-4 h-4" />
                          Trusted
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-yellow-600 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          New
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
