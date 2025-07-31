export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(): Promise<NextResponse> {
  try {
    // Check if credentials exist
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      return NextResponse.json({ 
        error: 'Gmail credentials not configured',
        details: 'Please set GMAIL_USER and GMAIL_PASS in .env.local'
      }, { status: 500 });
    }

    console.log('Creating email transporter...');
    
    // Create transporter with explicit SMTP settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('Verifying transporter...');
    
    // Verify transporter
    await transporter.verify();
    
    console.log('Sending test email...');

    // Send test email
    const info = await transporter.sendMail({
      from: `TasteJourney Test <${process.env.GMAIL_USER}>`,
      to: 'delwerhossain006@gmail.com',
      subject: '🧪 Test Email from TasteJourney API',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">TasteJourney Email Test</h1>
          <p>This is a test email to verify that Nodemailer is working correctly.</p>
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: #1d4ed8;">✅ Test Results:</h3>
            <ul>
              <li>Nodemailer import: Success</li>
              <li>Gmail authentication: Success</li>
              <li>Email sending: Success</li>
            </ul>
          </div>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>From:</strong> ${process.env.GMAIL_USER}</p>
          <p><strong>Node.js Version:</strong> ${process.version}</p>
        </div>
      `,
    });

    // Close transporter
    transporter.close();

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      data: {
        messageId: info.messageId,
        to: 'delwerhossain006@gmail.com',
        from: process.env.GMAIL_USER,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Email test failed:', error);
    
    return NextResponse.json({
      error: 'Email test failed',
      details: error instanceof Error ? error.message : String(error),
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint - use POST to send test email',
    config: {
      gmailConfigured: !!(process.env.GMAIL_USER && process.env.GMAIL_PASS),
      nodeVersion: process.version,
      runtime: 'nodejs'
    }
  });
}