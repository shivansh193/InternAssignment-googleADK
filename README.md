# Agentic Tutor: Multi-Agent AI Tutoring System

<p align="center">
  <img src="public/logo.png" alt="Agentic Tutor Logo" width="200"/>
</p>

## Overview

Agentic Tutor is an advanced educational platform that utilizes a multi-agent AI system to provide specialized tutoring across different subjects. The system employs a coordinated team of AI agents, each with specific expertise, to deliver personalized and in-depth educational assistance.

### Key Features

- **Multi-Agent Architecture**: Specialized agents for different subject domains
- **Intelligent Routing**: Automatic delegation to the most appropriate specialist agent
- **Tool Integration**: Specialized tools for calculations, equation solving, and physics constants
- **Interactive UI**: Modern, responsive interface with clear agent identification
- **Equation Formatting**: Clear presentation of mathematical and physics equations

## System Architecture

### Agent System

The tutoring system employs a hierarchical multi-agent architecture:

1. **Tutor Agent**: The primary coordinator that handles general educational questions and delegates specialized queries
2. **Math Agent**: Specializes in mathematics topics including algebra, calculus, geometry, and statistics
3. **Physics Agent**: Focuses on physics concepts, forces, energy, motion, and physical constants

### Agent Orchestration

The system uses a sophisticated orchestration mechanism that:

1. Analyzes incoming questions using AI to determine the appropriate agent
2. Routes questions to specialized agents when domain-specific knowledge is required
3. Integrates responses with relevant tools and calculations
4. Presents a unified, coherent response to the user

### Tools Integration

Specialized agents have access to domain-specific tools:

- **Math Tools**: Calculator and equation solver for mathematical operations
- **Physics Tools**: Physics constants lookup and force calculator

## Technical Implementation

### Backend Architecture

The backend is built with TypeScript and follows a modular design pattern:

- **Base Agent**: Abstract class that defines common agent functionality
- **Specialized Agents**: Extend the base agent with domain-specific capabilities
- **Agent Orchestrator**: Coordinates between agents and manages the routing logic
- **Tools**: Modular components that provide computational capabilities

### Frontend Interface

The frontend is built with Next.js and React, featuring:

- **Chat Interface**: Modern chat UI with message bubbles and typing indicators
- **Agent Identification**: Visual cues to identify which agent is responding
- **Equation Display**: Specialized formatting for mathematical equations
- **Tool Usage Transparency**: Clear indication of which tools were used in responses

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Google AI API key (for Gemini model access)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/agentic-tutor.git
   cd agentic-tutor
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   ```
   # Create a .env file with the following
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Examples

### Mathematics Questions

- "Solve the equation 3x + 5 = 20"
- "What is the derivative of f(x) = x² + 3x - 2?"
- "Calculate the area of a circle with radius 5cm"

### Physics Questions

- "What is the value of the gravitational constant G?"
- "Calculate the force needed to accelerate a 2kg mass at 5 m/s²"
- "Explain Newton's laws of motion"

## System Components

### Agent Classes

- **BaseAgent**: Provides core functionality for all agents
- **TutorAgent**: General educational assistant and coordinator
- **MathAgent**: Specialized for mathematics topics
- **PhysicsAgent**: Specialized for physics concepts

### Tools

- **mathTools**: Calculator and equation solver
- **physicsTools**: Constants lookup and force calculator

### Services

- **AgentOrchestrator**: Manages the multi-agent workflow

## Architecture Diagram

```
┌─────────────────┐     ┌──────────────────┐
│                 │     │                  │
│   User Input    │────▶│  API Endpoint    │
│                 │     │                  │
└─────────────────┘     └────────┬─────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │     Agent       │
                        │  Orchestrator   │
                        │                 │
                        └───┬───────┬─────┘
                            │       │
               ┌────────────┘       └───────────┐
               │                                │
               ▼                                ▼
     ┌─────────────────┐               ┌─────────────────┐
     │                 │               │                 │
     │   Math Agent    │               │ Physics Agent   │
     │                 │               │                 │
     └────────┬────────┘               └────────┬────────┘
              │                                 │
              ▼                                 ▼
     ┌─────────────────┐               ┌─────────────────┐
     │                 │               │                 │
     │   Math Tools    │               │  Physics Tools  │
     │                 │               │                 │
     └─────────────────┘               └─────────────────┘
```

## Future Enhancements

- **Additional Specialist Agents**: Chemistry, Biology, Computer Science
- **Enhanced Tool Integration**: Graph plotting, molecular visualization
- **Personalized Learning Paths**: Adaptive learning based on user progress
- **Multi-modal Responses**: Integration of images and interactive diagrams
- **Collaborative Learning**: Multi-user sessions for group learning

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Google Generative AI for the Gemini model
- Next.js team for the frontend framework
- Contributors and testers who helped refine the system
