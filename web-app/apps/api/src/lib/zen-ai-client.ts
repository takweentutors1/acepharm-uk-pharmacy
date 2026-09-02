import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

/**
 * Zen Gateway AI Client Configuration (Section 5.1 & 5.4)
 * 
 * Model: mimo-v2.5-free
 * Gateway: opencode.ai Zen Gateway
 * Base URL: https://opencode.ai/zen/v1
 * Endpoint: https://opencode.ai/zen/v1/chat/completions
 */
export function getZenAIClient(apiKey: string = 'free-tier') {
  return createOpenAICompatible({
    name: 'opencode-zen',
    baseURL: 'https://opencode.ai/zen/v1',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

/**
 * Returns the configured MiMo-V2.5 model instance for Ace streaming generation.
 */
export function getMimoModel(apiKey: string = 'free-tier') {
  const client = getZenAIClient(apiKey);
  return client('mimo-v2.5-free');
}
