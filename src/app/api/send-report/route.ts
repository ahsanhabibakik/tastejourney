export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import nodemailer from 'nodemailer';

// =============================================================================
// FONT SYSTEM MONKEY PATCH - MUST BE FIRST
// =============================================================================
// Prevent PDFKit from accessing filesystem for font files
const originalReadFileSync = fs.readFileSync;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(fs as any).readFileSync = function(filePath: any, options?: any) {
  if (typeof filePath === 'string' && filePath.includes('.afm')) {
    // Return minimal AFM data for any font to prevent ENOENT errors
    const afmData = `StartFontMetrics 4.1
FontName Times-Roman
FullName Times Roman
FamilyName Times
Weight Roman
ItalicAngle 0
IsFixedPitch false
CharacterSet ExtendedRoman
FontBBox -168 -218 1000 898
UnderlinePosition -100
UnderlineThickness 50
Version 003.000
EncodingScheme AdobeStandardEncoding
CapHeight 662
XHeight 450
Ascender 683
Descender -217
StdHW 28
StdVW 84
StartCharMetrics 315
C 32 ; WX 250 ; N space ; B 0 0 0 0 ;
C 33 ; WX 333 ; N exclam ; B 130 -9 238 676 ;
C 65 ; WX 722 ; N A ; B 15 0 706 674 ;
EndCharMetrics
EndFontMetrics`;
    
    // Return as Buffer or string based on options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (options && typeof options === 'object' && (options as { encoding?: any }).encoding === null) {
      return Buffer.from(afmData);
    }
    return afmData;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (originalReadFileSync as any).call(fs, filePath, options);
};

// Import PDFKit AFTER monkey patch
import PDFDocument from 'pdfkit';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================
interface Recommendation {
  destination: string;
  highlights?: string[];
  budget?: { range: string };
  bestMonths?: string[];
  engagement?: { potential: string };
  tags?: string[];
  image?: string;
  [key: string]: unknown;
}

interface UserProfile {
  budget?: string;
  duration?: string;
  style?: string;
  contentFocus?: string;
  climate?: string;
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
  keywords?: string[];
  images?: string[];
  videoLinks?: string[];
  language?: string;
  location?: string;
  brands?: string[];
  collaborations?: string[];
  regionBias?: string[];
  extractedAt?: string;
  scrapingMethods?: string[];
  fallbackUsed?: boolean;
}

interface ReportRequest {
  email: string;
  recommendations: Recommendation[];
  userProfile: UserProfile;
  websiteData: WebsiteData;
  userName?: string;
}

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

// =============================================================================
// EMAIL CONFIGURATION
// =============================================================================
const createEmailTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_PASS in .env.local');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
    pool: true, // Use connection pool
    maxConnections: 1,
    rateDelta: 20000, // Rate limiting
    rateLimit: 5,
    tls: {
      rejectUnauthorized: false
    }
  });
};

// =============================================================================
// PDF GENERATION UTILITIES
// =============================================================================
const createSafePDFDocument = (options: Record<string, unknown> = {}) => {
  const doc = new PDFDocument({
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    size: 'A4',
    bufferPages: true,
    autoFirstPage: true,
    ...options
  });

  // Use only built-in fonts to avoid filesystem issues
  doc.font('Times-Roman');
  
  return doc;
};

