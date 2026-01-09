import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// POST - Upload image to service
export async function POST(request, { params }) {
  try {
    const { serviceId } = await params;
    console.log('📤 Uploading image for service:', serviceId);

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    console.log('☁️ Uploading to Cloudinary...');
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: `kalakruthi-services/${serviceId}`,
      resource_type: 'image',
    });

    console.log('✅ Cloudinary upload successful:', uploadResponse.public_id);

    // Create image document
    const imageDoc = {
      _id: uploadResponse.public_id,
      publicId: uploadResponse.public_id,
      url: uploadResponse.url,
      secureUrl: uploadResponse.secure_url,
      format: uploadResponse.format,
      width: uploadResponse.width,
      height: uploadResponse.height,
      createdAt: new Date(),
    };

    // Add image to service in MongoDB
    const client = await clientPromise;
    const db = client.db('kalakruthi');

    const result = await db.collection('services').updateOne(
      { _id: new ObjectId(serviceId) },
      { $push: { images: imageDoc } }
    );

    if (result.modifiedCount === 0) {
      // If service doesn't exist, delete the uploaded image from Cloudinary
      await cloudinary.uploader.destroy(uploadResponse.public_id);
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    console.log('✅ Image added to service');

    return NextResponse.json({
      success: true,
      image: imageDoc
    });
  } catch (error) {
    console.error('❌ Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
