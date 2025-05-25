import { NextRequest, NextResponse } from 'next/server';
import { AgentOrchestrator } from '../../../../backend/services/AgentOrchestrator';
import { ChatResponse} from '../../../../backend/types/index';
import { logger } from '../../../../backend/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Define the Zod schema for request validation
const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  context: z.array(z.object({
    id: z.string(),
    content: z.string(),
    sender: z.enum(['user', 'assistant']),
    timestamp: z.union([z.string(), z.date()]).transform(val => new Date(val)),
    agent: z.enum(['tutor', 'math', 'physics']).optional()
  })).optional()
});

// Safely initialize the orchestrator with error handling
let orchestrator: AgentOrchestrator;
try {
  orchestrator = new AgentOrchestrator();
  console.log('API: AgentOrchestrator initialized successfully');
} catch (error) {
  console.error('API: Failed to initialize AgentOrchestrator:', error);
  // We'll handle this error when the endpoint is called
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  // Define sessionId at the top level so it's available in the catch block
  let sessionId = 'unknown';
  
  try {
    // Add debugging for Vercel environment
    console.log('API: Environment variables check:', {
      nodeEnv: process.env.NODE_ENV,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      corsOrigin: process.env.CORS_ORIGIN
    });

    console.log('API: Received chat request');
    
    // Parse the request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('API: Request body parsed successfully');
    } catch (parseError) {
      console.error('API: Failed to parse request body:', parseError);
      return NextResponse.json(
        { 
          error: true, 
          message: 'Invalid request body. Failed to parse JSON.'
        },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    // Validate the request body
    const validationResult = chatRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('API: Request validation failed:', validationResult.error);
      return NextResponse.json(
        { 
          error: true, 
          message: 'Invalid request format',
          details: validationResult.error.errors
        },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    const { message, context = [] } = validationResult.data;
    // Update the sessionId variable declared at the top level
    sessionId = validationResult.data.sessionId || uuidv4();
    
    logger.info(`Chat request from session ${sessionId}: ${message.substring(0, 100)}...`);

    // First, check if the Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          error: true, 
          message: 'Gemini API key is missing',
          sessionId,
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

    // Check if orchestrator is initialized
    if (!orchestrator) {
      return NextResponse.json(
        { 
          error: true, 
          message: 'AgentOrchestrator failed to initialize',
          sessionId,
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    try {
      console.log('API: Calling orchestrator.routeMessage');
      const agentResponse = await orchestrator.routeMessage(message, context);

      logger.info(`Agent response from ${agentResponse.agent}: ${agentResponse.content.substring(0, 100)}...`);

      // Prepare the response
      const response: ChatResponse = {
        message: agentResponse.content,
        agent: agentResponse.agent,
        timestamp: new Date(),
        sessionId: sessionId,
        toolsUsed: agentResponse.toolsUsed,
        analysis: agentResponse.analysis,
        specialistResponse: agentResponse.specialistResponse,
        toolResults: agentResponse.toolResults,
        formattedEquations: agentResponse.formattedEquations
      };

      console.log('API: Response generated:', {
        agent: agentResponse.agent,
        messagePreview: agentResponse.content.substring(0, 50) + '...'
      });

      logger.info(`Response generated by ${agentResponse.agent} agent`);
      
      return NextResponse.json(response, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    } catch (routeError) {
      console.error('API: Error in orchestrator.routeMessage:', routeError);
      return NextResponse.json(
        { 
          error: true, 
          message: 'Error processing message',
          details: routeError instanceof Error ? routeError.message : 'Unknown error',
          sessionId,
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }

  } catch (error) {
    console.error('API: Chat endpoint error:', error);
    logger.error('Chat endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Create a safe error response that will always be valid JSON
    return NextResponse.json(
      { 
        error: true, 
        message: 'Internal server error', 
        details: errorMessage,
        sessionId: sessionId || 'unknown',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
}