import { reportFileName, reportToCsv } from "@/lib/server/reports";
import { errorResponse } from "@/lib/server/session";
import { reportFromRequest } from "../query";

export async function GET(request: Request) {
  try {
    const report = await reportFromRequest(request);
    return new Response(reportToCsv(report), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${reportFileName(report, "csv")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
