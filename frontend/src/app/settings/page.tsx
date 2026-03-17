'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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

interface LLMSettings {
  provider: string;
  model: string;
  apiKey?: string;
  temperature: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [greenhouseApiKey, setGreenhouseApiKey] = useState<string>('');
  const [greenhouseConfigured, setGreenhouseConfigured] = useState(false);
  const [greenhouseSaving, setGreenhouseSaving] = useState(false);
  const [greenhouseTesting, setGreenhouseTesting] = useState(false);
  const [greenhouseTestResult, setGreenhouseTestResult] = useState<'success' | 'error' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [currentSettings, setCurrentSettings] = useState<LLMSettings | null>(null);

  useEffect(() => {
    fetchProviders();
    fetchCurrentSettings();
    fetchGreenhouseStatus();
  }, []);

  const fetchGreenhouseStatus = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/greenhouse`);
      const data = await res.json();
      if (data.success && data.data?.configured) setGreenhouseConfigured(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveGreenhouse = async () => {
    if (!greenhouseApiKey.trim()) return;
    setGreenhouseSaving(true);
    setGreenhouseTestResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/greenhouse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: greenhouseApiKey.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setGreenhouseConfigured(true);
        alert('✅ Greenhouse API key saved! You can now refresh alerts on the dashboard.');
      } else {
        alert('❌ Failed to save');
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
    if (!key) {
      alert('Enter your Greenhouse API key first');
      return;
    }
    setGreenhouseTesting(true);
    setGreenhouseTestResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/greenhouse/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      });
      const data = await res.json();
      setGreenhouseTestResult(data.success ? 'success' : 'error');
      if (data.success) {
        setGreenhouseConfigured(true);
        setTimeout(() => setGreenhouseTestResult(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setGreenhouseTestResult('error');
    } finally {
      setGreenhouseTesting(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/llm/providers`);
      const data = await response.json();
      if (data.success) setProviders(data.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchCurrentSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/llm`);
      const data = await response.json();
      if (data.success) {
        setCurrentSettings(data.data);
        setSelectedProvider(data.data.provider);
        setSelectedModel(data.data.model);
        setTemperature(data.data.temperature || 0.7);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = providers.find((p) => p.id === providerId);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0]);
    }
    setTestResult(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
          apiKey: apiKey || undefined,
          temperature,
        }),
      });
      const data = await response.json();
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/llm/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
          apiKey: apiKey || undefined,
          temperature,
        }),
      });
      const data = await response.json();
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
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-b from-slate-50/80 to-background">
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
          {/* Greenhouse API */}
          <Card className="overflow-hidden border-0 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Greenhouse API Key
                {greenhouseConfigured && (
                  <Badge variant="outline" className="ml-2 border-emerald-300 bg-emerald-50 text-emerald-700">
                    Configured
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
                  placeholder="Enter your Greenhouse API key"
                  className="flex-1 transition-all duration-200 focus:ring-2"
                />
                <Button
                  variant="outline"
                  onClick={handleTestGreenhouse}
                  disabled={greenhouseTesting || !greenhouseApiKey.trim()}
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
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {greenhouseTestResult === 'success' ? (
                    <><Check className="h-4 w-4" /> Greenhouse connected!</>
                  ) : (
                    <><X className="h-4 w-4" /> Connection failed. Check your API key.</>
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

          {/* Provider Selection */}
          <Card className="overflow-hidden border-0 shadow-lg shadow-slate-200/50 transition-all duration-300 hover:shadow-xl">
            <CardHeader>
              <CardTitle>Select AI Provider</CardTitle>
              <CardDescription>Choose your preferred LLM provider and model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleProviderChange(provider.id)}
                    className={`flex flex-col rounded-xl border-2 p-4 text-left transition-all duration-200 hover:scale-[1.01] ${
                      selectedProvider === provider.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground">{provider.pricing}</p>
                      </div>
                      {provider.freeOption && (
                        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
                          FREE
                        </Badge>
                      )}
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
                ))}
              </div>

              {selectedProviderData && (
                <>
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
                          <span className="text-xs text-emerald-600">(Free tier available)</span>
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
                </>
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
                      ? 'bg-emerald-50 text-emerald-800'
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
