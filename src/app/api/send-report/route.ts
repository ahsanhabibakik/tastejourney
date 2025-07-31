export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

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
}

export async function POST(request: NextRequest) {
  try {
    const { email, recommendations, userProfile, websiteData } =
      (await request.json()) as ReportRequest;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 2) Try to load local Roboto font, fallback to default if not found
    const fontPath = path.join(process.cwd(), 'src', 'fonts', 'Roboto-Regular.ttf');
    const doc = new PDFDocument({ autoFirstPage: false });
    if (fs.existsSync(fontPath)) {
      const fontBuffer = fs.readFileSync(fontPath);
      doc.registerFont('Roboto', fontBuffer);
      doc.addPage();
      doc.font('Roboto');
    } else {
      doc.addPage(); // use default font
    }

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    // build the PDF
    doc.fontSize(20).text('TasteJourney Travel Report', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(14).text(`For: ${email}`);
    doc.moveDown(1);

    doc.fontSize(16).text('Website Data:', { underline: true });
    doc.fontSize(12).text(`• Title: ${websiteData.title}`);
    doc.text(`• Description: ${websiteData.description}`);
    doc.text(`• URL: ${websiteData.url}`);
    doc.text(`• Themes: ${websiteData.themes.join(', ')}`);
    doc.text(`• Hints: ${websiteData.hints.join(', ')}`);
    doc.moveDown(1);

    doc.fontSize(16).text('User Profile:', { underline: true });
    Object.entries(userProfile).forEach(([k, v]) => {
      doc.fontSize(12).text(`• ${k}: ${String(v)}`);
    });
    doc.moveDown(1);

    doc.fontSize(16).text('Recommendations:', { underline: true });
    recommendations.forEach((rec, i) => {
      doc.moveDown(0.5);
      doc.fontSize(13).text(`${i + 1}. ${rec.destination}`);
      if (rec.highlights)
        doc.fontSize(11).text(`   - Highlights: ${rec.highlights.join(', ')}`);
      if (rec.budget) doc.text(`   - Budget: ${rec.budget.range}`);
      if (rec.bestMonths)
        doc.text(`   - Best Months: ${rec.bestMonths.join(', ')}`);
      if (rec.engagement)
        doc.text(`   - Engagement: ${rec.engagement.potential}`);
      if (rec.tags) doc.text(`   - Tags: ${rec.tags.join(', ')}`);
    });

    doc.end();

    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // 4) send email via Nodemailer
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
