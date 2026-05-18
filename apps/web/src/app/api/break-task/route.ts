import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: Request) {
  const { taskName, taskMinutes } = (await req.json()) as {
    taskName: string;
    taskMinutes: number;
  };

  if (!taskName) {
    return NextResponse.json({ error: "taskName required" }, { status: 400 });
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: `You are a productivity assistant. Break a task into 3–6 concrete, actionable subtasks.
Return ONLY valid JSON in this exact shape, no other text:
{"subtasks":[{"name":"subtask name","minutes":15},{"name":"another subtask","minutes":10}]}
Each subtask's minutes should be realistic. The sum should be close to the original estimate.`,
    messages: [
      {
        role: "user",
        content: `Task: "${taskName}" (estimated ${taskMinutes} minutes)\nBreak it into subtasks.`,
      },
    ],
  });

  const text = (message.content[0] as { type: string; text: string }).text;

  try {
    const parsed = JSON.parse(text) as { subtasks: { name: string; minutes: number }[] };
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Unexpected LLM response format" }, { status: 500 });
  }
}
