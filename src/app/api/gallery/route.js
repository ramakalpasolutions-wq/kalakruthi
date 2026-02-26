import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET all gallery media
export async function GET() {
  try {
    console.log('📡 GET /api/gallery called');
    const client = await clientPromise;
    const db = client.db('kalakruthi');
    const media = await db.collection('gallery').find({}).toArray();
    
    // Transform to match expected format
    const transformedMedia = media.map(item => ({
      ...item,
      publicId: item.public_id || item.publicId,
      secureUrl: item.secure_url || item.secureUrl,
    }));
    
    console.log('✅ Gallery media found:', transformedMedia.length);
    return NextResponse.json({ media: transformedMedia });
  } catch (error) {
    console.error('❌ GET Gallery Error:', error);
    return NextResponse.json({ error: error.message, media: [] }, { status: 500 });
  }
}

// POST new media with Cloudinary upload
export async function POST(request) {
  try {
    console.log('📤 Starting upload...');
    
    // Check Cloudinary config
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary credentials missing!');
      return NextResponse.json({ 
        error: 'Cloudinary configuration missing. Check .env.local file.' 
      }, { status: 500 });
    }

    const formData = await request.formData();
    const files = formData.getAll('media');
    
    console.log(`📁 Files received: ${files.length}`);
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('kalakruthi');
    const uploadedMedia = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`⬆️ Uploading file ${i + 1}/${files.length}: ${file.name}`);
      
      try {
        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataURI = `data:${file.type};base64,${base64}`;

        // Upload to Cloudinary
        console.log('☁️ Uploading to Cloudinary...');
        const uploadResponse = await cloudinary.uploader.upload(dataURI, {
          folder: 'kalakruthi-gallery',
          resource_type: 'auto',
        });

        console.log('✅ Cloudinary upload successful:', uploadResponse.public_id);

        // Save to MongoDB
        const mediaDoc = {
          public_id: uploadResponse.public_id,
          publicId: uploadResponse.public_id, // Add camelCase version
          secure_url: uploadResponse.secure_url,
          secureUrl: uploadResponse.secure_url, // Add camelCase version
          url: uploadResponse.url,
          type: uploadResponse.resource_type,
          format: uploadResponse.format,
          width: uploadResponse.width,
          height: uploadResponse.height,
          created_at: new Date(),
        };

        const result = await db.collection('gallery').insertOne(mediaDoc);
        console.log('✅ Saved to MongoDB:', result.insertedId);
        
        uploadedMedia.push(mediaDoc);
      } catch (fileError) {
        console.error(`❌ Error uploading file ${i + 1}:`, fileError);
        return NextResponse.json({ 
          error: `Failed to upload ${file.name}: ${fileError.message}` 
        }, { status: 500 });
      }
    }

    console.log(`🎉 All uploads complete: ${uploadedMedia.length} files`);
    
    return NextResponse.json({ 
      success: true, 
      message: `${uploadedMedia.length} file(s) uploaded`,
      media: uploadedMedia 
    });
  } catch (error) {
    console.error('❌ POST Gallery Error:', error);
    return NextResponse.json({ 
      error: `Upload failed: ${error.message}` 
    }, { status: 500 });
  }
}

// DELETE media from Cloudinary and MongoDB
export async function DELETE(request) {
  try {
    const body = await request.json();
    const public_id = body.publicId || body.public_id; // Handle both formats
    
    console.log('🗑️ DELETE request body:', body);
    console.log('🗑️ Deleting public_id:', public_id);
    
    if (!public_id) {
      return NextResponse.json({ error: 'publicId or public_id required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('kalakruthi');

    // Find the media first to get resource type
    const media = await db.collection('gallery').findOne({ 
      $or: [{ public_id }, { publicId: public_id }]
    });

    console.log('📦 Found media in DB:', media);

    if (!media) {
      console.warn('⚠️ Media not found in database');
    }

    // Delete from Cloudinary
    console.log('☁️ Deleting from Cloudinary...');
    const resourceType = media?.type || 'image';
    
    const cloudinaryResult = await cloudinary.uploader.destroy(public_id, {
      resource_type: resourceType,
      invalidate: true,
    });
    
    console.log('✅ Cloudinary delete result:', cloudinaryResult);

    // Delete from MongoDB
    console.log('🗄️ Deleting from MongoDB...');
    const deleteResult = await db.collection('gallery').deleteOne({ 
      $or: [{ public_id }, { publicId: public_id }]
    });
    
    console.log('✅ MongoDB delete result:', deleteResult);

    return NextResponse.json({ 
      success: true, 
      message: 'Media deleted successfully',
      cloudinaryResult: cloudinaryResult.result,
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('❌ DELETE Gallery Error:', error);
    return NextResponse.json({ 
      error: `Delete failed: ${error.message}` 
    }, { status: 500 });
  }
}
