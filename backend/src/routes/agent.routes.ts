/**
 * Agent query route - natural language task completion using TA agents + LLM
 */

import { Router } from 'express';
import { createTAAgent } from '../agents/ta-agent.graph';
import { LLMProviderFactory, LLMSettingsManager } from '../llm/providers.strategy';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const router = Router();

function buildContext(state: {
  jobs: Array<{ id: number; title: string }>;
  applications: Array<{ id: number; candidateName?: string; jobTitle?: string; stageName?: string; sourceName?: string }>;
  alerts: Array<{ type: string; severity: string; payload: Record<string, unknown> }>;
}): string {
  const byType = { stalled: 0, scorecard: 0, referral: 0 };
  for (const a of state.alerts) {
    if (a.type in byType) byType[a.type as keyof typeof byType]++;
  }
  const sampleAlerts = state.alerts.slice(0, 15).map((a) => ({
    type: a.type,
    ...a.payload,
  }));
  return JSON.stringify(
    {
      summary: {
        totalJobs: state.jobs.length,
        totalApplications: state.applications.length,
        alertsByType: byType,
      },
      sampleAlerts,
      sampleApplications: state.applications.slice(0, 10).map((a) => ({
        candidate: a.candidateName,
        job: a.jobTitle,
        stage: a.stageName,
        source: a.sourceName,
      })),
    },
    null,
    2
  );
}

router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
        hint: 'Send { "query": "your question or task here" }',
      });
    }

    const { hasGreenhouseApiKey } = await import('../store/settings.store');
    if (!hasGreenhouseApiKey()) {
      return res.status(400).json({
        success: false,
        error: 'Greenhouse API key is not configured',
        hint: 'Add GREENHOUSE_API_KEY to backend/.env or save via Settings',
      });
    }

    const agent = createTAAgent();
    const state = await agent.run();
    const context = buildContext(state);

    const settings = LLMSettingsManager.getSettings();
    if (!settings.apiKey) {
      return res.status(400).json({
        success: false,
        error: 'LLM is not configured',
        hint: 'Set your LLM API key in Settings (e.g. GEMINI_API_KEY for Gemini)',
      });
    }

    const llm = LLMProviderFactory.create(settings);
    if (!llm.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'LLM API key is missing',
        hint: 'Configure your LLM provider in Settings',
      });
    }

    const systemPrompt = `You are a Talent Acquisition (TA) assistant. You help recruiters with pipeline alerts, referrals, stalled candidates, and scorecard accountability.

You have access to pipeline data from Greenhouse. Use the context below to answer the user's question. Be concise and actionable. If they ask for specific data (e.g. referrals, stalled pipeline), summarize what's in the data. If the data is empty for what they asked, say so clearly.`;

    const userPrompt = `User question: ${query.trim()}

Pipeline data (JSON):
${context}

Answer the user's question based on the data above. Be helpful and specific.`;

    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    res.json({
      success: true,
      text: response.content,
      alerts: state.alerts,
      summary: {
        stalled: state.alerts.filter((a) => a.type === 'stalled').length,
        scorecard: state.alerts.filter((a) => a.type === 'scorecard').length,
        referral: state.alerts.filter((a) => a.type === 'referral').length,
      },
    });
  } catch (error) {
    console.error('[Agent] Query failed:', error);
    res.status(500).json({
      success: false,
      error: 'Query failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
