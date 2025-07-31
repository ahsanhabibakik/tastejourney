export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Mock email service for testing when Gmail is not available
export async function POST(): Promise<NextResponse> {
  try {
    const mockEmailData = {
      timestamp: new Date().toISOString(),
      from: process.env.GMAIL_USER || 'test@tastejourney.com',
      to: 'delwerhossain006@gmail.com',
      subject: '🧪 Mock Test Email from TasteJourney API',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">TasteJourney Email Test (MOCK)</h1>
          <p>This is a mock test email to verify that the email system is working correctly.</p>
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: #1d4ed8;">✅ Mock Test Results:</h3>
            <ul>
              <li>Nodemailer import: Success</li>
              <li>PDF generation: Ready</li>
              <li>Email template: Generated</li>
              <li>Mock delivery: Success</li>
            </ul>
          </div>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>From:</strong> ${process.env.GMAIL_USER || 'test@tastejourney.com'}</p>
          <p><strong>Node.js Version:</strong> ${process.version}</p>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>Note:</strong> This is a mock email. To send real emails, configure Gmail app password in .env.local
            </p>
          </div>
        </div>
      `,
    };

    // Save mock email to file for verification
    const mockEmailsDir = path.join(process.cwd(), 'mock-emails');
    if (!fs.existsSync(mockEmailsDir)) {
      fs.mkdirSync(mockEmailsDir, { recursive: true });
    }

    const mockEmailFile = path.join(mockEmailsDir, `mock-email-${Date.now()}.json`);
    fs.writeFileSync(mockEmailFile, JSON.stringify(mockEmailData, null, 2));

    console.log('Mock email created:', mockEmailFile);

    return NextResponse.json({
      success: true,
      message: 'Mock email created successfully!',
      note: 'This is a mock email service. Real email requires Gmail app password configuration.',
      data: {
        mockFile: mockEmailFile,
        ...mockEmailData
      }
    });

  } catch (error) {
    console.error('Mock email test failed:', error);
    
    return NextResponse.json({
      error: 'Mock email test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  const mockEmailsDir = path.join(process.cwd(), 'mock-emails');
  let mockEmails: string[] = [];
  
  try {
    if (fs.existsSync(mockEmailsDir)) {
      mockEmails = fs.readdirSync(mockEmailsDir).filter(file => file.endsWith('.json'));
    }
  } catch (error) {
    console.error('Error reading mock emails:', error);
  }

  return NextResponse.json({
    message: 'Mock email test endpoint - use POST to create mock email',
    config: {
      gmailConfigured: !!(process.env.GMAIL_USER && process.env.GMAIL_PASS),
      mockEmailsCreated: mockEmails.length,
      mockFiles: mockEmails.slice(0, 5), // Show last 5
      nodeVersion: process.version,
      runtime: 'nodejs'
    },
    instructions: {
      createMock: 'POST /api/test-email-mock',
      realEmail: 'POST /api/test-email (requires Gmail setup)',
      setup: 'See GMAIL_SETUP.md for Gmail configuration'
    }
  });
}