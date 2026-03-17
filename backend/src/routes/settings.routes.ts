import { Router } from 'express';
import { z } from 'zod';
import { LLMProviderFactory, LLMSettingsManager, LLMConfig } from '../llm/providers.strategy';
import { getGreenhouseApiKey, setGreenhouseApiKey } from '../store/settings.store';
import { getGreenhouseService } from '../services/greenhouse.factory';

const router = Router();

/**
 * Get Greenhouse API key status (masked)
 * GET /api/settings/greenhouse
 */
router.get('/greenhouse', (req, res) => {
  const key = getGreenhouseApiKey();
  res.json({
    success: true,
    data: {
      configured: !!key,
      masked: key ? '***' + key.slice(-4) : undefined,
    },
  });
});

/**
 * Save Greenhouse API key
 * POST /api/settings/greenhouse
 */
router.post('/greenhouse', (req, res) => {
  const { apiKey } = req.body || {};
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    return res.status(400).json({ success: false, error: 'API key is required' });
  }
  setGreenhouseApiKey(apiKey.trim());
  res.json({
    success: true,
    message: 'Greenhouse API key saved',
    data: { masked: '***' + apiKey.slice(-4) },
  });
});

/**
 * Test Greenhouse connection
 * POST /api/settings/greenhouse/test
 */
router.post('/greenhouse/test', async (req, res) => {
  const { apiKey } = req.body || {};
  const key = apiKey ? String(apiKey).trim() : getGreenhouseApiKey();
  if (!key) {
    return res.status(400).json({
      success: false,
      error: 'Add your Greenhouse API key first',
    });
  }
  try {
    const GreenhouseService = (await import('../services/greenhouse.service')).default;
    const greenhouse = new GreenhouseService(key);
    const ok = await greenhouse.testConnection();
    res.json({
      success: ok,
      message: ok ? 'Greenhouse connected' : 'Connection failed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    });
  }
});

/**
 * Get available LLM providers
 * GET /api/settings/llm/providers
 */
router.get('/llm/providers', (req, res) => {
  try {
    const providers = LLMProviderFactory.getAvailableProviders();
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch providers' });
  }
});

/**
 * Get current LLM settings
 * GET /api/settings/llm
 */
router.get('/llm', (req, res) => {
  try {
    const settings = LLMSettingsManager.getSettings();
    
    // Don't send full API key to frontend
    const sanitized = {
      ...settings,
      apiKey: settings.apiKey ? '***' + settings.apiKey.slice(-4) : undefined
    };
    
    res.json({
      success: true,
      data: sanitized
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

/**
 * Update LLM settings
 * POST /api/settings/llm
 */
const updateSettingsSchema = z.object({
  provider: z.enum(['openai', 'gemini', 'claude', 'groq', 'ollama']),
  model: z.string(),
  apiKey: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().optional(),
});

router.post('/llm', async (req, res) => {
  try {
    const validated = updateSettingsSchema.parse(req.body);
    
    // In production, save to user's database record
    // For now, just validate and send back
    LLMSettingsManager.saveSettings(validated as LLMConfig);
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        ...validated,
        apiKey: validated.apiKey ? '***' + validated.apiKey.slice(-4) : undefined
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

/**
 * Test LLM connection
 * POST /api/settings/llm/test
 */
router.post('/llm/test', async (req, res) => {
  try {
    const validated = updateSettingsSchema.parse(req.body);
    
    console.log('🧪 Testing LLM connection...');
    const success = await LLMSettingsManager.testConnection(validated as LLMConfig);
    
    if (success) {
      res.json({
        success: true,
        message: 'Connection successful! LLM is working.'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Connection failed. Check your API key and model.'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Error testing connection:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get models for a specific provider
 * GET /api/settings/llm/providers/:provider/models
 */
router.get('/llm/providers/:provider/models', (req, res) => {
  try {
    const { provider } = req.params;
    const providers = LLMProviderFactory.getAvailableProviders();
    
    const providerData = providers.find(p => p.id === provider);
    
    if (!providerData) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    
    res.json({
      success: true,
      data: {
        provider: provider,
        models: providerData.models
      }
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch models' });
  }
});

export default router;
