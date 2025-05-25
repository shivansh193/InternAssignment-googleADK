import { NextResponse } from 'next/server';
import { AgentOrchestrator } from '../../../../backend/services/AgentOrchestrator'; // To get agent count

const orchestrator = new AgentOrchestrator(); // Instantiate to get agent info

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    agents: orchestrator.getAgentInfo().length // Or a fixed number if you prefer
  });
}