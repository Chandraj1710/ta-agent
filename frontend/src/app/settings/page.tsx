'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings,
  Brain,
  Check,
  X,
  Loader,
  Zap,
  ArrowLeft,
  Briefcase,
  Globe,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

interface Provider {
  id: string;
  name: string;
  models: string[];
  pricing: string;
  speed: string;
  quality: string;
  requiresApiKey: boolean;
  freeOption: boolean;
}

/** Fallback when backend is unavailable - allows selecting models offline */
const DEFAULT_PROVIDERS: Provider[] = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'], pricing: 'Paid', speed: 'Medium', quality: 'Excellent', requiresApiKey: true, freeOption: false },
  { id: 'gemini', name: 'Google Gemini', models: ['gemini-pro', 'gemini-pro-vision'], pricing: 'Free tier available', speed: 'Fast', quality: 'Excellent', requiresApiKey: true, freeOption: true },
  { id: 'claude', name: 'Anthropic Claude', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'], pricing: 'Free tier available', speed: 'Fast', quality: 'Excellent', requiresApiKey: true, freeOption: true },
  { id: 'groq', name: 'Groq', models: ['mixtral-8x7b', 'llama2-70b'], pricing: 'Free', speed: 'Very Fast', quality: 'Good', requiresApiKey: true, freeOption: true },
  { id: 'ollama', name: 'Ollama (Local)', models: ['llama2', 'mistral', 'codellama'], pricing: 'Free (Local)', speed: 'Depends on hardware', quality: 'Good', requiresApiKey: false, freeOption: true },
];

