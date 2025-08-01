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

// Import PDFKit AFTER monkey patch - DISABLED FOR FASTER DEPLOYMENT
// import PDFDocument from 'pdfkit';

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
  attachments?: Array<{
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
// PDF GENERATION UTILITIES - DISABLED FOR FASTER DEPLOYMENT
// =============================================================================
// const createSafePDFDocument = (options: Record<string, unknown> = {}) => {
//   const doc = new PDFDocument({
//     margins: { top: 50, bottom: 50, left: 50, right: 50 },
//     size: 'A4',
//     bufferPages: true,
//     autoFirstPage: true,
//     ...options
//   });
//
//   // Use only built-in fonts to avoid filesystem issues
//   doc.font('Times-Roman');
//   
//   return doc;
// };
//
// const generatePDFContent = (
//   doc: InstanceType<typeof PDFDocument>, 
//   data: {
//     displayName: string;
//     recommendations: Recommendation[];
//     userProfile: UserProfile;
//     websiteData: WebsiteData;
//   }
// ) => {
//   const { displayName, recommendations, userProfile, websiteData } = data;
//
//   try {
//     // =============================================================================
//     // HEADER SECTION
//     // =============================================================================
//     doc.fontSize(28).text('TasteJourney', { align: 'center' });
//     doc.fontSize(16).text('AI-Powered Travel Recommendations', { align: 'center' });
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`Generated on ${new Date().toLocaleDateString('en-US', { 
//       weekday: 'long', 
//       year: 'numeric', 
//       month: 'long', 
//       day: 'numeric' 
//     })}`, { align: 'center' });
//     doc.moveDown(2);
//
//     // =============================================================================
//     // PERSONALIZED GREETING
//     // =============================================================================
//     doc.fontSize(14).text(`Dear ${displayName},`, { align: 'left' });
//     doc.moveDown(0.5);
//     doc.fontSize(11).text(
//       'Thank you for using TasteJourney! Based on your website analysis and travel preferences, ' +
//       'we\'ve curated personalized destination recommendations optimized for content creation and monetization opportunities.',
//       { align: 'justify', lineGap: 2 }
//     );
//     doc.moveDown(2);
//
//     // =============================================================================
//     // WEBSITE ANALYSIS SECTION
//     // =============================================================================
//     doc.fontSize(16).text('Website Analysis', { underline: true });
//     doc.moveDown(0.5);
//     doc.fontSize(10);
//     
//     const websiteInfo = [
//       ['Website Title', websiteData.title || 'N/A'],
//       ['URL', websiteData.url],
//       ['Description', websiteData.description || 'N/A'],
//       ['Content Type', websiteData.contentType],
//       ['Main Themes', websiteData.themes.join(', ') || 'N/A'],
//       ['Content Focus', websiteData.hints.join(', ') || 'N/A'],
//       ['Social Presence', websiteData.socialLinks.map(s => s.platform).join(', ') || 'N/A']
//     ];
//
//     websiteInfo.forEach(([label, value]) => {
//       doc.font('Times-Bold').text(`${label}: `, { continued: true });
//       doc.font('Times-Roman').text(String(value).substring(0, 80) + (String(value).length > 80 ? '...' : ''));
//     });
//     doc.moveDown(2);
//
//     // =============================================================================
//     // USER PREFERENCES SECTION
//     // =============================================================================
//     doc.fontSize(16).text('Your Travel Preferences', { underline: true });
//     doc.moveDown(0.5);
//     doc.fontSize(10);
//
//     Object.entries(userProfile).forEach(([key, value]) => {
//       if (value) {
//         const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
//         doc.font('Times-Bold').text(`${formattedKey}: `, { continued: true });
//         doc.font('Times-Roman').text(String(value));
//       }
//     });
//     doc.moveDown(2);
//
//     // =============================================================================
//     // RECOMMENDATIONS SECTION
//     // =============================================================================
//     doc.fontSize(16).text('Personalized Destination Recommendations', { underline: true });
//     doc.moveDown(1);
//
//     if (!recommendations || recommendations.length === 0) {
//       doc.fontSize(11).text('No specific recommendations available at this time. Please try again with more detailed preferences.');
//     } else {
//       recommendations.forEach((rec, index) => {
//         // Check if we need a new page
//         if (doc.y > 700) {
//           doc.addPage();
//           doc.font('Times-Roman');
//         }
//
//         // Destination header
//         doc.fontSize(14).font('Times-Bold').text(`${index + 1}. ${rec.destination}`, { underline: true });
//         doc.moveDown(0.3);
//         doc.font('Times-Roman');
//
//         // Highlights
//         if (rec.highlights && rec.highlights.length > 0) {
//           doc.fontSize(10).font('Times-Bold').text('Key Highlights:', { continued: true });
//           doc.font('Times-Roman').text(` ${rec.highlights.join(' • ')}`);
//         }
//
//         // Budget information
//         if (rec.budget?.range) {
//           doc.fontSize(10).font('Times-Bold').text('Budget Range: ', { continued: true });
//           doc.font('Times-Roman').text(rec.budget.range);
//         }
//
//         // Best travel months
//         if (rec.bestMonths && rec.bestMonths.length > 0) {
//           doc.fontSize(10).font('Times-Bold').text('Best Travel Months: ', { continued: true });
//           doc.font('Times-Roman').text(rec.bestMonths.join(', '));
//         }
//
//         // Engagement potential
//         if (rec.engagement?.potential) {
//           doc.fontSize(10).font('Times-Bold').text('Content Engagement Potential: ', { continued: true });
//           doc.font('Times-Roman').text(rec.engagement.potential);
//         }
//
//         // Tags
//         if (rec.tags && rec.tags.length > 0) {
//           doc.fontSize(9).font('Times-Bold').text('Tags: ', { continued: true });
//           doc.font('Times-Roman').text(rec.tags.join(' • '));
//         }
//
//         doc.moveDown(1.5);
//       });
//     }
//
//     // =============================================================================
//     // FOOTER SECTION
//     // =============================================================================
//     const footerY = doc.page.height - 80;
//     doc.fontSize(8);
//     doc.text('Generated by TasteJourney AI - Your Personalized Travel Companion', 50, footerY, { 
//       align: 'center',
//       width: doc.page.width - 100
//     });
//     doc.text(`Contact: ${process.env.GMAIL_USER} | Report ID: ${Date.now()}`, 50, footerY + 15, { 
//       align: 'center',
//       width: doc.page.width - 100
//     });
//
//   } catch (error) {
//     console.error('Error generating PDF content:', error);
//     // Fallback content
//     doc.fontSize(12).text('Error generating detailed report. Please contact support.');
//   }
// };

