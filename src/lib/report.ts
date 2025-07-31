import puppeteer from 'puppeteer'

interface Recommendation {
  destination: string;
  highlights?: string[];
  budget?: { range: string };
  bestMonths?: string[];
  engagement?: { potential: string };
}

interface UserProfile {
  budget?: string;
  duration?: string;
  style?: string;
  contentFocus?: string;
  climate?: string;
  [key: string]: string | undefined;
}

export interface ReportData {
  userWebsite: string
  recommendations: Recommendation[]
  userProfile: UserProfile
  generatedAt: Date
}

function generateReportHTML(data: ReportData): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .cover { background: #f5f5f5; padding: 40px; text-align: center; }
          .section { margin: 32px 0; padding: 24px; }
          h1, h2 { color: #1e293b; }
          .recommendation { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px; padding: 16px; }
        </style>
      </head>
      <body>
        <div class="cover">
          <h1>TasteJourney Travel Report</h1>
          <p><b>Website:</b> ${data.userWebsite}</p>
          <p><b>Generated:</b> ${data.generatedAt.toLocaleString()}</p>
        </div>
        <div class="section">
          <h2>Executive Summary</h2>
          <p>This report provides personalized travel recommendations based on your content, profile, and preferences.</p>
        </div>
        <div class="section">
          <h2>Top Destinations</h2>
          ${data.recommendations.map((rec, i) => `
            <div class="recommendation">
              <h3>${i+1}. ${rec.destination}</h3>
              <p><b>Highlights:</b> ${(rec.highlights || []).join(', ')}</p>
              <p><b>Budget:</b> ${rec.budget?.range || 'N/A'}</p>
              <p><b>Best Months:</b> ${(rec.bestMonths || []).join(', ')}</p>
              <p><b>Engagement:</b> ${rec.engagement?.potential || 'N/A'}</p>
            </div>
          `).join('')}
        </div>
        <div class="section">
          <h2>Profile & Tips</h2>
          <p><b>User Profile:</b> ${JSON.stringify(data.userProfile)}</p>
          <p>For more tips, visit <a href="https://tastejourney.ai">tastejourney.ai</a></p>
        </div>
      </body>
    </html>
  `
}

export async function generatePDF(data: ReportData): Promise<Buffer> {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  const html = generateReportHTML(data)
  await page.setContent(html, { waitUntil: 'networkidle0' })
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' }
  })
  await browser.close()
  return Buffer.from(pdf)
}
