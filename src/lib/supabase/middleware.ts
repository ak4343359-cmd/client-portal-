import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieList = { name: string; value: string; options: CookieOptions }[];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!/^https?:\/\//.test(supabaseUrl) || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error(
      "Supabase is misconfigured: NEXT_PUBLIC_SUPABASE_URL must be your project URL (https://<ref>.supabase.co) and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
    );
    return new NextResponse(
      "The portal is temporarily unavailable due to a configuration error. Please contact support.",
      { status: 503, headers: { "content-type": "text/plain" } }
    );
  }

  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieList) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic =
    path.startsWith("/login") ||
    path.startsWith("/rate") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/auth");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
