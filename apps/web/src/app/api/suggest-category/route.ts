import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

interface Correction {
  task: string;
  category: string;
}

export async function POST(req: Request) {
  const { taskName, categories, examples } = (await req.json()) as {
    taskName: string;
    categories: string[];
    examples?: Correction[];
  };

  if (!taskName?.trim() || !categories?.length) {
    return NextResponse.json({ category: null });
  }

  const examplesBlock =
    examples?.length
      ? `\nPast assignments to learn from:\n${examples
          .slice(-20)
          .map((e) => `"${e.task}" → ${e.category}`)
          .join("\n")}`
      : "";

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 32,
    system: `Classify a task into exactly one of these categories: ${categories.join(", ")}.
Reply with ONLY the category name. If nothing fits, reply with "none".${examplesBlock}`,
    messages: [{ role: "user", content: `Task: "${taskName.trim()}"` }],
  });

  const text = (message.content[0] as { type: string; text: string }).text.trim();
  const matched = categories.find((c) => c.toLowerCase() === text.toLowerCase());

  return NextResponse.json({ category: matched ?? null });
}
