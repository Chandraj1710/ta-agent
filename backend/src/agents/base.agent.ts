/**
 * Base Agent with LLM Provider Strategy
 * 
 * All agents extend this to use configurable LLM providers
 */

import { BaseMessage } from "@langchain/core/messages";
import { LLMProviderFactory, LLMSettingsManager, ILLMProvider, LLMConfig } from '../llm/providers.strategy';

export abstract class BaseAgent {
  protected llmProvider: ILLMProvider;
  protected config: LLMConfig;

  constructor(customConfig?: Partial<LLMConfig>) {
    // Get user settings or defaults
    this.config = {
      ...LLMSettingsManager.getSettings(),
      ...customConfig
    };

    // Create provider using Strategy Pattern
    this.llmProvider = LLMProviderFactory.create(this.config);
    
    console.log(`🤖 Agent initialized with ${this.llmProvider.getProviderName()}`);
  }

  /**
   * Invoke LLM with messages
   */
  protected async invokeLLM(messages: BaseMessage[]): Promise<string> {
    if (!this.llmProvider.isConfigured()) {
      throw new Error(
        `${this.llmProvider.getProviderName()} is not configured. Please set API key in settings.`
      );
    }

    const response = await this.llmProvider.invoke(messages);
    return response.content;
  }

  /**
   * Switch provider at runtime
   */
  switchProvider(newConfig: Partial<LLMConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.llmProvider = LLMProviderFactory.create(this.config);
    console.log(`🔄 Switched to ${this.llmProvider.getProviderName()}`);
  }

  /**
   * Get current provider info
   */
  getProviderInfo() {
    return {
      name: this.llmProvider.getProviderName(),
      model: this.config.model,
      configured: this.llmProvider.isConfigured()
    };
  }
}
