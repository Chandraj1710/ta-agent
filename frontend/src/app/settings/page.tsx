'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, Brain, Check, X, Loader, Zap, DollarSign, 
  Globe, Lock, ArrowLeft, Briefcase
} from 'lucide-react';

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/settings/llm/providers`
      );
      const data = await response.json();
      if (data.success) {
        setProviders(data.data);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchCurrentSettings = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/settings/llm`
      );
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
    const provider = providers.find(p => p.id === providerId);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0]);
    }
    setTestResult(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/settings/llm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: selectedProvider,
            model: selectedModel,
            apiKey: apiKey || undefined,
            temperature
          })
        }
      );

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/settings/llm/test`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: selectedProvider,
            model: selectedModel,
            apiKey: apiKey || undefined,
            temperature
          })
        }
      );

      const data = await response.json();
      setTestResult(data.success ? 'success' : 'error');
      
      if (data.success) {
        setTimeout(() => setTestResult(null), 3000);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const selectedProviderData = providers.find(p => p.id === selectedProvider);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Settings className="w-8 h-8 text-blue-600" />
                  LLM Settings
                </h1>
                <p className="text-gray-600 mt-1">Choose your AI provider and configure settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Greenhouse API Key - Required for data */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            Greenhouse API Key
            {greenhouseConfigured && (
              <span className="text-sm font-normal text-green-600">(configured)</span>
            )}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Required for jobs, alerts, and all TA modules. Get your key from Greenhouse: Configure → Dev Center → API Credential Management.
          </p>
          <div className="flex gap-4">
            <input
              type="password"
              value={greenhouseApiKey}
              onChange={(e) => setGreenhouseApiKey(e.target.value)}
              placeholder="Enter your Greenhouse API key"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={handleTestGreenhouse}
              disabled={greenhouseTesting || !greenhouseApiKey.trim()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              {greenhouseTesting ? <Loader className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
              Test
            </button>
            <button
              onClick={handleSaveGreenhouse}
              disabled={greenhouseSaving || !greenhouseApiKey.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {greenhouseSaving ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Save
            </button>
          </div>
          {greenhouseTestResult && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              greenhouseTestResult === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {greenhouseTestResult === 'success' ? (
                <><Check className="w-5 h-5" /> Greenhouse connected!</>
              ) : (
                <><X className="w-5 h-5" /> Connection failed. Check your API key.</>
              )}
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-medium">Multiple LLM Support</p>
              <p className="text-sm text-blue-700 mt-1">
                Choose between paid (OpenAI) and free options (Gemini, Groq, Ollama) based on your needs!
              </p>
            </div>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select AI Provider</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProviderChange(provider.id)}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  selectedProvider === provider.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{provider.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{provider.pricing}</p>
                  </div>
                  {provider.freeOption && (
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                      FREE
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-600">{provider.speed}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Brain className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-600">{provider.quality}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Model Selection */}
          {selectedProviderData && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {selectedProviderData.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* API Key Input */}
          {selectedProviderData?.requiresApiKey && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                API Key
                {selectedProviderData.freeOption && (
                  <span className="text-green-600 text-xs">(Free tier available)</span>
                )}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your API key from: 
                {selectedProvider === 'openai' && ' platform.openai.com'}
                {selectedProvider === 'gemini' && ' makersuite.google.com/app/apikey'}
                {selectedProvider === 'claude' && ' console.anthropic.com'}
                {selectedProvider === 'groq' && ' console.groq.com'}
              </p>
            </div>
          )}

          {/* Temperature Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature: {temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>More Consistent</span>
              <span>More Creative</span>
            </div>
          </div>
        </div>

        {/* Current Settings */}
        {currentSettings && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Current Active Settings:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Provider: <span className="font-medium">{currentSettings.provider}</span></p>
              <p>• Model: <span className="font-medium">{currentSettings.model}</span></p>
              <p>• Temperature: <span className="font-medium">{currentSettings.temperature}</span></p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleTest}
            disabled={testing || !selectedProvider || (selectedProviderData?.requiresApiKey && !apiKey)}
            className="flex-1 bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <Loader className="animate-spin w-5 h-5" />
                Testing...
              </>
            ) : (
              <>
                <Globe className="w-5 h-5" />
                Test Connection
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !selectedProvider || (selectedProviderData?.requiresApiKey && !apiKey)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader className="animate-spin w-5 h-5" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Settings
              </>
            )}
          </button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
            testResult === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {testResult === 'success' ? (
              <>
                <Check className="w-5 h-5" />
                <span className="font-medium">✅ Connection successful! LLM is working perfectly.</span>
              </>
            ) : (
              <>
                <X className="w-5 h-5" />
                <span className="font-medium">❌ Connection failed. Check your API key and try again.</span>
              </>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-4">💡 Quick Guide</h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-gray-800">Free Options:</h4>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li><strong>Google Gemini</strong>: Free tier, excellent quality</li>
                <li><strong>Groq</strong>: Free, very fast responses</li>
                <li><strong>Ollama</strong>: Run locally, completely free (requires installation)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800">Paid Options:</h4>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li><strong>OpenAI GPT-4</strong>: Best quality, moderate cost</li>
                <li><strong>Anthropic Claude</strong>: Excellent quality, free tier available</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800">Temperature Guide:</h4>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li><strong>0.0 - 0.3</strong>: Consistent, factual responses (good for code analysis)</li>
                <li><strong>0.4 - 0.7</strong>: Balanced (recommended)</li>
                <li><strong>0.8 - 2.0</strong>: Creative, varied responses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
