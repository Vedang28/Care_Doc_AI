import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextAuthRequest } from 'next-auth'

// Paths restricted by minimum role
const ADMIN_PATHS   = ['/admin']
const MANAGER_PATHS = ['/manager']
const PROTECTED_PATHS = ['/dashboard', '/visit', '/manager', '/admin']

// Subdomain routing:
// agency-name.caredocai.com → extract "agency-name", look up agency by subdomain
// app.caredocai.com         → master admin portal
//
// Vercel DNS setup:
//   1. Add a wildcard CNAME: *.caredocai.com → cname.vercel-dns.com
//   2. In Vercel project settings → Domains → add *.caredocai.com
//   3. The `host` header will contain the full subdomain on each request

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Inject subdomain into request headers for downstream API routes
  const host = req.headers.get('host') ?? ''
  const subdomainMatch = host.match(/^([^.]+)\.caredocai\.com$/)
  const subdomain = subdomainMatch?.[1] ?? null
  const requestHeaders = new Headers(req.headers)
  if (subdomain && subdomain !== 'app') {
    requestHeaders.set('x-agency-subdomain', subdomain)
  }

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path))
  if (!isProtected) return NextResponse.next({ request: { headers: requestHeaders } })

  if (!session?.user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = (session.user as { role?: string }).role

  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  if (MANAGER_PATHS.some((p) => pathname.startsWith(p))) {
    if (role === 'CAREGIVER' || role === 'SENIOR_CARER') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: ['/dashboard/:path*', '/visit/:path*', '/manager/:path*', '/admin/:path*'],
}
