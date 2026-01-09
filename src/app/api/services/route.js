import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

// GET - Fetch all services
export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const services = await db
      .collection('services')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json(services)
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

// POST - Create new service
export async function POST(request) {
  try {
    const { db } = await connectToDatabase()
    const data = await request.json()
    
    const serviceData = {
      name: data.name,
      type: data.type || 'photography', // Default to photography
      images: data.images || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('services').insertOne(serviceData)
    
    return NextResponse.json({ 
      success: true, 
      service: { ...serviceData, _id: result.insertedId } 
    })
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create service' }, { status: 500 })
  }
}

// DELETE - Delete service or service image
export async function DELETE(request) {
  try {
    const { db } = await connectToDatabase()
    const data = await request.json()
    
    // Delete entire service
    if (data.id && !data.type) {
      const result = await db.collection('services').deleteOne({ 
        _id: new ObjectId(data.id) 
      })
      
      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, message: 'Service deleted successfully' })
    }
    
    // Delete service image
    if (data.type === 'image' && data.serviceId && data.imageId) {
      const result = await db.collection('services').updateOne(
        { _id: new ObjectId(data.serviceId) },
        { 
          $pull: { images: { publicId: data.imageId } },
          $set: { updatedAt: new Date() }
        }
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Service not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, message: 'Image deleted successfully' })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 })
  }
}
