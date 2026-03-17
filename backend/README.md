# 🤖 AI Coding Tutor - Learning AI Agent Building

An interactive coding platform where AI agents provide personalized feedback on LeetCode-style problems. Built with TypeScript, this project teaches you how to build multi-step AI agent systems.

## 🎯 What You'll Learn

### 1. **AI Agent Fundamentals**
- **State Management**: How agents maintain context across interactions
- **Agent Graphs**: Building workflows with multiple decision points
- **LangChain/LangGraph**: Industry-standard tools for agent orchestration
- **Prompt Engineering**: Crafting effective prompts for different agent roles

### 2. **Agent Architecture Patterns**
- **Analyzer Agent**: Code review and quality assessment
- **Feedback Agent**: Adaptive communication based on user level
- **Multi-step Reasoning**: Breaking complex tasks into discrete steps
- **Decision Logic**: Teaching agents to "think" about next actions

### 3. **TypeScript Best Practices**
- Type-safe agent state management
- Zod validation for API inputs
- Drizzle ORM for type-safe database operations

## 🏗️ Architecture Overview

```
┌─────────────┐
│   User      │
│  Submits    │
│   Code      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│     Tutor Agent Graph (LangGraph)   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  1. Code Analyzer Agent     │   │
│  │     - Analyzes correctness  │   │
│  │     - Measures complexity   │   │
│  │     - Detects patterns      │   │
│  └───────────┬─────────────────┘   │
│              │                      │
│              ▼                      │
│  ┌─────────────────────────────┐   │
│  │  2. Feedback Agent          │   │
│  │     - Generates messages    │   │
│  │     - Adapts to user level  │   │
│  │     - Decides next step     │   │
│  └───────────┬─────────────────┘   │
│              │                      │
│              ▼                      │
│  ┌─────────────────────────────┐   │
│  │  3. Action Executor         │   │
│  │     - Gives hints           │   │
│  │     - Explains concepts     │   │
│  │     - Suggests next problem │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Database   │
│  - Problems │
│  - Progress │
│  - Feedback │
└─────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY and DATABASE_URL
```

3. **Set up database**
```bash
# Create database
createdb ai_coding_tutor

# Run migrations
npm run db:push

# Seed with sample problems
npm run seed
```

4. **Start development server**
```bash
npm run dev
```

Server will start at `http://localhost:3001`

## 📚 Key Learning Files

### Agent System (Most Important!)

1. **`src/agents/types.ts`**
   - Learn: How to structure agent state
   - Concept: State machines and data flow

2. **`src/agents/code-analyzer.agent.ts`**
   - Learn: Creating specialized agent nodes
   - Concept: Single-responsibility agents
   - Key Pattern: Structured LLM outputs with JSON

3. **`src/agents/feedback.agent.ts`**
   - Learn: Adaptive agent behavior
   - Concept: User-level personalization
   - Key Pattern: Decision logic and branching

4. **`src/agents/tutor-agent.graph.ts`**
   - Learn: Orchestrating multi-step workflows
   - Concept: Agent graphs and state transitions
   - Key Pattern: LangGraph workflow definition

### API Layer

5. **`src/routes/submissions.routes.ts`**
   - Learn: Integrating agents with REST APIs
   - See how agent results are persisted

## 🧪 Testing the Agent

### 1. Submit Code
```bash
curl -X POST http://localhost:3001/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "problemId": "<problem-id>",
    "code": "function twoSum(nums, target) { ... }",
    "language": "javascript",
    "userLevel": "beginner"
  }'
```

### 2. Watch Agent Workflow
Check console output to see:
- 🔍 Code analysis step
- 💬 Feedback generation
- 🎯 Next action decision

## 🎓 Learning Exercises

### Exercise 1: Add a Hint Agent
Create a new agent node that provides progressive hints.

**File to create**: `src/agents/hint.agent.ts`

