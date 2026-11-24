import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/server/session";
import { reportFromRequest } from "./query";

export async function GET(request: Request) {
  try {
    return NextResponse.json({ report: await reportFromRequest(request) });
  } catch (err) {
    return errorResponse(err);
  }
}
