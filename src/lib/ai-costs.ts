/**
 * @fileOverview Centralized pricing for AI models.
 * Prices are per 1 million tokens.
 * Last updated: July 2024, based on public Google AI pricing for Gemini.
 */

interface ModelPricing {
    input: number;  // Price in USD per 1M input tokens
    output: number; // Price in USD per 1M output tokens
}

// Prices in USD per 1,000,000 tokens
// See: https://ai.google.dev/pricing
export const AI_MODEL_PRICING: { [key: string]: ModelPricing } = {
    // Gemini 1.5 Flash
    'googleai/gemini-1.5-flash-latest': {
        input: 0.35,
        output: 0.70,
    },
    'gemini-1.5-flash-latest': { // Alias in case short name is used
        input: 0.35,
        output: 0.70,
    },

    // Gemini 1.5 Pro
    'googleai/gemini-1.5-pro-latest': {
        input: 3.50,
        output: 10.50,
    },
    'gemini-1.5-pro-latest': { // Alias
        input: 3.50,
        output: 10.50,
    },
    
    // Default fallback (using Flash prices)
    'default': {
        input: 0.35,
        output: 0.70,
    }
};

/**
 * Calculates the cost of an AI interaction.
 * @param modelName The name of the model used (e.g., 'googleai/gemini-1.5-flash-latest').
 * @param inputTokens The number of input tokens.
 * @param outputTokens The number of output tokens.
 * @returns The calculated cost in USD.
 */
export function calculateCost(modelName: string, inputTokens: number, outputTokens: number): number {
    const pricing = AI_MODEL_PRICING[modelName] || AI_MODEL_PRICING['default'];
    
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    
    return inputCost + outputCost;
}
