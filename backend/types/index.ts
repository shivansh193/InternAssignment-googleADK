// src/types/index.ts

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  agent?: AgentType;
}

export type AgentType = 'tutor' | 'math' | 'physics';

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  agent: AgentType;
  timestamp: Date;
  sessionId: string;
  toolsUsed?: string[];
  analysis?: string;
  specialistResponse?: string;
  formattedEquations?: boolean;
  toolResults?: { [toolName: string]: any };
}

export interface Agent {
  id: AgentType;
  name: string;
  description: string;
  systemPrompt: string;
  tools: Tool[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

export interface AgentResponse {
  content: string;
  agent: AgentType;
  toolsUsed: string[];
  confidence: number;
  analysis?: string; // Initial problem analysis
  specialistResponse?: string; // Response from specialist agent
  toolResults?: { [toolName: string]: any }; // Results from tools
  formattedEquations?: boolean; // Flag to indicate if response contains math equations
}