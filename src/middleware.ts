import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Area Room riservata: senza sessione → /welcome (intro pubblica) o /login se
// sei già dentro l'onboarding; con sessione ma onboarding incompleto → /onboarding.
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = req.nextUrl.pathname;

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === '/onboarding' ? '/login' : '/welcome';
    return NextResponse.redirect(url);
  }

  if (pathname !== '/onboarding') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile?.onboarding_completed) {
      const url = req.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ['/room/:path*', '/onboarding'],
};
