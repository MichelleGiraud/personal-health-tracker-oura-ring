import { NextResponse } from "next/server";
import { getLatestToken } from "@/lib/oura";
import { syncQueue } from "@/lib/queue";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const daysParam = Number(searchParams.get("days") ?? "7");
  const days = Number.isFinite(daysParam) && daysParam > 0 ? Math.floor(daysParam) : 7;

  const token = await getLatestToken();

  if (!token?.user_id) {
    return NextResponse.json(
      { error: "No Oura user token found. Complete OAuth first." },
      { status: 400 }
    );
  }

  const job = await syncQueue.add("fetchDailySummaryMetrics", {
    userId: token.user_id,
    days,
  });

  return NextResponse.json(
    {
      success: true,
      queued: true,
      jobId: job.id,
      userId: token.user_id,
      days,
      message: "Oura sync process successfully scheduled in the background.",
    },
    { status: 202 }
  );
}
