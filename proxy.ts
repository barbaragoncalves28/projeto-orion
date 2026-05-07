import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  console.log("rota:", req.nextUrl.pathname);
  console.log("token:", token);

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    verifyToken(token);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/orders/:path*", "/dashboard"],
};