interface LLMSettings {
  provider: string;
  model: string;
  apiKey?: string;
  temperature: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>(DEFAULT_PROVIDERS);
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4-turbo-preview');
  const [apiKey, setApiKey] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [greenhouseApiKey, setGreenhouseApiKey] = useState<string>('');
  const [greenhouseConfigured, setGreenhouseConfigured] = useState(false);
  const [greenhouseMasked, setGreenhouseMasked] = useState<string>('');
  const [greenhouseSaving, setGreenhouseSaving] = useState(false);
  const [greenhouseTesting, setGreenhouseTesting] = useState(false);
  const [greenhouseTestResult, setGreenhouseTestResult] = useState<'success' | 'error' | null>(null);
  const [greenhouseErrorMsg, setGreenhouseErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [currentSettings, setCurrentSettings] = useState<LLMSettings | null>(null);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const modelSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProviders();
    fetchGreenhouseStatus();
    setLoading(false);

    api.getSettingsLlm().then((data) => {
      if (data.success && data.data) {
        const d = data.data;
        const settings: LLMSettings = {
          provider: d.provider ?? 'openai',
          model: d.model ?? 'gpt-4-turbo-preview',
          apiKey: d.apiKey,
          temperature: d.temperature ?? 0.7,
        };
        setCurrentSettings(settings);
        setSelectedProvider(settings.provider);
        setSelectedModel(settings.model);
        setTemperature(settings.temperature);
      }
    });
  }, []);

  const fetchGreenhouseStatus = async () => {
    try {
      const data = await api.getSettingsGreenhouse();
      if (data.success && data.data) {
        if (data.data.configured) setGreenhouseConfigured(true);
        if (data.data.masked) setGreenhouseMasked(data.data.masked);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveGreenhouse = async () => {
    if (!greenhouseApiKey.trim()) return;
    setGreenhouseSaving(true);
    setGreenhouseTestResult(null);
    try {
      const data = (await api.postSettingsGreenhouse({ apiKey: greenhouseApiKey.trim() })) as {
        success: boolean;
        data?: { masked?: string };
        error?: string;
      };
      if (data.success) {
        setGreenhouseConfigured(true);
        if (data.data?.masked) setGreenhouseMasked(data.data.masked);
        setGreenhouseApiKey('');
      } else {
        alert('❌ Failed to save: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert('❌ Error saving');
    } finally {
      setGreenhouseSaving(false);
    }
  };

  const handleTestGreenhouse = async () => {
    const key = greenhouseApiKey.trim();
    if (!key && !greenhouseConfigured) {
      alert('Enter your Greenhouse API key first');
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    setGreenhouseTesting(true);
    setGreenhouseTestResult(null);
    setGreenhouseErrorMsg('');
    try {
      const data = (await api.postSettingsGreenhouseTest(key ? { apiKey: key } : { apiKey: '' })) as {
        success: boolean;
        error?: string;
        message?: string;
      };
      setGreenhouseTestResult(data.success ? 'success' : 'error');
      setGreenhouseErrorMsg(data.error || data.message || '');
      if (data.success) {
        setGreenhouseConfigured(true);
        setGreenhouseMasked(key.length >= 4 ? '***' + key.slice(-4) : '***');
        setTimeout(() => {
          setGreenhouseTestResult(null);
          setGreenhouseErrorMsg('');
        }, 3000);
      }
    } catch (e) {
      console.error(e);
      setGreenhouseTestResult('error');
      const errMsg = e instanceof Error ? e.message : 'Network or request failed';
      setGreenhouseErrorMsg(errMsg.includes('fetch') || errMsg.includes('Failed') ? `${errMsg} (Is backend running on ${apiUrl}?)` : errMsg);
    } finally {
      setGreenhouseTesting(false);
    }
  };

  const fetchProviders = async () => {
    try {
      setProvidersError(null);
      const data = await api.getSettingsProviders();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setProviders(data.data as Provider[]);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProvidersError('Backend offline — you can still choose providers. Save/Test will work when backend is running.');
    }
  };

  const fetchCurrentSettings = async () => {
    try {
      const data = await api.getSettingsLlm();
      if (data.success && data.data) {
        const d = data.data;
        const settings: LLMSettings = {
          provider: d.provider ?? 'openai',
          model: d.model ?? 'gpt-4-turbo-preview',
          apiKey: d.apiKey,
          temperature: d.temperature ?? 0.7,
        };
        setCurrentSettings(settings);
        setSelectedProvider(settings.provider);
        setSelectedModel(settings.model);
        setTemperature(settings.temperature);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = providers.find((p) => p.id === providerId);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0]);
    }
    setTestResult(null);
    // Scroll model section into view
    setTimeout(() => modelSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  };

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      const data = await api.postSettingsLlm({
        provider: selectedProvider,
        model: selectedModel,
        apiKey: apiKey || undefined,
        temperature,
      });
      if (data.success) {
        alert('✅ Settings saved successfully!');
        await fetchCurrentSettings();
      } else {
        alert('❌ Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const data = await api.postSettingsLlmTest({
        provider: selectedProvider,
        model: selectedModel,
        apiKey: apiKey || undefined,
        temperature,
      });
      setTestResult(data.success ? 'success' : 'error');
      if (data.success) setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const selectedProviderData = providers.find((p) => p.id === selectedProvider);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gradient-to-b from-slate-50/80 to-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-slate-50/80 to-background dark:from-slate-950/80 dark:to-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="-ml-2 mb-6 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Settings
              </h1>
              <p className="mt-1 text-muted-foreground">{'LLM provider & Greenhouse API configuration'}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="space-y-6"
        >
          {/* LLM Provider Selection - First so it's immediately visible */}
          <Card className="overflow-hidden border-0 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 transition-all duration-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle>Select AI Provider</CardTitle>
              <CardDescription>Choose your preferred LLM provider and model. Click a card to select.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {providersError && (
                <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800">
                  {providersError}
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchProviders()}>
                    Retry
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {providers.map((provider) => {
                  const isSelected = selectedProvider === provider.id;
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => handleProviderChange(provider.id)}
                      className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{provider.name}</h3>
                          <p className="text-sm text-muted-foreground">{provider.pricing}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                          )}
                          {provider.freeOption && (
                            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              FREE
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" /> {provider.speed}
                        </span>
                        <span className="flex items-center gap-1">
                          <Brain className="h-3 w-3" /> {provider.quality}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedProviderData && (
                <div ref={modelSectionRef} className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {selectedProviderData.models.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedProviderData.requiresApiKey && (
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                        <Lock className="h-4 w-4" />
                        API Key
                        {selectedProviderData.freeOption && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">(Free tier available)</span>
                        )}
                      </label>
                      <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                        className="transition-all duration-200 focus:ring-2"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Get your API key from:{' '}
                        {selectedProvider === 'openai' && 'platform.openai.com'}
                        {selectedProvider === 'gemini' && 'makersuite.google.com/app/apikey'}
                        {selectedProvider === 'claude' && 'console.anthropic.com'}
                        {selectedProvider === 'groq' && 'console.groq.com'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Temperature: {temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                    />
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>More Consistent</span>
                      <span>More Creative</span>
                    </div>
                  </div>
                </div>
              )}

              {currentSettings && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <h3 className="mb-2 font-medium text-foreground">Current Active Settings</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Provider: <span className="font-medium text-foreground">{currentSettings.provider}</span></p>
                    <p>Model: <span className="font-medium text-foreground">{currentSettings.model}</span></p>
                    <p>Temperature: <span className="font-medium text-foreground">{currentSettings.temperature}</span></p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleTest}
                  disabled={testing || !selectedProvider || (selectedProviderData?.requiresApiKey && !apiKey)}
                  className="flex-1 gap-2 transition-all duration-200 hover:scale-[1.02]"
                >
                  {testing ? <Loader className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  Test Connection
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !selectedProvider || (selectedProviderData?.requiresApiKey && !apiKey)}
                  className="flex-1 gap-2 transition-all duration-200 hover:scale-[1.02]"
                >
                  {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save Settings
                </Button>
              </div>

              {testResult && (
                <div
                  className={`flex items-center gap-3 rounded-lg p-4 ${
                    testResult === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {testResult === 'success' ? (
                    <><Check className="h-5 w-5" /> Connection successful! LLM is working perfectly.</>
                  ) : (
                    <><X className="h-5 w-5" /> Connection failed. Check your API key and try again.</>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* LLM Info Banner */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-start gap-3 pt-6">
              <Brain className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">Multiple LLM Support</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose between paid (OpenAI) and free options (Gemini, Groq, Ollama) based on your needs!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Greenhouse API */}
          <Card className="overflow-hidden border-0 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 transition-all duration-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Greenhouse API Key
                {greenhouseConfigured && (
                  <Badge variant="outline" className="ml-2 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    Configured {greenhouseMasked && `(${greenhouseMasked})`}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Required for jobs, alerts, and all TA modules. Get your key from Greenhouse: Configure → Dev Center → API Credential Management.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  type="password"
                  value={greenhouseApiKey}
                  onChange={(e) => setGreenhouseApiKey(e.target.value)}
                  placeholder={greenhouseConfigured ? 'Enter new key to replace' : 'Enter your Greenhouse API key'}
                  className="flex-1 transition-all duration-200 focus:ring-2"
                />
                <Button
                  variant="outline"
                  onClick={handleTestGreenhouse}
                  disabled={greenhouseTesting || (!greenhouseApiKey.trim() && !greenhouseConfigured)}
                  className="gap-2 transition-all duration-200 hover:scale-[1.02]"
                >
                  {greenhouseTesting ? <Loader className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  Test
                </Button>
                <Button
                  onClick={handleSaveGreenhouse}
                  disabled={greenhouseSaving || !greenhouseApiKey.trim()}
                  className="gap-2 transition-all duration-200 hover:scale-[1.02]"
                >
                  {greenhouseSaving ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save
                </Button>
              </div>
              {greenhouseTestResult && (
                <div
                  className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                    greenhouseTestResult === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {greenhouseTestResult === 'success' ? (
                    <><Check className="h-4 w-4" /> Greenhouse connected!</>
                  ) : (
                    <><X className="h-4 w-4" /> Connection failed. {greenhouseErrorMsg || 'Check your API key.'}</>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Guide */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Quick Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-foreground">Free Options</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li><strong>Google Gemini</strong>: Free tier, excellent quality</li>
                  <li><strong>Groq</strong>: Free, very fast responses</li>
                  <li><strong>Ollama</strong>: Run locally, completely free</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Paid Options</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li><strong>OpenAI GPT-4</strong>: Best quality, moderate cost</li>
                  <li><strong>Anthropic Claude</strong>: Excellent quality, free tier available</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Temperature Guide</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li><strong>0.0 - 0.3</strong>: Consistent, factual responses</li>
                  <li><strong>0.4 - 0.7</strong>: Balanced (recommended)</li>
                  <li><strong>0.8 - 2.0</strong>: Creative, varied responses</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
