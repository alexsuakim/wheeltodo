import { callAnthropic, cors, CORS } from "../_shared/anthropic.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const { taskName, taskMinutes, goal, constraints } = await req.json();
  if (!taskName) return cors({ error: "taskName required" }, 400);

  const goalLine = goal ? `\nGoal: ${goal}` : "";
  const constraintLine = constraints ? `\nConstraints: ${constraints}` : "";

  const text = await callAnthropic({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: `You are a productivity assistant. Break a task into 3–6 concrete, actionable subtasks.
Return ONLY valid JSON in this exact shape, no other text:
{"subtasks":[{"name":"subtask name","minutes":15},{"name":"another subtask","minutes":10}]}
Each subtask's minutes should be realistic. The sum should be close to the original estimate.`,
    messages: [
      {
        role: "user",
        content: `Task: "${taskName}" (estimated ${taskMinutes} minutes)${goalLine}${constraintLine}\nBreak it into subtasks.`,
      },
    ],
  });

  try {
    return cors(JSON.parse(text));
  } catch {
    return cors({ error: "Unexpected response format" }, 500);
  }
});
