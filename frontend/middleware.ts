import { NextResponse, type NextRequest } from "next/server";

const LEGACY_HOST = "zip-drop.vercel.app";
const APEX_HOST = "getzipdrop.com";
const CANONICAL_HOST = "www.getzipdrop.com";

export function middleware(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = forwardedHost ?? request.headers.get("host") ?? "";
  const host = hostHeader.split(",")[0].trim().toLowerCase();

  if (host !== LEGACY_HOST && host !== APEX_HOST) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = CANONICAL_HOST;
  url.port = "";

  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|ads.txt|robots.txt|sitemap.xml).*)"],
};