**What to learn**: 
- How to add nodes to the graph
- Conditional edge routing
- Context-aware hint generation

### Exercise 2: Implement Test Execution
Add a node that actually runs code against test cases.

**Files to modify**: 
- Add `TestExecutor` class
- Update `tutor-agent.graph.ts` to include execution step

**What to learn**:
- Safe code execution
- Test result parsing
- Error handling in agents

### Exercise 3: Add Conversational Memory
Make the agent remember previous conversations.

**What to learn**:
- Message history management
- Context window optimization
- Stateful conversations

### Exercise 4: Progressive Difficulty
Implement an agent that adjusts problem difficulty based on performance.

**What to learn**:
- User modeling
- Performance tracking
- Recommendation systems

## 📖 AI Agent Concepts Explained

### What is an Agent?
An **agent** is an AI system that can:
1. **Perceive** its environment (read inputs)
2. **Reason** about what to do (make decisions)
3. **Act** on its decisions (take actions)
4. **Learn** from outcomes (improve over time)

### What is LangGraph?
**LangGraph** is a framework for building **stateful, multi-step agent workflows**. Think of it as a state machine where:
- **Nodes** = Agent steps (analyze, feedback, execute)
- **Edges** = Transitions between steps
- **State** = Shared context flowing through the graph

### Why Use Agents for Code Review?
Traditional approaches:
- ❌ Single LLM call = Limited reasoning
- ❌ Monolithic prompt = Hard to maintain
- ❌ No adaptability = Same feedback for everyone

Agent approach:
- ✅ Multi-step reasoning = Better analysis
- ✅ Specialized agents = Clear responsibilities
- ✅ Adaptive behavior = Personalized learning

## 🔧 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Run production build
npm run seed       # Populate database with sample problems
npm run db:push    # Push schema changes to database
npm run db:studio  # Open Drizzle Studio (database GUI)
```

## 🗃️ Database Schema

### Problems
- Problem metadata (title, description, difficulty)
- Test cases (visible and hidden)
- Hints for different skill levels
- Educational concepts

### Submissions
- User's code and language
- Analysis results (correctness, complexity)
- AI-generated feedback
- Quality scores

### User Progress
- Skill level tracking
- Category strengths
- Recommended learning path
- Achievements

### Conversations
- Chat history with agent
- Agent state for resuming
- Submission context

## 🎯 Next Steps to Build On

1. **Add More Agent Types**
   - Concept Explainer Agent
   - Pattern Recognition Agent
   - Optimization Suggestion Agent

2. **Enhance Agent Capabilities**
   - Code execution sandbox
   - Real-time feedback during typing
   - Voice interaction

3. **Add Learning Features**
   - Spaced repetition system
   - Knowledge graphs
   - Peer comparison (anonymized)

4. **Scale the System**
   - Agent result caching
   - Parallel agent execution
   - Streaming responses

## 📚 Recommended Reading

### AI Agents
- [LangChain Documentation](https://docs.langchain.com/)
- [LangGraph Tutorials](https://langchain-ai.github.io/langgraph/)
- [Anthropic's Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)

### Agent Patterns
- ReAct Pattern (Reasoning + Acting)
- Chain-of-Thought Prompting
- Multi-Agent Systems

### TypeScript & APIs
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Zod Validation](https://zod.dev/)

## 🤝 Contributing Ideas

Want to extend this project? Try:
- Add new problem categories
- Implement different agent strategies
- Create visualization of agent reasoning
- Build a frontend (React/Next.js)

## 📝 License

MIT - Feel free to use this for learning!

---

## 💡 Tips for Learning

1. **Start with the Agent Graph**: Read `tutor-agent.graph.ts` first
2. **Follow the State**: Track how `AgentState` changes through nodes
3. **Experiment**: Modify prompts and see how agent behavior changes
4. **Add Logging**: Print state at each node to understand flow
5. **Build Incrementally**: Start simple, add complexity gradually

Happy learning! 🚀
