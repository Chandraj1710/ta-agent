/**
 * LLM Provider Strategy Pattern
 * 
 * This allows users to choose between different LLM providers:
 * - OpenAI (GPT-4, GPT-3.5) - Paid
 * - Google Gemini - Free tier available
 * - Anthropic Claude - Free tier available
 * - Groq - Free and fast
 * - Ollama - Fully local and free
 */

import { BaseMessage } from "@langchain/core/messages";

export interface LLMConfig {
  provider: 'openai' | 'gemini' | 'claude' | 'groq' | 'ollama';
  model: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Base Strategy Interface
 */
export interface ILLMProvider {
  invoke(messages: BaseMessage[]): Promise<LLMResponse>;
  getProviderName(): string;
  isConfigured(): boolean;
}

/**
 * LLM Provider Factory
 */
export class LLMProviderFactory {
  static create(config: LLMConfig): ILLMProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'gemini':
        return new GeminiProvider(config);
      case 'claude':
        return new ClaudeProvider(config);
      case 'groq':
        return new GroqProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  static getAvailableProviders() {
    return [
      {
        id: 'openai',
        name: 'OpenAI',
        models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
        pricing: 'Paid',
        speed: 'Medium',
        quality: 'Excellent',
        requiresApiKey: true,
        freeOption: false
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        models: ['gemini-pro', 'gemini-pro-vision'],
        pricing: 'Free tier available',
        speed: 'Fast',
        quality: 'Excellent',
        requiresApiKey: true,
        freeOption: true
      },
      {
        id: 'claude',
        name: 'Anthropic Claude',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        pricing: 'Free tier available',
        speed: 'Fast',
        quality: 'Excellent',
        requiresApiKey: true,
        freeOption: true
      },
      {
        id: 'groq',
        name: 'Groq',
        models: ['mixtral-8x7b', 'llama2-70b'],
        pricing: 'Free',
        speed: 'Very Fast',
        quality: 'Good',
        requiresApiKey: true,
        freeOption: true
      },
      {
        id: 'ollama',
        name: 'Ollama (Local)',
        models: ['llama2', 'mistral', 'codellama'],
        pricing: 'Free (Local)',
        speed: 'Depends on hardware',
        quality: 'Good',
        requiresApiKey: false,
        freeOption: true
      }
    ];
  }
}

/**
 * OpenAI Provider Strategy
 */
class OpenAIProvider implements ILLMProvider {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async invoke(messages: BaseMessage[]): Promise<LLMResponse> {
    const { ChatOpenAI } = await import("@langchain/openai");
    
    const llm = new ChatOpenAI({
      modelName: this.config.model,
      temperature: this.config.temperature || 0.7,
      maxTokens: this.config.maxTokens,
      openAIApiKey: this.config.apiKey,
    });

    const response = await llm.invoke(messages);
    
    return {
      content: response.content as string,
      usage: response.response_metadata?.usage
    };
  }

  getProviderName(): string {
    return 'OpenAI';
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }
}

/**
 * Google Gemini Provider Strategy (FREE!)
 */
class GeminiProvider implements ILLMProvider {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async invoke(messages: BaseMessage[]): Promise<LLMResponse> {
    const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
    
    const llm = new ChatGoogleGenerativeAI({
      modelName: this.config.model,
      temperature: this.config.temperature || 0.7,
      maxOutputTokens: this.config.maxTokens,
      apiKey: this.config.apiKey,
    });

    const response = await llm.invoke(messages);
    
    return {
      content: response.content as string,
    };
  }

  getProviderName(): string {
    return 'Google Gemini';
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }
}

/**
 * Anthropic Claude Provider Strategy (FREE TIER!)
 */
class ClaudeProvider implements ILLMProvider {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async invoke(messages: BaseMessage[]): Promise<LLMResponse> {
    const { ChatAnthropic } = await import("@langchain/anthropic");
    
    const llm = new ChatAnthropic({
      modelName: this.config.model,
      temperature: this.config.temperature || 0.7,
      maxTokens: this.config.maxTokens,
      anthropicApiKey: this.config.apiKey,
    });

    const response = await llm.invoke(messages);
    
    return {
      content: response.content as string,
      usage: response.response_metadata?.usage
    };
  }

  getProviderName(): string {
    return 'Anthropic Claude';
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }
}

/**
 * Groq Provider Strategy (FREE & FAST!)
 */
class GroqProvider implements ILLMProvider {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async invoke(messages: BaseMessage[]): Promise<LLMResponse> {
    const { ChatGroq } = await import("@langchain/groq");
    
    const llm = new ChatGroq({
      modelName: this.config.model,
      temperature: this.config.temperature || 0.7,
      maxTokens: this.config.maxTokens,
      apiKey: this.config.apiKey,
    });

    const response = await llm.invoke(messages);
    
    return {
      content: response.content as string,
    };
  }
  

  getProviderName(): string {
    return 'Groq';
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }
}

/**
 * Ollama Provider Strategy (LOCAL & FREE!)
 */
class OllamaProvider implements ILLMProvider {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async invoke(messages: BaseMessage[]): Promise<LLMResponse> {
    const { ChatOllama } = await import("@langchain/community/chat_models/ollama");
    
    const llm = new ChatOllama({
      model: this.config.model,
      temperature: this.config.temperature || 0.7,
      baseUrl: "http://localhost:11434", // Ollama default
    });

    const response = await llm.invoke(messages);
    
    return {
      content: response.content as string,
    };
  }

  getProviderName(): string {
    return 'Ollama (Local)';
  }

  isConfigured(): boolean {
    return true; // No API key needed for local
  }
}

/**
 * Settings Manager
 */
export class LLMSettingsManager {
  private static STORAGE_KEY = 'llm_settings';

  static getSettings(): LLMConfig {
    // In production, fetch from database or user preferences
    // For now, try environment variable first, then localStorage
    
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const stored = (globalThis as any).localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }

    // Default to environment variable
    return {
      provider: (process.env.LLM_PROVIDER as any) || 'openai',
      model: process.env.LLM_MODEL || 'gpt-4-turbo-preview',
      apiKey: process.env.OPENAI_API_KEY || process.env.LLM_API_KEY,
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    };
  }

  static saveSettings(config: LLMConfig) {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      (globalThis as any).localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    }
  }

  static async testConnection(config: LLMConfig): Promise<boolean> {
    try {
      const provider = LLMProviderFactory.create(config);
      const { HumanMessage } = await import("@langchain/core/messages");
      
      await provider.invoke([
        new HumanMessage("Say 'test successful' if you can read this.")
      ]);
      
      return true;
    } catch (error) {
      console.error('LLM connection test failed:', error);
      return false;
    }
  }
}
