import { NextResponse } from 'next/server';
import { AgentOrchestrator } from '../../../../backend/services/AgentOrchestrator';
import { logger } from '../../../../backend/utils/logger';

const orchestrator = new AgentOrchestrator();

export async function GET() {
  try {
    const agents = orchestrator.getAgentInfo();
    return NextResponse.json({ agents });
  } catch (error) {
    logger.error('Agents endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch agents', message: errorMessage },
      { status: 500 }
    );
  }
}