export const protectedRoutePrefixes = [
  "/dashboard",
  "/dashboard-v2",
  "/admin",
  "/admin-v2",
] as const;

export function isProtectedPath(pathname: string) {
  return protectedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAuthPath(pathname: string) {
  return [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
