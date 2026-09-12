import { NextResponse } from "next/server";
import { gpio } from "@/lib/gpio-driver";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pins = gpio.getPins();
    const stats = gpio.getSystemStats();
    return NextResponse.json({
      success: true,
      pins,
      stats,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, state, id, name } = body;

    if (action === "set-all") {
      const targetState = state === 1 ? 1 : 0;
      const updated = await gpio.setAllPins(targetState);
      return NextResponse.json({
        success: true,
        message: `All controllable pins set to ${targetState === 1 ? "HIGH (ON)" : "LOW (OFF)"}`,
        pins: gpio.getPins(),
        stats: gpio.getSystemStats(),
      });
    }

    if (action === "rename" && typeof id === "number" && typeof name === "string") {
      const pin = gpio.renamePin(id, name);
      return NextResponse.json({
        success: true,
        message: `Pin ${id} renamed to "${pin.name}"`,
        pin,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
