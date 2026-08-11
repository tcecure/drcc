import { NextResponse, type NextRequest } from "next/server";

import { formMessage, friendlyAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return NextResponse.redirect(
          new URL(
            `/login?error=${formMessage(friendlyAuthErrorMessage(error))}`,
            requestUrl.origin,
          ),
        );
      }
    } catch (error) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${formMessage(friendlyAuthErrorMessage(error))}`,
          requestUrl.origin,
        ),
      );
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
