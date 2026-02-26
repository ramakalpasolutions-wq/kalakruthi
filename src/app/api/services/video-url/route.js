import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'


export async function POST(request) {
  try {
    const { db } = await connectToDatabase()
    const { serviceId, url, category } = await request.json()

    console.log('📹 Adding video URL:', { serviceId, url, category })  // ✅ Add logging

    if (!serviceId || !url || !category) {
      return NextResponse.json({ 
        error: 'Service ID, URL, and category are required',
        received: { serviceId, url, category }  // ✅ Debug info
      }, { status: 400 })
    }

    if (!['photography', 'videography'].includes(category)) {
      return NextResponse.json({ 
        error: 'Invalid category. Must be photography or videography' 
      }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // ✅ CRITICAL: Add video URL AND set service type to category
    const result = await db.collection('services').updateOne(
      { _id: new ObjectId(serviceId) },
      { 
        $push: { 
          images: { 
            url: url,
            type: 'video-url',
            addedAt: new Date()
          } 
        },
        $set: { 
          type: category,  // ✅ MUST set type to 'videography' (or 'photography')
          updatedAt: new Date() 
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Video URL added successfully',
      updatedType: category  // ✅ Confirm type was set
    })
  } catch (error) {
    console.error('Video URL Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to add video URL' 
    }, { status: 500 })
  }
}
