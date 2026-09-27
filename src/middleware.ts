import { withAuth } from "next-auth/middleware";

/**
 * Lightweight edge-compatible Next.js Middleware.
 * Enforces authentication/JWT presence on protected page route groups.
 * Role authorization is strictly handled downstream by Server Component layout guards.
 */
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/applicant/:path*", "/officer/:path*", "/admin/:path*", "/management/:path*"],
};
