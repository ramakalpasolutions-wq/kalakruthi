import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('📧 Received data:', body);

    // Check if it's a quotation request (has events field)
    const isQuotation = body.events !== undefined;

    if (isQuotation) {
      // ✅ QUOTATION REQUEST
      const { name, phone, startDate, endDate, notes, events = [] } = body;

      // Validate required fields for quotation
      if (!name || !phone || !startDate || !endDate) {
        return NextResponse.json(
          { success: false, message: 'Please fill all required fields' },
          { status: 400 }
        );
      }

      // Check email configuration
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('❌ Email credentials missing in .env.local');
        console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'MISSING');
        console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'SET' : 'MISSING');
        return NextResponse.json(
          { success: false, message: "Email configuration missing" },
          { status: 500 }
        );
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Verify connection
      try {
        await transporter.verify();
        console.log('✅ SMTP connection verified');
      } catch (verifyError) {
        console.error('❌ SMTP verification failed:', verifyError);
        return NextResponse.json(
          { success: false, message: `SMTP Error: ${verifyError.message}` },
          { status: 500 }
        );
      }

      // Format events HTML
      const eventsHtml = events
        .map(
          (event, i) => `
            <div style="margin: 15px 0; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #10b981;">
              <h4 style="margin: 0 0 10px 0; color: #10b981;">📸 Event ${i + 1}: ${event.name || "Not specified"}</h4>
              ${
                event.requirements?.length
                  ? `<p style="margin: 5px 0 8px 0; color: #374151; font-weight: 600;">Requirements:</p>
                     <ul style="margin: 0; padding-left: 20px; color: #1f2937;">
                       ${event.requirements.map((req) => `<li style="margin: 5px 0;">${req}</li>`).join("")}
                     </ul>`
                  : "<p style='margin: 0; color: #9ca3af; font-style: italic;'>No specific requirements selected</p>"
              }
            </div>
          `
        )
        .join("");

      // Send email
      const mailOptions = {
        from: `"Kalakruthi Photography Website" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `📩 New Quotation Request from ${name}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
            <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px; text-align: center;">
                  📩 New Quotation Request
                </h1>
              </div>
              
              <!-- Customer Details -->
              <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                  👤 Customer Information
                </h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #6b7280; font-weight: 600; width: 140px;">Name:</td>
                    <td style="padding: 10px 0; color: #1f2937; font-size: 16px;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Phone:</td>
                    <td style="padding: 10px 0;">
                      <a href="tel:+91${phone}" style="color: #10b981; text-decoration: none; font-weight: 600; font-size: 16px;">
                        +91 ${phone}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Event Dates:</td>
                    <td style="padding: 10px 0; color: #1f2937; font-size: 16px;">
                      <strong>${startDate}</strong> to <strong>${endDate}</strong>
                    </td>
                  </tr>
                </table>
              </div>
              
              ${notes ? `
                <div style="background: #fef3c7; border-left: 5px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                  <p style="margin: 0 0 10px 0; font-weight: bold; color: #92400e; font-size: 16px;">📝 Additional Notes:</p>
                  <p style="margin: 0; color: #78350f; line-height: 1.6; white-space: pre-wrap; font-size: 15px;">${notes}</p>
                </div>
              ` : ''}
              
              <!-- Event Details -->
              <div style="margin-top: 30px;">
                <h2 style="color: #374151; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                  📸 Event Requirements
                </h2>
                ${eventsHtml}
              </div>
              
              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  This quotation request was sent from your website
                </p>
                <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                  Please contact <strong style="color: #10b981;">${name}</strong> at 
                  <a href="tel:+91${phone}" style="color: #10b981; text-decoration: none;">+91 ${phone}</a> 
                  to discuss the quotation
                </p>
              </div>
              
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Quotation email sent successfully to:', process.env.EMAIL_USER);

      return NextResponse.json({ 
        success: true, 
        message: 'Quotation request sent successfully! We will contact you soon.' 
      });

    } else {
      // ✅ SIMPLE CONTACT FORM (if needed in future)
      const { name, email, phone, message } = body;

      if (!name || !email || !message) {
        return NextResponse.json(
          { success: false, message: 'Please fill all required fields' },
          { status: 400 }
        );
      }

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        return NextResponse.json(
          { success: false, message: "Email configuration missing" },
          { status: 500 }
        );
      }

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.verify();

      await transporter.sendMail({
        from: `"Kalakruthi Photography Website" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        replyTo: email,
        subject: `📧 New Contact Message from ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-left: 4px solid #10b981;">
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        `,
      });

      console.log('✅ Contact email sent successfully');

      return NextResponse.json({ 
        success: true, 
        message: 'Message sent successfully!' 
      });
    }

  } catch (error) {
    console.error("❌ Email sending error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: `Failed to send message: ${error.message}` 
      },
      { status: 500 }
    );
  }
}
