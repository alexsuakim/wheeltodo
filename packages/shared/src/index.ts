import { z } from "zod";
export * from "./supabase";

export const TaskSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(120),
  minutes: z.number().int().min(1).max(480),
  completedAt: z.number().int().optional()
});

export type Task = z.infer<typeof TaskSchema>;

