import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Rediriger /sitemap.xml vers notre API route
    if (request.nextUrl.pathname === '/sitemap.xml') {
        return NextResponse.redirect(new URL('/api/sitemap', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/sitemap.xml'],
};
