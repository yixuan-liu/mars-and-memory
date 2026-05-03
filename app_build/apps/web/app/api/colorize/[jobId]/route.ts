import { NextRequest, NextResponse } from "next/server";
import { ColorizeJobSchema } from "@mars-memory/types";

// ==========================================
// GET /api/colorize/[jobId]
// Polling endpoint — client checks job status here
// ==========================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  // TODO: fetch from Supabase colorize_jobs table
  // const { data, error } = await supabase.from('colorize_jobs').select('*').eq('id', jobId).single()

  // Stub response for Phase 1 development
  const job = ColorizeJobSchema.parse({
    jobId,
    status: "pending",
    inputImageUrl: "https://placeholder.example.com/image.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json(job);
}
