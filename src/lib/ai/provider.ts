import { createOpenAI } from '@ai-sdk/openai';

/**
 * X AI (Grok) Provider
 * Primary AI provider for campaign analysis
 */
export const xai = createOpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: 'https://api.x.ai/v1',
});

/**
 * OpenAI Provider (Fallback)
 * Used when X AI is unavailable
 */
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Model configurations
 */
export const AI_MODEL = 'grok-2-latest';
export const FALLBACK_MODEL = 'gpt-4o-mini';

/**
 * Check if AI is configured
 */
export function isAIConfigured(): boolean {
  return !!(process.env.XAI_API_KEY || process.env.OPENAI_API_KEY);
}
