import { signOut } from "@/lib/auth-client";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  await signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/auth/login";
      },
    },
  });
  return NextResponse.redirect(new URL("/auth/login", request.url));
}