const generatePDFContent = (
  doc: InstanceType<typeof PDFDocument>, 
  data: {
    displayName: string;
    recommendations: Recommendation[];
    userProfile: UserProfile;
    websiteData: WebsiteData;
  }
) => {
  const { displayName, recommendations, userProfile, websiteData } = data;

  try {
    // =============================================================================
    // HEADER SECTION
    // =============================================================================
    doc.fontSize(28).text('TasteJourney', { align: 'center' });
    doc.fontSize(16).text('AI-Powered Travel Recommendations', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated on ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, { align: 'center' });
    doc.moveDown(2);

    // =============================================================================
    // PERSONALIZED GREETING
    // =============================================================================
    doc.fontSize(14).text(`Dear ${displayName},`, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(11).text(
      'Thank you for using TasteJourney! Based on your website analysis and travel preferences, ' +
      'we\'ve curated personalized destination recommendations optimized for content creation and monetization opportunities.',
      { align: 'justify', lineGap: 2 }
    );
    doc.moveDown(2);

    // =============================================================================
    // WEBSITE ANALYSIS SECTION
    // =============================================================================
    doc.fontSize(16).text('Website Analysis', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    
    const websiteInfo = [
      ['Website Title', websiteData.title || 'N/A'],
      ['URL', websiteData.url],
      ['Description', websiteData.description || 'N/A'],
      ['Content Type', websiteData.contentType],
      ['Main Themes', websiteData.themes.join(', ') || 'N/A'],
      ['Content Focus', websiteData.hints.join(', ') || 'N/A'],
      ['Social Presence', websiteData.socialLinks.map(s => s.platform).join(', ') || 'N/A']
    ];

    websiteInfo.forEach(([label, value]) => {
      doc.font('Times-Bold').text(`${label}: `, { continued: true });
      doc.font('Times-Roman').text(String(value).substring(0, 80) + (String(value).length > 80 ? '...' : ''));
    });
    doc.moveDown(2);

    // =============================================================================
    // USER PREFERENCES SECTION
    // =============================================================================
    doc.fontSize(16).text('Your Travel Preferences', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    Object.entries(userProfile).forEach(([key, value]) => {
      if (value) {
        const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        doc.font('Times-Bold').text(`${formattedKey}: `, { continued: true });
        doc.font('Times-Roman').text(String(value));
      }
    });
    doc.moveDown(2);

    // =============================================================================
    // RECOMMENDATIONS SECTION
    // =============================================================================
    doc.fontSize(16).text('Personalized Destination Recommendations', { underline: true });
    doc.moveDown(1);

    if (!recommendations || recommendations.length === 0) {
      doc.fontSize(11).text('No specific recommendations available at this time. Please try again with more detailed preferences.');
    } else {
      recommendations.forEach((rec, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
          doc.font('Times-Roman');
        }

        // Destination header
        doc.fontSize(14).font('Times-Bold').text(`${index + 1}. ${rec.destination}`, { underline: true });
        doc.moveDown(0.3);
        doc.font('Times-Roman');

        // Highlights
        if (rec.highlights && rec.highlights.length > 0) {
          doc.fontSize(10).font('Times-Bold').text('Key Highlights:', { continued: true });
          doc.font('Times-Roman').text(` ${rec.highlights.join(' • ')}`);
        }

        // Budget information
        if (rec.budget?.range) {
          doc.fontSize(10).font('Times-Bold').text('Budget Range: ', { continued: true });
          doc.font('Times-Roman').text(rec.budget.range);
        }

        // Best travel months
        if (rec.bestMonths && rec.bestMonths.length > 0) {
          doc.fontSize(10).font('Times-Bold').text('Best Travel Months: ', { continued: true });
          doc.font('Times-Roman').text(rec.bestMonths.join(', '));
        }

        // Engagement potential
        if (rec.engagement?.potential) {
          doc.fontSize(10).font('Times-Bold').text('Content Engagement Potential: ', { continued: true });
          doc.font('Times-Roman').text(rec.engagement.potential);
        }

        // Tags
        if (rec.tags && rec.tags.length > 0) {
          doc.fontSize(9).font('Times-Bold').text('Tags: ', { continued: true });
          doc.font('Times-Roman').text(rec.tags.join(' • '));
        }

        doc.moveDown(1.5);
      });
    }

    // =============================================================================
    // FOOTER SECTION
    // =============================================================================
    const footerY = doc.page.height - 80;
    doc.fontSize(8);
    doc.text('Generated by TasteJourney AI - Your Personalized Travel Companion', 50, footerY, { 
      align: 'center',
      width: doc.page.width - 100
    });
    doc.text(`Contact: ${process.env.GMAIL_USER} | Report ID: ${Date.now()}`, 50, footerY + 15, { 
      align: 'center',
      width: doc.page.width - 100
    });

  } catch (error) {
    console.error('Error generating PDF content:', error);
    // Fallback content
    doc.fontSize(12).text('Error generating detailed report. Please contact support.');
  }
};

// =============================================================================
// EMAIL TEMPLATE GENERATION
// =============================================================================
const generateEmailHTML = (displayName: string) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TasteJourney Travel Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">TasteJourney</h1>
      <p style="color: #e2e8f0; margin: 8px 0 0 0; font-size: 16px;">Your AI Travel Companion</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <!-- Greeting -->
      <div style="background-color: #f1f5f9; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #667eea;">
        <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 24px;">Hi ${displayName}! 👋</h2>
        <p style="color: #475569; margin: 0; line-height: 1.6; font-size: 16px;">
          Your personalized travel report is ready! We've analyzed your website and preferences to create 
          custom recommendations perfect for content creation and monetization opportunities.
        </p>
      </div>

      <!-- Report Features -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px;">📊 What's in your report:</h3>
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="padding: 15px; border-bottom: 1px solid #f1f5f9;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">🎯</span>
              <span style="color: #475569; font-size: 14px;">Detailed destination analysis based on your content style</span>
            </div>
          </div>
          <div style="padding: 15px; border-bottom: 1px solid #f1f5f9;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">💰</span>
              <span style="color: #475569; font-size: 14px;">Budget breakdowns and cost optimization strategies</span>
            </div>
          </div>
          <div style="padding: 15px; border-bottom: 1px solid #f1f5f9;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">📅</span>
              <span style="color: #475569; font-size: 14px;">Optimal travel timing for content creation</span>
            </div>
          </div>
          <div style="padding: 15px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">📈</span>
              <span style="color: #475569; font-size: 14px;">Engagement potential and monetization opportunities</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pro Tip -->
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; border-radius: 12px; margin-bottom: 30px;">
        <div style="display: flex; align-items: flex-start; gap: 15px;">
          <span style="font-size: 24px;">💡</span>
          <div>
            <h4 style="color: #ffffff; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Pro Tip</h4>
            <p style="color: #d1fae5; margin: 0; line-height: 1.5; font-size: 14px;">
              Each destination includes specific content themes and collaboration opportunities 
              to help maximize your travel ROI and audience engagement!
            </p>
          </div>
        </div>
      </div>

      <!-- Call to Action -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 2px dashed #cbd5e1;">
          <h4 style="color: #1e293b; margin: 0 0 10px 0; font-size: 18px;">📄 Your Report is Attached</h4>
          <p style="color: #64748b; margin: 0; font-size: 14px;">
            Download the PDF attachment to access your complete personalized travel analysis
          </p>
        </div>
      </div>

      <!-- Closing -->
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="color: #64748b; margin: 0; font-size: 16px; line-height: 1.5;">
          Happy travels and content creation!<br>
          <strong style="color: #667eea;">— The TasteJourney Team</strong>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; margin: 0; font-size: 12px; line-height: 1.5;">
        This report was generated on ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}<br>
        Need help? Contact us at <a href="mailto:${process.env.GMAIL_USER}" style="color: #667eea; text-decoration: none;">${process.env.GMAIL_USER}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

// =============================================================================
// MAIN API HANDLER
// =============================================================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // =============================================================================
    // REQUEST VALIDATION
    // =============================================================================
    let requestData: ReportRequest;
    
    try {
      requestData = await request.json();
    } catch (error) {
      console.error('Invalid JSON in request:', error);
      return NextResponse.json(
        { error: 'Invalid JSON format in request body' },
        { status: 400 }
      );
    }

    const { email, recommendations, userProfile, websiteData, userName } = requestData;

    // Validate required fields
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    if (!websiteData || typeof websiteData !== 'object') {
      return NextResponse.json(
        { error: 'Website data is required' },
        { status: 400 }
      );
    }

    // =============================================================================
    // DATA SANITIZATION
    // =============================================================================
    const safeRecommendations: Recommendation[] = Array.isArray(recommendations) 
      ? recommendations.filter(rec => rec && typeof rec === 'object' && rec.destination)
      : [];

    const safeUserProfile: UserProfile = userProfile || {};
    const safeWebsiteData: WebsiteData = {
      ...websiteData,
      url: websiteData.url || '',
      themes: Array.isArray(websiteData.themes) ? websiteData.themes : [],
      hints: Array.isArray(websiteData.hints) ? websiteData.hints : [],
      contentType: websiteData.contentType || 'Mixed Content',
      socialLinks: Array.isArray(websiteData.socialLinks) ? websiteData.socialLinks : [],
      title: websiteData.title || 'Website Analysis',
      description: websiteData.description || 'No description available'
    };

    const displayName = userName || email.split('@')[0] || 'Travel Enthusiast';

    // =============================================================================
    // PDF GENERATION
    // =============================================================================
    let pdfBuffer: Buffer;
    
    try {
      const doc = createSafePDFDocument();
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      
      // Generate PDF content
      generatePDFContent(doc, {
        displayName,
        recommendations: safeRecommendations,
        userProfile: safeUserProfile,
        websiteData: safeWebsiteData
      });

      doc.end();

      // Wait for PDF generation to complete
      pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          try {
            resolve(Buffer.concat(chunks));
          } catch (error) {
            reject(error);
          }
        });
        doc.on('error', reject);
        
        // Timeout after 30 seconds
        setTimeout(() => reject(new Error('PDF generation timeout')), 30000);
      });

      console.log(`PDF generated successfully: ${pdfBuffer.length} bytes`);

    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError);
      return NextResponse.json(
        { 
          error: 'Failed to generate PDF report',
          details: pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'
        },
        { status: 500 }
      );
    }

    // =============================================================================
    // EMAIL SENDING
    // =============================================================================
    try {
      const transporter = createEmailTransporter();
      
      const mailOptions: MailOptions = {
        from: `TasteJourney <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `🌟 Your Personalized TasteJourney Travel Report - ${displayName}`,
        html: generateEmailHTML(displayName),
        attachments: [
          {
            filename: `TasteJourney-Report-${displayName.replace(/[^a-zA-Z0-9]/g, '')}-${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      
      // Close the transporter
      transporter.close();

      console.log(`Email sent successfully to: ${email}`);

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: emailError instanceof Error ? emailError.message : 'Unknown email error'
        },
        { status: 500 }
      );
    }

    // =============================================================================
    // SUCCESS RESPONSE
    // =============================================================================
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'Travel report sent successfully!',
      data: {
        email,
        displayName,
        recommendationsCount: safeRecommendations.length,
        pdfSize: pdfBuffer.length,
        processingTime: `${processingTime}ms`
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    // =============================================================================
    // GLOBAL ERROR HANDLING
    // =============================================================================
    console.error('Unexpected error in send-report:', error);
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : 'Please contact support if this persists',
        processingTime: `${processingTime}ms`
      },
      { status: 500 }
    );
  }
}