/**
 * Cloudflare Worker — PDF Generator
 *
 * POST /generate
 * Body: { html: string, reportId: string }
 * Returns: { url: string }  (24-hour signed R2 URL)
 *
 * Deploy:
 *   npm install -g wrangler
 *   wrangler secret put PDF_WORKER_SECRET
 *   wrangler deploy
 *
 * Uses @cloudflare/puppeteer for headless Chrome PDF rendering.
 * The R2 bucket must exist: wrangler r2 bucket create caredocai-assets
 */

interface Env {
  PDF_BUCKET: R2Bucket
  PDF_WORKER_SECRET: string
}

interface GenerateBody {
  html: string
  reportId: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method !== 'POST' || url.pathname !== '/generate') {
      return new Response('Not found', { status: 404 })
    }

    // Auth check
    const auth = request.headers.get('Authorization')
    if (auth !== `Bearer ${env.PDF_WORKER_SECRET}`) {
      return new Response('Unauthorised', { status: 401 })
    }

    const body = await request.json() as GenerateBody
    const { html, reportId } = body

    if (!html || !reportId) {
      return new Response('Missing html or reportId', { status: 400 })
    }

    // @cloudflare/puppeteer is available in Workers with Browser Rendering enabled
    // Uncomment once the Worker is deployed with Browser Rendering binding:
    //
    // const { default: puppeteer } = await import('@cloudflare/puppeteer')
    // const browser = await puppeteer.launch(env.BROWSER)
    // const page = await browser.newPage()
    // await page.setContent(html, { waitUntil: 'networkidle0' })
    // const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' } })
    // await browser.close()
    //
    // const key = `reports/${reportId}.pdf`
    // await env.PDF_BUCKET.put(key, pdfBuffer, { httpMetadata: { contentType: 'application/pdf' } })
    // const signedUrl = await env.PDF_BUCKET.createSignedUrl(key, { expiresIn: 86400 })
    // return Response.json({ url: signedUrl })

    // Stub response for development
    return Response.json({
      url: null,
      message: 'PDF worker stub — deploy with Cloudflare Browser Rendering to enable PDF generation',
    })
  },
}
