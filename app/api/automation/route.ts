import { NextResponse } from "next/server";
import { automation } from "@/lib/automation-engine";
import { gpio } from "@/lib/gpio-driver";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rules = automation.getRules();
    const security = automation.getSecurityStatus();
    const sensors = automation.getSensors();
    const logs = automation.getLogs();
    const stats = gpio.getSystemStats();

    return NextResponse.json({
      success: true,
      rules,
      securityMode: security.mode,
      securityAlarmTriggered: security.alarm,
      sensors,
      logs,
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
    const { action } = body;

    if (action === "toggle-rule") {
      const { ruleId, enabled } = body;
      const rule = automation.toggleRule(ruleId, enabled);
      return NextResponse.json({ success: true, rule });
    }

    if (action === "set-security") {
      const { mode } = body;
      const newMode = automation.setSecurityMode(mode);
      return NextResponse.json({ success: true, securityMode: newMode });
    }

    if (action === "clear-alarm") {
      automation.clearAlarm();
      return NextResponse.json({ success: true });
    }

    if (action === "clear-logs") {
      automation.clearLogs();
      return NextResponse.json({ success: true });
    }

    if (action === "simulate-sensor") {
      const { sensor, value } = body;
      await automation.updateSensor(sensor, Boolean(value));
      return NextResponse.json({
        success: true,
        sensors: automation.getSensors(),
        pins: gpio.getPins(),
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown action" },
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
