/** @format */
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await auth();
  const user = session?.user;
  const { pathname } = request.nextUrl;

  console.log(user, 'ini userrrrrr');
  // if (session?.user.access_token) {
  //   console.log('masukkk refresh');
  //   // await signIn('credentials', {
  //   //   access_token: session.user.access_token,
  //   //   redirect: false,
  //   // });
  // }

  // if (user?.roleId == 2 && (pathname === '/order' || pathname === '/signup')) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }
  if (user?.roleId == 1) {
    if (
      pathname == '/order' ||
      pathname == '/all-branch-orders' ||
      pathname == '/branch-orders'
    ) {
      return NextResponse.redirect(new URL('/my-order', request.url));
    }
  }
  if (user?.roleId == 2) {
    if (
      pathname == '/order' ||
      pathname == '/my-order' ||
      pathname == '/branch-orders'
    ) {
      console.log('masuk');
      return NextResponse.redirect(new URL('/all-branch-orders', request.url));
    }
  }
  if (user?.roleId == 3) {
    if (
      pathname == '/order' ||
      pathname == '/my-order' ||
      pathname == '/all-branch-orders'
    ) {
      return NextResponse.redirect(new URL('/branch-orders', request.url));
    }
  }

  if (user?.id && (pathname === '/signin' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
  } else if (!user?.id && !['/', '/shop', '/product'].includes(pathname)) {
    if (pathname === '/signin' || pathname === '/signup') {
      return response;
    }
    const loginUrl = new URL('/signin', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    console.log(request.url, 'ini request url');
    // Set the redirect parameter
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/signin',
    '/signup',
    '/register',
    '/checkout',
    '/order',
    '/add-address',
    '/billing',
    '/my-profile2',
    '/carts',
    '/my-order',
    '/all-branch-orders',
    '/branch-orders',
  ],
};
