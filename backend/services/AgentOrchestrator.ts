// src/services/AgentOrchestrator.ts
import { TutorAgent } from '../agents/TutorAgent';
import { MathAgent } from '../agents/MathAgent';
import { PhysicsAgent } from '../agents/PhysicsAgent';
import { BaseAgent } from '../agents/BaseAgent';
import { ChatMessage, AgentResponse, AgentType } from '../types';
import { logger } from '../utils/logger';

export class AgentOrchestrator {
  private agents: BaseAgent[];
  private tutorAgent: TutorAgent;
  private mathAgent: MathAgent;
  private physicsAgent: PhysicsAgent;

  constructor() {
    this.tutorAgent = new TutorAgent();
    this.mathAgent = new MathAgent();
    this.physicsAgent = new PhysicsAgent();
    
    this.agents = [this.mathAgent, this.physicsAgent, this.tutorAgent];
  }

  async routeMessage(
    message: string,
    context: ChatMessage[] = []
  ): Promise<AgentResponse> {
    try {
      logger.info(`Routing message: ${message.substring(0, 50)}...`);
      console.log('Orchestrator: Starting agent routing process for message');
      
      // Step 1: Ask Gemini to determine which agent should handle the response
      console.log('Orchestrator: Step 1 - Determining agent routing');
      
      const routingPrompt = `You are the coordinator for a multi-agent AI tutoring system. Your task is to analyze the user's question and determine which agent should handle it.

Available agents:
1. Tutor Agent: General educational questions, coordination, and non-specialized topics
2. Math Agent: Mathematics, calculations, equations, algebra, geometry, calculus, statistics
3. Physics Agent: Physics concepts, forces, energy, motion, constants, laws of physics

Analyze the following question and respond in this exact format:

AGENT_ROUTING: [agent_name] (must be one of: TUTOR, MATH, or PHYSICS)
ANALYSIS: [brief 1-2 sentence analysis of why this agent is appropriate]

User Question: ${message}`;
      
      const routingResponse = await this.tutorAgent.generateContent(routingPrompt);
      const routingText = await routingResponse.response.text();
      console.log('Orchestrator: Agent routing analysis completed');
      
      // Parse the routing response to extract agent and analysis
      const agentRoutingRegex = /AGENT_ROUTING:\s*(TUTOR|MATH|PHYSICS)/i;
      const analysisRegex = /ANALYSIS:\s*(.+)/i;
      
      const agentRoutingMatch = routingText.match(agentRoutingRegex);
      const analysisMatch = routingText.match(analysisRegex);
      
      let targetAgent: AgentType = 'tutor'; // Default to tutor
      let analysisText = '';
      
      if (agentRoutingMatch && agentRoutingMatch[1]) {
        const agentName = agentRoutingMatch[1].toUpperCase();
        if (agentName === 'MATH') targetAgent = 'math';
        else if (agentName === 'PHYSICS') targetAgent = 'physics';
        else targetAgent = 'tutor';
      }
      
      if (analysisMatch && analysisMatch[1]) {
        analysisText = analysisMatch[1].trim();
      }
      
      console.log(`Orchestrator: Selected ${targetAgent} agent based on analysis`);
      
      // For compatibility with existing code, set these flags based on the selected agent
      const isMathQuestion = targetAgent === 'math';
      const isPhysicsQuestion = targetAgent === 'physics';
      
      // Define keywords for tool detection
      const lowerMessage = message.toLowerCase();
      const physicsKeywords = [
        'physics', 'force', 'energy', 'motion', 'velocity', 'acceleration',
        'newton', 'gravity', 'mass', 'weight', 'momentum', 'pressure',
        'temperature', 'heat', 'light', 'wave', 'frequency', 'electricity',
        'magnetic', 'quantum', 'relativity', 'constant', 'speed of light'
      ];
      
      let specialistResponse = "";
      let toolResults = {};
      let formattedEquations = false;
      
      // Step 3: Route to specialist agent and get response
      if (isMathQuestion) {
        console.log('Orchestrator: Detected math question, delegating to Math Agent');
        logger.info('Detected math question, delegating to Math Agent');
        
        // Check if we need to use math tools
        const needsCalculation = /\d+[\+\-\*\/]\d+/.test(message);
        const needsEquationSolving = /[a-z]\s*=/.test(lowerMessage) || 
                                   message.includes('solve') || 
                                   message.includes('equation');
        
        if (needsCalculation || needsEquationSolving) {
          console.log('Orchestrator: Math tools will be used for this question');
          
          // Process with Math Agent to get tool results
          const mathResponse = await this.mathAgent.processMessage(message, context);
          specialistResponse = `Math Agent: ${mathResponse.content}`;
          toolResults = mathResponse.toolResults || {};
          
          // Format equations for better display
          formattedEquations = true;
        } else {
          // Just get the specialist response without tools
          const mathResponse = await this.mathAgent.processMessage(message, context);
          specialistResponse = `Math Agent: ${mathResponse.content}`;
          formattedEquations = true;
        }
      } else if (isPhysicsQuestion) {
        console.log('Orchestrator: Detected physics question, delegating to Physics Agent');
        logger.info('Detected physics question, delegating to Physics Agent');
        
        // Check if we need physics constants or calculations
        const needsConstants = message.includes('constant') || 
                             message.includes('value of') || 
                             physicsKeywords.some((k: string) => message.includes(k));
        
        if (needsConstants) {
          console.log('Orchestrator: Physics tools will be used for this question');
          
          // Process with Physics Agent to get tool results
          const physicsResponse = await this.physicsAgent.processMessage(message, context);
          specialistResponse = `Physics Agent: ${physicsResponse.content}`;
          toolResults = physicsResponse.toolResults || {};
          formattedEquations = true;
        } else {
          // Just get the specialist response without tools
          const physicsResponse = await this.physicsAgent.processMessage(message, context);
          specialistResponse = `Physics Agent: ${physicsResponse.content}`;
          formattedEquations = true;
        }
      }
      
      // Step 4: Final response synthesis by Tutor Agent
      console.log('Orchestrator: Step 4 - Final response synthesis');
      
      let finalPrompt = message;
      let finalAgent: AgentType = 'tutor';
      let toolsUsed: string[] = [];
      
      if (specialistResponse) {
        // If we have a specialist response, include it in the final prompt
        finalPrompt = `Question: ${message}\n\nProblem Analysis: ${analysisText}\n\nSpecialist Response: ${specialistResponse}`;
        
        // Set the agent type based on which specialist was used
        finalAgent = isMathQuestion ? 'math' : isPhysicsQuestion ? 'physics' : 'tutor';
        
        // Record which tools were used
        toolsUsed = Object.keys(toolResults);
      }
      
      // Get the final response from the appropriate agent
      let finalResponse: AgentResponse;
      
      if (isMathQuestion) {
        finalResponse = await this.mathAgent.processMessage(finalPrompt, context);
      } else if (isPhysicsQuestion) {
        finalResponse = await this.physicsAgent.processMessage(finalPrompt, context);
      } else {
        finalResponse = await this.tutorAgent.processMessage(finalPrompt, context);
      }
      
      // Add tools used information to the content if not already included
      let enhancedContent = finalResponse.content;
      const allToolsUsed = [...toolsUsed, ...finalResponse.toolsUsed];
      
      // Only add tools used if there are any and it's not already in the content
      if (allToolsUsed.length > 0 && !enhancedContent.includes('Tools Used:')) {
        enhancedContent += `\n\nTools Used: ${allToolsUsed.join(', ')}`;
      }
      
      // Combine everything into a comprehensive response
      return {
        content: enhancedContent,
        agent: finalAgent,
        toolsUsed: allToolsUsed,
        confidence: finalResponse.confidence,
        analysis: analysisText,
        specialistResponse: specialistResponse,
        toolResults: toolResults,
        formattedEquations: formattedEquations
      };
      
    } catch (error) {
      console.error('Orchestrator error:', error);
      logger.error('Agent orchestration error:', error);
      throw new Error(`Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getAgentInfo(): Array<{ id: AgentType; name: string; description: string }> {
    return this.agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description
    }));
  }
}
  