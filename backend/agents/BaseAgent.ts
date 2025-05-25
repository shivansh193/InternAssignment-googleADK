  // src/agents/BaseAgent.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Agent, AgentResponse, ChatMessage, Tool } from '../types/index';
import { config } from '../config/index';
import { logger } from '../utils/logger';

export abstract class BaseAgent implements Agent {
  protected genAI: GoogleGenerativeAI;
  protected model: any;

  constructor(
    public id: Agent['id'],
    public name: string,
    public description: string,
    public systemPrompt: string,
    public tools: Tool[] = []
  ) {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey!);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Generates content using the agent's model without full message processing
   * This allows other components to use the agent's model directly
   */
  async generateContent(prompt: string): Promise<any> {
    try {
      const result = await this.model.generateContent(prompt);
      return result;
    } catch (error) {
      logger.error(`${this.name} content generation error:`, error);
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processMessage(
    message: string,
    context: ChatMessage[] = []
  ): Promise<AgentResponse> {
    try {
      logger.info(`${this.name} processing message: ${message.substring(0, 50)}...`);

      // Check if any tools should be used
      const toolsUsed: string[] = [];
      let enhancedMessage = message;

      // Tool detection and execution
      for (const tool of this.tools) {
        if (await this.shouldUseTool(tool, message)) {
          try {
            const toolParams = await this.extractToolParameters(tool, message);
            const toolResult = await tool.execute(toolParams);
            enhancedMessage += `\n\nTool Result (${tool.name}): ${JSON.stringify(toolResult)}`;
            toolsUsed.push(tool.name);
            logger.info(`Tool ${tool.name} executed successfully`);
          } catch (toolError) {
            logger.error(`Tool ${tool.name} execution failed:`, toolError);
            enhancedMessage += `\n\nTool Error (${tool.name}): ${toolError}`;
          }
        }
      }
  
      // Build conversation context
      const contextString = context
        .slice(-5) // Last 5 messages for context
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n');
      
      // Create a prompt that instructs the model to format the response for the specific agent
      const fullPrompt = `${this.systemPrompt}

  Previous conversation:
  ${contextString}

  Current user message: ${enhancedMessage}

  IMPORTANT RESPONSE FORMAT INSTRUCTIONS:
  1. Start your response with "${this.name}:" to clearly identify which agent is responding
  2. Provide a helpful, accurate response using your specialized knowledge
  3. Present information in a clear, structured format
  4. If showing calculations or equations, present them step-by-step
  ${toolsUsed.length > 0 ? `5. Include a section at the end labeled "Tools Used: ${toolsUsed.join(', ')}" to show which tools were utilized` : ''}
  
  Now, provide your response as the ${this.name}:`;
  
        const result = await this.model.generateContent(fullPrompt);
        const response = await result.response;
        const content = response.text();
  
        logger.info(`${this.name} generated response successfully`);
  
        return {
          content,
          agent: this.id,
          toolsUsed,
          confidence: this.calculateConfidence(message, content)
        };
      } catch (error) {
        logger.error(`${this.name} processing error:`, error);
        throw new Error(`${this.name} failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  
    protected async shouldUseTool(tool: Tool, message: string): Promise<boolean> {
      // Simple keyword-based tool detection - can be enhanced with AI
      const lowerMessage = message.toLowerCase();
      
      switch (tool.name) {
        case 'calculator':
          return /calculate|compute|(\d+[\+\-\*\/]\d+)/.test(lowerMessage);
        case 'equationSolver':
          return /solve|equation|[a-z]\s*=/.test(lowerMessage);
        case 'physicsConstants':
          return /constant|speed of light|gravity|planck/.test(lowerMessage);
        case 'forceCalculator':
          return /force|newton|f\s*=\s*ma/.test(lowerMessage);
        default:
          return false;
      }
    }
  
    protected async extractToolParameters(tool: Tool, message: string): Promise<any> {
      // Simple parameter extraction - can be enhanced with AI
      switch (tool.name) {
        case 'calculator':
          const mathMatch = message.match(/[\d+\-*/().\s]+/);
          return { expression: mathMatch ? mathMatch[0].trim() : message };
        
        case 'equationSolver':
          const eqMatch = message.match(/[\dx+\-=\s\d]+/);
          return { equation: eqMatch ? eqMatch[0].trim() : message };
        
        case 'physicsConstants':
          const constMatch = message.match(/(speed of light|gravitational constant|planck|electron|proton|avogadro)/i);
          return { constant: constMatch ? constMatch[0] : 'speed_of_light' };
        
        case 'forceCalculator':
          const massMatch = message.match(/mass[:\s]*(\d+\.?\d*)/i);
          const accMatch = message.match(/acceleration[:\s]*(\d+\.?\d*)/i);
          return {
            mass: massMatch ? parseFloat(massMatch[1]) : 1,
            acceleration: accMatch ? parseFloat(accMatch[1]) : 9.8
          };
        
        default:
          return {};
      }
    }
  
    protected calculateConfidence(message: string, response: string): number {
      // Simple confidence calculation - can be enhanced
      const hasToolUsage = this.tools.some(tool => 
        message.toLowerCase().includes(tool.name.toLowerCase())
      );
      
      const responseLength = response.length;
      const baseConfidence = Math.min(0.8, responseLength / 500);
      
      return hasToolUsage ? Math.min(0.95, baseConfidence + 0.2) : baseConfidence;
    }
  
    abstract canHandle(message: string): Promise<boolean>;
  }
  

   
 