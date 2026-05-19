import { NextResponse } from "next/server";
import { ChartAgentA } from "@/lib/agents/chart-agent-a";
import { ChartAgentB } from "@/lib/agents/chart-agent-b";
import { PlannerSQLAgent } from "@/lib/agents/planner-sql-agent";
import { runReadonlyQuery } from "@/lib/db/readonly-postgres";
import { assertSafeSelectQuery } from "@/lib/security/sql-guard";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: string };
    const userMessage = body.message?.trim();

    if (!userMessage) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const plannerResult = PlannerSQLAgent(userMessage);
    const safeSql = assertSafeSelectQuery(plannerResult.sql);
    const rows = await runReadonlyQuery(safeSql);

    // ChartAgentA and ChartAgentB are worker agents. The LLM-style output is
    // a chart config, not raw React, SVG, or HTML code.
    const chartA = ChartAgentA(rows);
    const chartB = ChartAgentB(rows);

    return NextResponse.json({
      userMessage,
      plan: plannerResult.plan,
      sql: safeSql,
      reason: plannerResult.reason,
      rows,
      chartA,
      chartB
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Agent workflow failed."
      },
      { status: 500 }
    );
  }
}

