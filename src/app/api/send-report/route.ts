
import { NextRequest, NextResponse } from "next/server";
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface Recommendation {
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
    const { email, recommendations, userProfile, websiteData }: ReportRequest = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Generate PDF (mocked as a simple Buffer for now)
    // In production, use Puppeteer to generate a real PDF
    const pdfBuffer = Buffer.from(`TasteJourney Report for ${email}\n${JSON.stringify({ recommendations, userProfile, websiteData }, null, 2)}`);

    // 2. Send email using SendGrid
    const msg = {
      to: email,
      from: 'reports@tastejourney.ai',
      subject: 'Your Personalized Travel Recommendations',
      html: `<p>Hi,<br>Your personalized travel recommendations are attached as a PDF.<br>Thank you for using TasteJourney!</p><p><a href="#">Unsubscribe</a></p>`,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: 'travel-recommendations.pdf',
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    };
    await sgMail.send(msg);

    return NextResponse.json({
      success: true,
      message: "Report sent successfully",
      reportId: `report_${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error sending report:", error);
    return NextResponse.json(
      { error: "Failed to send report" },
      { status: 500 }
    );
  }
}
