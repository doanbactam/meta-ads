import { generateText } from 'ai';
import { xai, openai, AI_MODEL, FALLBACK_MODEL, isAIConfigured } from './provider';
import { buildCampaignAnalysisPrompt } from './prompts';
import type { Campaign } from '@/types';

export interface AIAnalysisResult {
  summary: string;
  findings: string[];
  recommendations: string[];
  expectedImpact: string;
  rawInsights: string;
  timestamp: string;
  model: string;
}

/**
 * Analyze a campaign using AI
 */
export async function analyzeCampaign(campaign: Campaign): Promise<AIAnalysisResult> {
  if (!isAIConfigured()) {
    throw new Error('AI is not configured. Please add XAI_API_KEY or OPENAI_API_KEY to environment variables.');
  }

  const prompt = buildCampaignAnalysisPrompt(campaign);

  try {
    // Try X AI (Grok) first
    if (process.env.XAI_API_KEY) {
      const { text } = await generateText({
        model: xai(AI_MODEL),
        prompt,
        temperature: 0.7,
      });

      return parseAnalysis(text, AI_MODEL);
    }

    // Fallback to OpenAI
    if (process.env.OPENAI_API_KEY) {
      const { text } = await generateText({
        model: openai(FALLBACK_MODEL),
        prompt,
        temperature: 0.7,
      });

      return parseAnalysis(text, FALLBACK_MODEL);
    }

    throw new Error('No AI provider configured');
  } catch (error) {
    console.error('AI analysis error:', error);

    // If X AI fails, try OpenAI fallback
    if (process.env.OPENAI_API_KEY && (error as Error).message.includes('X AI')) {
      console.log('X AI failed, falling back to OpenAI...');
      
      const { text } = await generateText({
        model: openai(FALLBACK_MODEL),
        prompt,
        temperature: 0.7,
      });

      return parseAnalysis(text, `${FALLBACK_MODEL} (fallback)`);
    }

    throw error;
  }
}

/**
 * Parse AI response into structured format
 */
function parseAnalysis(text: string, model: string): AIAnalysisResult {
  const lines = text.split('\n').filter((line) => line.trim());

  return {
    summary: extractSummary(text),
    findings: extractBulletPoints(text, ['KEY FINDINGS', 'FINDINGS', 'KEY INSIGHTS']),
    recommendations: extractBulletPoints(text, ['RECOMMENDATIONS', 'ACTIONABLE RECOMMENDATIONS', 'ACTIONS']),
    expectedImpact: extractSection(text, ['EXPECTED IMPACT', 'IMPACT', 'POTENTIAL RESULTS']),
    rawInsights: text,
    timestamp: new Date().toISOString(),
    model,
  };
}

/**
 * Extract summary section
 */
function extractSummary(text: string): string {
  const summaryPatterns = [
    /PERFORMANCE SUMMARY[:\s]*([^\n]+(?:\n(?![A-Z\d]).*)*)/i,
    /SUMMARY[:\s]*([^\n]+(?:\n(?![A-Z\d]).*)*)/i,
    /^([^\n]+)/,
  ];

  for (const pattern of summaryPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return text.substring(0, 200).trim();
}

/**
 * Extract bullet points from a section
 */
function extractBulletPoints(text: string, sectionNames: string[]): string[] {
  for (const sectionName of sectionNames) {
    const regex = new RegExp(
      `${sectionName}[:\\s]*([\\s\\S]*?)(?=\\n\\n[A-Z]|\\n\\d+\\.|$)`,
      'i'
    );
    const match = text.match(regex);

    if (match) {
      const section = match[1];
      const bullets = section
        .split('\n')
        .filter((line) => {
          const trimmed = line.trim();
          return trimmed && (
            trimmed.match(/^[-•*]\s/) || // Bullet points
            trimmed.match(/^\d+\.\s/) || // Numbered lists
            trimmed.match(/^[a-z]\)\s/i) // Lettered lists
          );
        })
        .map((line) => line.replace(/^[-•*\d.a-z)]\s*/i, '').trim())
        .filter((line) => line.length > 0);

      if (bullets.length > 0) {
        return bullets;
      }
    }
  }

  return [];
}

/**
 * Extract a specific section
 */
function extractSection(text: string, sectionNames: string[]): string {
  for (const sectionName of sectionNames) {
    const regex = new RegExp(
      `${sectionName}[:\\s]*([^\\n]+(?:\\n(?![A-Z\\d]).*)*?)(?=\\n\\n|$)`,
      'i'
    );
    const match = text.match(regex);

    if (match) {
      return match[1].trim();
    }
  }

  return '';
}
