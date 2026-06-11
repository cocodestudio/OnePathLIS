export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    // Protect API routes except auth endpoints
    "/api/patients/:path*",
    "/api/reports/:path*",
    "/api/tests/:path*",
    "/api/billing/:path*",
    "/api/analytics/:path*",
  ],
};