// =============================================================================
// EMAIL TEMPLATE GENERATION
// =============================================================================
const generateEmailHTML = (displayName: string, data: {
  recommendations: Recommendation[];
  userProfile: UserProfile;
  websiteData: WebsiteData;
}) => {
  const { recommendations, userProfile, websiteData } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TasteJourney Travel Report - ${displayName}</title>
  <style>
    @media (max-width: 600px) {
      .mobile-stack { display: block !important; width: 100% !important; }
      .mobile-padding { padding: 15px !important; }
      .mobile-text { font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); line-height: 1.6;">
  <div style="max-width: 680px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);">
    <!-- Enhanced Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+Cjwvc3ZnPgo='); opacity: 0.3;"></div>
      <div style="position: relative; z-index: 1;">
        <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🌟 TasteJourney</h1>
        <p style="color: #e2e8f0; margin: 12px 0 0 0; font-size: 18px; font-weight: 500;">Your Personalized AI Travel Companion</p>
        <div style="margin-top: 20px; padding: 12px 24px; background: rgba(255, 255, 255, 0.2); border-radius: 50px; display: inline-block; backdrop-filter: blur(10px);">
          <span style="color: #ffffff; font-size: 14px; font-weight: 600;">✨ Custom Report Generated</span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div style="padding: 50px 35px;">
      <!-- Personal Greeting with User Data -->
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 35px; border-radius: 20px; margin-bottom: 40px; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 50%; opacity: 0.1;"></div>
        <div style="position: relative; z-index: 1;">
          <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 28px; font-weight: 700;">Hi ${displayName}! 👋</h2>
          <p style="color: #475569; margin: 0 0 20px 0; line-height: 1.7; font-size: 18px;">
            Your personalized travel report is ready! We've analyzed <strong>${websiteData.title || 'your website'}</strong> and your preferences to create 
            custom recommendations perfect for content creation and monetization opportunities.
          </p>
          ${websiteData.url ? `<div style="margin-top: 20px; padding: 15px; background: rgba(102, 126, 234, 0.1); border-radius: 12px; border-left: 4px solid #667eea;">
            <p style="margin: 0; color: #475569; font-size: 14px;">📊 <strong>Analyzed Website:</strong> <a href="${websiteData.url}" style="color: #667eea; text-decoration: none;">${websiteData.url}</a></p>
          </div>` : ''}
        </div>
      </div>

      <!-- User Profile Summary -->
      ${Object.keys(userProfile).length > 0 ? `
      <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 30px; border-radius: 16px; margin-bottom: 35px; border: 1px solid #fbbf24;">
        <h3 style="color: #92400e; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px;">🎯 Your Travel Profile</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
          ${Object.entries(userProfile).filter(([, value]) => value).map(([key, value]) => {
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
            const emoji = {
              budget: '💰',
              duration: '🗓️',
              style: '🌍',
              contentFocus: '📸',
              climate: '☀️'
            }[key] || '✨';
            return `<div style="background: rgba(255, 255, 255, 0.8); padding: 12px 16px; border-radius: 10px; border-left: 3px solid #f59e0b;">
              <span style="color: #92400e; font-weight: 600; font-size: 14px;">${emoji} ${formattedKey}:</span>
              <span style="color: #451a03; margin-left: 8px; font-size: 14px;">${Array.isArray(value) ? value.join(', ') : value}</span>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}

      <!-- Detailed Recommendations Section -->
      ${recommendations.length > 0 ? `
      <div style="margin-bottom: 40px;">
        <h3 style="color: #1e293b; margin: 0 0 25px 0; font-size: 24px; font-weight: 700; text-align: center;">🌍 Your Personalized Destinations</h3>
        <p style="color: #64748b; text-align: center; margin-bottom: 30px; font-size: 16px;">We found <strong>${recommendations.length}</strong> perfect matches for your travel style and content goals</p>
        
        <div style="display: grid; gap: 25px;">
          ${recommendations.map((rec, index) => `
          <div style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border: 1px solid #e2e8f0; border-radius: 20px; padding: 30px; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
            <div style="position: absolute; top: 20px; right: 20px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;">
              #${index + 1} Match
            </div>
            
            <div style="margin-bottom: 20px;">
              <h4 style="color: #1e293b; margin: 0 0 10px 0; font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                📍 ${rec.destination}
              </h4>
              ${rec.highlights && rec.highlights.length > 0 ? `
              <p style="color: #64748b; margin: 0; font-size: 16px; line-height: 1.6;">
                ${rec.highlights.join(' • ')}
              </p>` : ''}
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
              ${rec.budget?.range ? `
              <div style="background: rgba(34, 197, 94, 0.1); padding: 15px; border-radius: 12px; border-left: 4px solid #22c55e;">
                <div style="color: #15803d; font-weight: 600; font-size: 14px; margin-bottom: 5px;">💰 Budget Range</div>
                <div style="color: #166534; font-size: 16px; font-weight: 700;">${rec.budget.range}</div>
              </div>` : ''}
              
              ${rec.bestMonths && rec.bestMonths.length > 0 ? `
              <div style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 12px; border-left: 4px solid #3b82f6;">
                <div style="color: #1d4ed8; font-weight: 600; font-size: 14px; margin-bottom: 5px;">📅 Best Time</div>
                <div style="color: #1e40af; font-size: 16px; font-weight: 700;">${rec.bestMonths.join(', ')}</div>
              </div>` : ''}
              
              ${rec.engagement?.potential ? `
              <div style="background: rgba(168, 85, 247, 0.1); padding: 15px; border-radius: 12px; border-left: 4px solid #a855f7;">
                <div style="color: #7c3aed; font-weight: 600; font-size: 14px; margin-bottom: 5px;">📈 Engagement</div>
                <div style="color: #6b21a8; font-size: 16px; font-weight: 700;">${rec.engagement.potential}</div>
              </div>` : ''}
            </div>
            
            ${rec.tags && rec.tags.length > 0 ? `
            <div style="margin-top: 20px;">
              <div style="color: #475569; font-weight: 600; font-size: 14px; margin-bottom: 10px;">🏷️ Tags</div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${rec.tags.map(tag => `<span style="background: linear-gradient(135deg, #f1f5f9, #e2e8f0); color: #475569; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; border: 1px solid #cbd5e1;">${tag}</span>`).join('')}
              </div>
            </div>` : ''}
            
            ${rec.creatorDetails ? `
            <div style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; border: 1px solid #10b981;">
              <div style="color: #047857; font-weight: 600; font-size: 16px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                👥 Creator Community
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div>
                  <div style="color: #065f46; font-weight: 600; font-size: 14px;">Active Creators</div>
                  <div style="color: #047857; font-size: 18px; font-weight: 700;">${rec.creatorDetails && typeof rec.creatorDetails === 'object' && 'totalActiveCreators' in rec.creatorDetails ? (rec.creatorDetails as {totalActiveCreators: number}).totalActiveCreators : 0}+</div>
                </div>
                <div>
                  <div style="color: #065f46; font-weight: 600; font-size: 14px;">Collaboration Rate</div>
                  <div style="color: #047857; font-size: 18px; font-weight: 700;">High</div>
                </div>
              </div>
              ${rec.creatorDetails && typeof rec.creatorDetails === 'object' && 'collaborationOpportunities' in rec.creatorDetails && Array.isArray((rec.creatorDetails as {collaborationOpportunities: string[]}).collaborationOpportunities) && (rec.creatorDetails as {collaborationOpportunities: string[]}).collaborationOpportunities.length > 0 ? `
              <div style="margin-top: 15px;">
                <div style="color: #065f46; font-weight: 600; font-size: 14px; margin-bottom: 8px;">🤝 Opportunities</div>
                <div style="color: #047857; font-size: 14px; line-height: 1.5;">${(rec.creatorDetails as {collaborationOpportunities: string[]}).collaborationOpportunities.join(' • ')}</div>
              </div>` : ''}
            </div>` : ''}
          </div>
          `).join('')}
        </div>
      </div>` : `
      <div style="background: rgba(239, 68, 68, 0.1); padding: 25px; border-radius: 16px; margin-bottom: 30px; border: 1px solid #ef4444; text-align: center;">
        <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 18px;">⚠️ No Recommendations Available</h3>
        <p style="color: #991b1b; margin: 0; font-size: 14px;">We couldn't generate specific recommendations at this time. Please try again with more detailed preferences.</p>
      </div>`}

      <!-- Enhanced Website Analysis -->
      ${websiteData.themes && websiteData.themes.length > 0 ? `
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 30px; border-radius: 16px; margin-bottom: 35px; border: 1px solid #0ea5e9;">
        <h3 style="color: #0c4a6e; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px;">🔍 Website Analysis Insights</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
          ${websiteData.contentType ? `
          <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px;">
            <div style="color: #0c4a6e; font-weight: 600; font-size: 14px; margin-bottom: 5px;">📄 Content Type</div>
            <div style="color: #075985; font-size: 16px;">${websiteData.contentType}</div>
          </div>` : ''}
          
          ${websiteData.themes.length > 0 ? `
          <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px;">
            <div style="color: #0c4a6e; font-weight: 600; font-size: 14px; margin-bottom: 5px;">🎨 Main Themes</div>
            <div style="color: #075985; font-size: 16px;">${websiteData.themes.join(', ')}</div>
          </div>` : ''}
          
          ${websiteData.socialLinks && websiteData.socialLinks.length > 0 ? `
          <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px;">
            <div style="color: #0c4a6e; font-weight: 600; font-size: 14px; margin-bottom: 5px;">📱 Social Presence</div>
            <div style="color: #075985; font-size: 16px;">${websiteData.socialLinks.map(s => s.platform).join(', ')}</div>
          </div>` : ''}
        </div>
      </div>` : ''}

      <!-- Enhanced Pro Tips Section -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%); padding: 30px; border-radius: 16px; margin-bottom: 35px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -10px; right: -10px; width: 60px; height: 60px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
        <div style="position: relative; z-index: 1;">
          <div style="display: flex; align-items: flex-start; gap: 20px; margin-bottom: 20px;">
            <div style="background: rgba(255, 255, 255, 0.2); padding: 12px; border-radius: 12px; flex-shrink: 0;">
              <span style="font-size: 28px;">💡</span>
            </div>
            <div style="flex: 1;">
              <h4 style="color: #ffffff; margin: 0 0 12px 0; font-size: 20px; font-weight: 700;">Pro Content Creator Tips</h4>
              <p style="color: #d1fae5; margin: 0; line-height: 1.6; font-size: 16px;">
                Each destination includes specific content themes, local creator contacts, and brand collaboration opportunities 
                to help maximize your travel ROI and audience engagement!
              </p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: rgba(255, 255, 255, 0.15); padding: 15px; border-radius: 12px; backdrop-filter: blur(10px);">
              <div style="color: #ffffff; font-weight: 600; font-size: 14px; margin-bottom: 5px;">💰 Budget Optimization</div>
              <div style="color: #d1fae5; font-size: 13px;">Smart cost breakdowns included</div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.15); padding: 15px; border-radius: 12px; backdrop-filter: blur(10px);">
              <div style="color: #ffffff; font-weight: 600; font-size: 14px; margin-bottom: 5px;">🤝 Collaboration Ready</div>
              <div style="color: #d1fae5; font-size: 13px;">Local creator connections</div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.15); padding: 15px; border-radius: 12px; backdrop-filter: blur(10px);">
              <div style="color: #ffffff; font-weight: 600; font-size: 14px; margin-bottom: 5px;">📅 Perfect Timing</div>
              <div style="color: #d1fae5; font-size: 13px;">Optimal travel windows</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Call to Action -->
      <div style="text-align: center; margin-bottom: 35px;">
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 30px; border-radius: 16px; border: 2px dashed #cbd5e1; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 20px; left: 20px; width: 40px; height: 40px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 50%; opacity: 0.1;"></div>
          <div style="position: absolute; bottom: 20px; right: 20px; width: 60px; height: 60px; background: linear-gradient(45deg, #10b981, #059669); border-radius: 50%; opacity: 0.1;"></div>
          <div style="position: relative; z-index: 1;">
            <h4 style="color: #1e293b; margin: 0 0 15px 0; font-size: 22px; font-weight: 700;">📄 Your Complete Travel Analysis</h4>
            <p style="color: #64748b; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              This email contains your comprehensive travel report with detailed recommendations, 
              creator insights, and actionable content strategies.
            </p>
            <div style="background: rgba(102, 126, 234, 0.1); padding: 15px; border-radius: 12px; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #475569; font-size: 14px; font-weight: 500;">
                🔍 Save this email for easy reference while planning your content creation journey!
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Closing -->
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%); padding: 25px; border-radius: 16px; border: 1px solid #d8b4fe;">
          <p style="color: #7c3aed; margin: 0 0 10px 0; font-size: 18px; line-height: 1.6; font-weight: 600;">
            Ready to create amazing travel content? 🌍✨
          </p>
          <p style="color: #64748b; margin: 0; font-size: 16px; line-height: 1.5;">
            Happy travels and content creation!<br>
            <strong style="color: #667eea;">— The TasteJourney Team</strong>
          </p>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; margin: 0; font-size: 13px;">
              Questions? Reply to this email or contact us anytime!
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Footer -->
    <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); padding: 30px 25px; text-align: center; border-top: 1px solid #cbd5e1;">
      <div style="max-width: 500px; margin: 0 auto;">
        <div style="background: rgba(255, 255, 255, 0.8); padding: 20px; border-radius: 12px; margin-bottom: 20px; backdrop-filter: blur(10px);">
          <p style="color: #475569; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; font-weight: 500;">
            📅 Report generated on ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p style="color: #64748b; margin: 0; font-size: 13px; line-height: 1.5;">
            Report ID: TJ-${Date.now().toString().slice(-6)} | Recommendations: ${recommendations.length}
          </p>
        </div>
        
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 15px; flex-wrap: wrap;">
          <a href="mailto:${process.env.GMAIL_USER}" style="color: #667eea; text-decoration: none; display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 500;">
            📧 Contact Support
          </a>
          <span style="color: #cbd5e1;">|</span>
          <span style="color: #64748b; font-size: 13px;">🌐 TasteJourney.ai</span>
          <span style="color: #cbd5e1;">|</span>
          <span style="color: #64748b; font-size: 13px;">🔒 Secure & Private</span>
        </div>
        
        <p style="color: #94a3b8; margin: 0; font-size: 11px; line-height: 1.4;">
          This email contains personalized travel recommendations based on your website analysis.<br>
          © 2025 TasteJourney. All rights reserved. | AI-Powered Travel Intelligence
        </p>
      </div>
    </div>
  </div>
  
  <!-- Progressive enhancement for email clients that support it -->
  <style>
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg { background-color: #1f2937 !important; }
      .dark-mode-text { color: #f9fafb !important; }
    }
    
    @media (max-width: 480px) {
      .mobile-stack { display: block !important; width: 100% !important; }
      .mobile-padding { padding: 15px !important; }
      .mobile-text { font-size: 14px !important; }
      .mobile-grid { grid-template-columns: 1fr !important; }
    }
  </style>
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

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { 
          error: 'Valid email address is required',
          details: 'Please provide a valid email address in the format: user@domain.com'
        },
        { status: 400 }
      );
    }

    // Validate email length
    if (email.trim().length > 254) {
      return NextResponse.json(
        { 
          error: 'Email address too long',
          details: 'Email address must be less than 254 characters'
        },
        { status: 400 }
      );
    }

    // Enhanced website data validation
    if (!websiteData || typeof websiteData !== 'object') {
      return NextResponse.json(
        { 
          error: 'Website data is required',
          details: 'Website analysis data is missing or invalid'
        },
        { status: 400 }
      );
    }

    // Validate recommendations array
    if (recommendations && !Array.isArray(recommendations)) {
      return NextResponse.json(
        { 
          error: 'Invalid recommendations format',
          details: 'Recommendations must be an array'
        },
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
    // PDF GENERATION - DISABLED FOR FASTER DEPLOYMENT
    // =============================================================================
    // let pdfBuffer: Buffer;
    
    // try {
    //   const doc = createSafePDFDocument();
    //   const chunks: Buffer[] = [];
    //   
    //   doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    //   
    //   // Generate PDF content
    //   generatePDFContent(doc, {
    //     displayName,
    //     recommendations: safeRecommendations,
    //     userProfile: safeUserProfile,
    //     websiteData: safeWebsiteData
    //   });

    //   doc.end();

    //   // Wait for PDF generation to complete
    //   pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    //     doc.on('end', () => {
    //       try {
    //         resolve(Buffer.concat(chunks));
    //       } catch (error) {
    //         reject(error);
    //       }
    //     });
    //     doc.on('error', reject);
    //     
    //     // Timeout after 30 seconds
    //     setTimeout(() => reject(new Error('PDF generation timeout')), 30000);
    //   });

    //   console.log(`PDF generated successfully: ${pdfBuffer.length} bytes`);

    // } catch (pdfError) {
    //   console.error('PDF generation failed:', pdfError);
    //   return NextResponse.json(
    //     { 
    //       error: 'Failed to generate PDF report',
    //       details: pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'
    //     },
    //     { status: 500 }
    //   );
    // }

    // PDF generation disabled - sending email without attachment

    // =============================================================================
    // EMAIL SENDING
    // =============================================================================
    try {
      const transporter = createEmailTransporter();
      
      const mailOptions: MailOptions = {
        from: `TasteJourney <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `🌟 Your Personalized TasteJourney Travel Report - ${displayName}`,
        html: generateEmailHTML(displayName, {
          recommendations: safeRecommendations,
          userProfile: safeUserProfile,
          websiteData: safeWebsiteData
        }),
        // attachments: [
        //   {
        //     filename: `TasteJourney-Report-${displayName.replace(/[^a-zA-Z0-9]/g, '')}-${new Date().toISOString().split('T')[0]}.pdf`,
        //     content: pdfBuffer,
        //     contentType: 'application/pdf',
        //   },
        // ],
      };

      await transporter.sendMail(mailOptions);
      
      // Close the transporter
      transporter.close();

      console.log(`Email sent successfully to: ${email.trim()}`);
      
      // Log email metrics for monitoring
      console.log('Email metrics:', {
        recipient: email.trim(),
        recommendationCount: safeRecommendations.length,
        hasUserProfile: Object.keys(safeUserProfile).length > 0,
        hasWebsiteData: Boolean(safeWebsiteData.url),
        timestamp: new Date().toISOString()
      });

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Enhanced error categorization
      let errorMessage = 'Failed to send email';
      let errorDetails = 'Unknown email error';
      let statusCode = 500;
      
      if (emailError instanceof Error) {
        const errorMsg = emailError.message.toLowerCase();
        
        if (errorMsg.includes('authentication') || errorMsg.includes('auth')) {
          errorMessage = 'Email authentication failed';
          errorDetails = 'Server email configuration issue. Please contact support.';
          statusCode = 503;
        } else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
          errorMessage = 'Network connection failed';
          errorDetails = 'Unable to connect to email server. Please try again later.';
          statusCode = 503;
        } else if (errorMsg.includes('quota') || errorMsg.includes('limit')) {
          errorMessage = 'Email quota exceeded';
          errorDetails = 'Daily email limit reached. Please try again tomorrow.';
          statusCode = 429;
        } else if (errorMsg.includes('invalid') && errorMsg.includes('recipient')) {
          errorMessage = 'Invalid recipient email';
          errorDetails = 'The provided email address is not valid or does not exist.';
          statusCode = 400;
        } else {
          errorDetails = emailError.message;
        }
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          suggestion: statusCode === 503 ? 'Please try again in a few minutes' : 
                     statusCode === 429 ? 'Please try again tomorrow' :
                     statusCode === 400 ? 'Please check your email address' :
                     'Please contact support if this persists'
        },
        { status: statusCode }
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
        userProfileFields: Object.keys(safeUserProfile).length,
        websiteAnalyzed: Boolean(safeWebsiteData.url),
        // pdfSize: pdfBuffer.length, // PDF generation disabled
        processingTime: `${processingTime}ms`,
        emailLength: generateEmailHTML(displayName, {
          recommendations: safeRecommendations,
          userProfile: safeUserProfile,
          websiteData: safeWebsiteData
        }).length
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