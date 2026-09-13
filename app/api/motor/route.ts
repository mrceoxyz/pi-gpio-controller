import { NextResponse } from "next/server";
import { gpio } from "@/lib/gpio-driver";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, durationMs = 3000 } = body;

    // Motor is connected to Pin 13 (BCM 27)
    const MOTOR_PIN = 13;

    if (action === "feed-pulse") {
      // Run motor for 2.5 seconds to dispense food/curtain
      await gpio.setPinState(MOTOR_PIN, 1);
      setTimeout(async () => {
        await gpio.setPinState(MOTOR_PIN, 0);
      }, 2500);

      return NextResponse.json({
        success: true,
        message: "Motor dispensing pulse triggered (2.5s)",
        pin: gpio.getPin(MOTOR_PIN),
      });
    }

    if (action === "cool-run") {
      // Run motor for 15 seconds
      await gpio.setPinState(MOTOR_PIN, 1);
      setTimeout(async () => {
        await gpio.setPinState(MOTOR_PIN, 0);
      }, 15000);

      return NextResponse.json({
        success: true,
        message: "Cooling run started (15s)",
        pin: gpio.getPin(MOTOR_PIN),
      });
    }

    if (action === "toggle") {
      const pin = await gpio.togglePin(MOTOR_PIN);
      return NextResponse.json({
        success: true,
        pin,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid motor action" },
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
