import { NextResponse } from "next/server";
import { gpio } from "@/lib/gpio-driver";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, state } = body;

    if (typeof id !== "number") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'id' parameter (must be physical pin 1-40)" },
        { status: 400 }
      );
    }

    let updatedPin;
    if (state !== undefined) {
      const targetState = state === 1 ? 1 : 0;
      updatedPin = await gpio.setPinState(id, targetState);
    } else {
      updatedPin = await gpio.togglePin(id);
    }

    return NextResponse.json({
      success: true,
      pin: updatedPin,
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
