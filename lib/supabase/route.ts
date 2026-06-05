import { NextResponse } from "next/server";

/** Standard JSON error response for Route Handlers. */
export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Maps a thrown value (PostgrestError or Error) to a JSON error response. */
export function handleError(e: unknown, status = 400) {
  const message =
    e instanceof Error
      ? e.message
      : typeof e === "object" && e && "message" in e
        ? String((e as { message: unknown }).message)
        : "Có lỗi xảy ra";
  return apiError(message, status);
}
