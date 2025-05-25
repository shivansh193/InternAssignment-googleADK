  // src/tools/mathTools.ts
  import { Tool } from '../types';
  
  export const calculator: Tool = {
    name: 'calculator',
    description: 'Perform basic arithmetic operations',
    parameters: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (e.g., "2 + 3 * 4")'
      }
    },
    execute: async (params: { expression: string }) => {
      try {
        // Simple calculator - in production, use a proper math parser like mathjs
        const sanitized = params.expression.replace(/[^0-9+\-*/().\s]/g, '');
        const result = Function(`"use strict"; return (${sanitized})`)();
        
        if (typeof result !== 'number' || !isFinite(result)) {
          throw new Error('Invalid calculation result');
        }
        
        return {
          result,
          expression: params.expression,
          steps: `Calculated: ${params.expression} = ${result}`
        };
      } catch (error) {
        throw new Error(`Calculator error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
  
  export const equationSolver: Tool = {
    name: 'equationSolver',
    description: 'Solve simple algebraic equations',
    parameters: {
      equation: {
        type: 'string',
        description: 'Equation to solve (e.g., "2x + 5 = 11")'
      }
    },
    execute: async (params: { equation: string }) => {
      try {
        // Simple linear equation solver - in production, use a proper algebra library
        const eq = params.equation.toLowerCase().replace(/\s/g, '');
        
        // Handle simple linear equations like "2x+5=11"
        const match = eq.match(/^(\d*)x([+-]\d+)=(\d+)$/);
        if (match) {
          const a = parseInt(match[1] || '1');
          const b = parseInt(match[2]);
          const c = parseInt(match[3]);
          const x = (c - b) / a;
          
          return {
            solution: x,
            steps: [
              `Original equation: ${params.equation}`,
              `Rearranged: ${a}x = ${c} - (${b})`,
              `Simplified: ${a}x = ${c - b}`,
              `Solution: x = ${x}`
            ]
          };
        }
        
        throw new Error('Equation format not supported');
      } catch (error) {
        throw new Error(`Equation solver error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };