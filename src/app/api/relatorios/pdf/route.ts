import { renderReportPdf } from "@/lib/server/report-pdf";
import { reportFileName } from "@/lib/server/reports";
import { errorResponse } from "@/lib/server/session";
import { reportFromRequest } from "../query";

export async function GET(request: Request) {
  try {
    const report = await reportFromRequest(request);
    const pdf = await renderReportPdf(report);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportFileName(report, "pdf")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
