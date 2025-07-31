export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
// import nodemailer from 'nodemailer'; // commented out for fallback

interface Recommendation {
  destination: string;
  highlights?: string[];
  budget?: { range: string };
  bestMonths?: string[];
  engagement?: { potential: string };
  tags?: string[];
  [key: string]: unknown;
}

interface UserProfile {
  [key: string]: unknown;
}

interface WebsiteData {
  url: string;
  themes: string[];
  hints: string[];
  contentType: string;
  socialLinks: { platform: string; url: string }[];
  title: string;
  description: string;
}

interface ReportRequest {
  email: string;
  recommendations: Recommendation[];
  userProfile: UserProfile;
  websiteData: WebsiteData;
  userName?: string;
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { email, recommendations, userProfile, websiteData, userName }: ReportRequest =
      await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json({ error: 'SendGrid API key not configured' }, { status: 500 });
    }

    // Defensive: ensure recommendations is always an array
    const safeRecommendations: Recommendation[] = Array.isArray(recommendations)
      ? recommendations
      : recommendations
      ? [recommendations]
      : [];

    // Create PDF document with better layout
    const doc = new PDFDocument({ 
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      size: 'A4'
    });
    
    // Try to load local Roboto font, fallback to default if not found
    const fontPath = path.join(process.cwd(), 'src', 'fonts', 'Roboto-Regular.ttf');
    if (fs.existsSync(fontPath)) {
      const fontBuffer = fs.readFileSync(fontPath);
      doc.registerFont('Roboto', fontBuffer);
      doc.font('Roboto');
    }

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    // Build the PDF with enhanced content
    const displayName = userName || email.split('@')[0];
    
    // Header
    doc.fontSize(24).fillColor('#2563eb').text('TasteJourney', { align: 'center' });
    doc.fontSize(18).fillColor('#1e40af').text('Personalized Travel Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#6b7280').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // User Info
    doc.fontSize(16).fillColor('#111827').text(`Dear ${displayName},`, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#374151').text('Based on your website analysis and preferences, we\'ve curated these personalized travel recommendations for content creation and monetization.');
    doc.moveDown(2);

    // Website Analysis Section
    doc.fontSize(16).fillColor('#1f2937').text('📊 Website Analysis', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#374151');
    doc.text(`🏠 Website: ${websiteData.title || 'N/A'}`);
    doc.text(`🔗 URL: ${websiteData.url}`);
    doc.text(`📝 Description: ${websiteData.description || 'N/A'}`);
    doc.text(`🎨 Content Themes: ${websiteData.themes.join(', ')}`);
    doc.text(`💡 Content Hints: ${websiteData.hints.join(', ')}`);
    doc.moveDown(2);

    // User Preferences Section
    doc.fontSize(16).fillColor('#1f2937').text('👤 Your Travel Preferences', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#374151');
    Object.entries(userProfile).forEach(([key, value]) => {
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      doc.text(`• ${formattedKey}: ${String(value)}`);
    });
    doc.moveDown(2);

    // Recommendations Section
    doc.fontSize(16).fillColor('#1f2937').text('🌟 Your Personalized Recommendations', { underline: true });
    doc.moveDown(1);

    if (safeRecommendations.length === 0) {
      doc.fontSize(12).fillColor('#ef4444').text('No recommendations available at this time.');
    } else {
      safeRecommendations.forEach((rec: Recommendation, i: number) => {
        // Check if we need a new page
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(14).fillColor('#1e40af').text(`${i + 1}. ${rec.destination}`, { underline: true });
        doc.moveDown(0.3);

        // Highlights
        if (rec.highlights && rec.highlights.length > 0) {
          doc.fontSize(11).fillColor('#059669').text('✨ Highlights:');
          rec.highlights.forEach(highlight => {
            doc.fontSize(10).fillColor('#374151').text(`   • ${highlight}`);
          });
          doc.moveDown(0.3);
        }

        // Budget
        if (rec.budget?.range) {
          doc.fontSize(11).fillColor('#dc2626').text(`💰 Budget Range: ${rec.budget.range}`);
        }

        // Best months
        if (rec.bestMonths && rec.bestMonths.length > 0) {
          doc.fontSize(11).fillColor('#7c2d12').text(`📅 Best Months: ${rec.bestMonths.join(', ')}`);
        }

        // Engagement potential
        if (rec.engagement?.potential) {
          doc.fontSize(11).fillColor('#7c3aed').text(`📈 Engagement Potential: ${rec.engagement.potential}`);
        }

        // Tags
        if (rec.tags && rec.tags.length > 0) {
          doc.fontSize(10).fillColor('#6b7280').text(`🏷️ Tags: ${rec.tags.join(' • ')}`);
        }

        doc.moveDown(1.5);
      });
    }

    // Footer
    doc.fontSize(10).fillColor('#9ca3af');
    doc.text('Generated by TasteJourney AI - Your personalized travel companion', 50, doc.page.height - 100, { align: 'center' });
    doc.text('Visit us at your-website.com for more travel inspiration', 50, doc.page.height - 85, { align: 'center' });

    doc.end();

    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });


    // Send email via SendGrid
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'syedmirhabib@gmail.com', // must be a verified sender in SendGrid
      subject: '🌟 Your Personalized TasteJourney Travel Report',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">TasteJourney</h1>
            <p style="color: #6b7280; margin: 5px 0;">Your AI Travel Companion</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Hi ${displayName}! 👋</h2>
            <p style="color: #374151; line-height: 1.6;">
              Your personalized travel report is ready! We've analyzed your website and preferences to create 
              custom recommendations perfect for content creation and monetization opportunities.
            </p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #1f2937;">📄 What's in your report:</h3>
            <ul style="color: #374151; line-height: 1.6;">
              <li>Detailed destination analysis based on your content style</li>
              <li>Budget breakdowns and best travel times</li>
              <li>Content creation opportunities and engagement potential</li>
              <li>Personalized recommendations tailored to your preferences</li>
            </ul>
          </div>

          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
            <p style="margin: 0; color: #065f46;">
              <strong>💡 Pro Tip:</strong> Each destination includes specific content themes and 
              collaboration opportunities to help maximize your travel investment!
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280;">
              Happy travels and content creation!<br>
              <strong style="color: #2563eb;">— The TasteJourney Team</strong>
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This report was generated on ${new Date().toLocaleDateString()} • 
              Need help? Contact us at support@tastejourney.com
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: `TasteJourney-Travel-Report-${new Date().toISOString().split('T')[0]}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    };

    await sgMail.send(msg);

    // --- Nodemailer fallback (commented out) ---
    /*
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_PASS!,
      },
    });
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your TasteJourney Travel Report',
      html: `
        <p>Hi there,</p>
        <p>Attached is your personalized travel report from TasteJourney. Enjoy planning!</p>
        <p>— The TasteJourney Team</p>
      `,
      attachments: [
        {
          filename: 'travel-report.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    */

    return NextResponse.json({
      success: true,
      message: 'Report sent successfully!',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in send-report:', err);
    return NextResponse.json(
      { error: 'Failed to send report', details: String(err) },
      { status: 500 }
    );
  }
}
