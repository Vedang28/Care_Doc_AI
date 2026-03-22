import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextAuthRequest } from 'next-auth'

const MANAGER_PATHS    = ['/manager']
const PROTECTED_PATHS  = ['/dashboard', '/visit', '/manager']

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path))
  if (!isProtected) return NextResponse.next()

  if (!session?.user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = (session.user as { role?: string }).role

  if (MANAGER_PATHS.some((p) => pathname.startsWith(p))) {
    if (role === 'CAREGIVER' || role === 'SENIOR_CARER') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/visit/:path*', '/manager/:path*'],
}
