import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { put } from '@vercel/blob'
import { compressImage, needsCompression, queueImageOptimization } from '@/lib/image-compression'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const userId = formData.get('userId') as string
    const email = formData.get('email') as string
    const profilePicture = formData.get('profilePicture') as File | null

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    console.log('[v0] Profile update request:', { userId, email, hasImage: !!profilePicture })

    // Update email if provided
    if (email) {
      // Check if email is already taken
      const existing = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${userId}
      `

      if (existing.length > 0) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }

      await sql`
        UPDATE users SET email = ${email}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
      `
    }

    // Handle profile picture upload
    if (profilePicture) {
      const fileSize = profilePicture.size

      if (fileSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Image size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
          { status: 400 }
        )
      }

      try {
        // Upload to Vercel Blob
        const blob = await put(`profile-pictures/${userId}-${Date.now()}.jpg`, profilePicture, {
          access: 'public',
        })

        console.log('[v0] Profile picture uploaded:', { url: blob.url, size: fileSize })

        // Update user profile
        await sql`
          UPDATE users 
          SET 
            profile_picture = ${blob.url},
            profile_picture_size = ${fileSize},
            profile_picture_updated_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId}
        `

        // Queue for optimization if needed
        if (needsCompression(fileSize)) {
          await queueImageOptimization(sql, userId, blob.url, fileSize)
          console.log('[v0] Image queued for optimization')
        }

        return NextResponse.json({
          success: true,
          message: 'Profile updated successfully',
          profilePicture: blob.url,
        })
      } catch (error) {
        console.error('[v0] Profile picture upload error:', error)
        return NextResponse.json(
          { error: 'Failed to upload profile picture' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('[v0] Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const users = await sql`
      SELECT id, email, profile_picture, profile_picture_size, 
             profile_picture_updated_at, created_at, last_login_at
      FROM users
      WHERE id = ${userId}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error('[v0] Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
