import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/sign-in?error=missing_code", requestUrl.origin)
    );
  }

  const response = NextResponse.redirect(
    new URL("/", requestUrl.origin)
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return (request.headers.get("cookie") ?? "")
            .split(";")
            .filter(Boolean)
            .map((cookie) => {
              const separator = cookie.indexOf("=");
              if (separator === -1) {
                return null;
              }

              return {
                name: cookie.slice(0, separator).trim(),
                value: cookie.slice(separator + 1).trim(),
              };
            })
            .filter(
              (cookie): cookie is { name: string; value: string } =>
                cookie !== null
            );
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth callback error:", error.message);

    return NextResponse.redirect(
      new URL("/sign-in?error=auth", requestUrl.origin)
    );
  }

  return response;
}