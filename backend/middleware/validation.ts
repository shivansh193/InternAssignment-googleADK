// backend-lib/validation/schemas.ts
import { z } from 'zod';
import type { AgentType } from '../types'; // Import your existing AgentType

// Schema for ChatMessage, mirroring your interface but with runtime checks
export const chatMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  sender: z.enum(['user', 'assistant']),
  // For timestamp, Zod can coerce string to Date, or you can accept string and parse later
  timestamp: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
  }, z.date()),
  agent: z.enum(['tutor', 'math', 'physics'] as [AgentType, ...AgentType[]]).optional() // Ensure AgentType is used if it can change
});

// Schema for ChatRequest, mirroring your interface
export const chatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty.").max(2000, "Message is too long."),
  sessionId: z.string().uuid("Invalid session ID format.").optional(),
  context: z.array(chatMessageSchema).optional()
});

// Infer the type from the schema for use in your code
export type ChatRequestPayload = z.infer<typeof chatRequestSchema>;