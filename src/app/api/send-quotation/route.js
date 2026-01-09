// /app/api/send-quotation/route.js
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request) {
  try {
    console.log('📧 Email API called')

    const EMAIL_USER = process.env.EMAIL_USER
    const EMAIL_PASS = process.env.EMAIL_PASS

    console.log('📧 EMAIL_USER:', EMAIL_USER ? '✓ Loaded' : '❌ Missing')

    if (!EMAIL_USER || !EMAIL_PASS) {
      return NextResponse.json(
        { error: 'Email credentials not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const pdf = formData.get('pdf')
    const to = formData.get('to')
    const subject = formData.get('subject')
    const customerName = formData.get('customerName')

    if (!pdf || !to) {
      return NextResponse.json(
        { error: 'Missing email or PDF' },
        { status: 400 }
      )
    }

    // Check PDF size
    const buffer = await pdf.arrayBuffer()
    const sizeMB = buffer.byteLength / (1024 * 1024)
    console.log('📄 PDF size:', sizeMB.toFixed(2), 'MB')

    if (sizeMB > 20) {
      return NextResponse.json(
        { error: `PDF too large (${sizeMB.toFixed(2)}MB). Max 20MB for Gmail.` },
        { status: 400 }
      )
    }

    const attachmentBuffer = Buffer.from(buffer)

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    })

    const info = await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject: subject || 'Quotation from Kalakruthi Photography',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #10b981;">Hello ${customerName || 'Customer'},</h2>
          <p>Please find your quotation attached to this email.</p>
          <p style="margin-top: 20px;">Thank you for choosing <strong>Kalakruthi Photography</strong>!</p>
          <hr style="margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            Best regards,<br>
            <strong>Kalakruthi Photography</strong><br>
            Professional Photography & Videography Services
          </p>
        </div>
      `,
      attachments: [{
        filename: `quotation_${customerName || 'invoice'}.pdf`,
        content: attachmentBuffer,
        contentType: 'application/pdf',
      }],
    })

    console.log('✅ Email sent:', info.messageId)

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully!' 
    })

  } catch (error) {
    console.error('❌ Email error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
