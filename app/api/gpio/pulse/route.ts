import { NextResponse } from "next/server";
import { gpio } from "@/lib/gpio-driver";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, durationMs = 500, times = 1 } = body;

    if (typeof id !== "number") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'id' parameter" },
        { status: 400 }
      );
    }

    const clampedDuration = Math.min(Math.max(durationMs, 100), 5000);
    const clampedTimes = Math.min(Math.max(times, 1), 10);

    // Run pulse asynchronously
    await gpio.pulsePin(id, clampedDuration, clampedTimes);

    return NextResponse.json({
      success: true,
      message: `Pulsed pin ${id} ${clampedTimes} time(s) with ${clampedDuration}ms duration`,
      pin: gpio.getPin(id),
      stats: gpio.getSystemStats(),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
