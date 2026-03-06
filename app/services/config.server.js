// /**
//  * Configuration Service
//  * Centralizes all configuration values for the chat service
//  */

// export const AppConfig = {
//   // API Configuration
//   api: {
//     defaultModel: 'claude-sonnet-4-20250514',
//     maxTokens: 2000,
//     defaultPromptType: 'standardAssistant',
//   },

//   // Error Message Templates
//   errorMessages: {
//     missingMessage: "Message is required",
//     apiUnsupported: "This endpoint only supports server-sent events (SSE) requests or history requests.",
//     authFailed: "Authentication failed with Claude API",
//     apiKeyError: "Please check your API key in environment variables",
//     rateLimitExceeded: "Rate limit exceeded",
//     rateLimitDetails: "Please try again later",
//     genericError: "Failed to get response from Claude"
//   },

//   // Tool Configuration
//   tools: {
//     productSearchName: "search_shop_catalog",
//     maxProductsToDisplay: 3
//   }
// };

// export default AppConfig;



/**
 * Configuration Service
 * Centralizes all configuration values for the chat service
 */
export const AppConfig = {
  api: {
    provider: process.env.AI_PROVIDER || "openai",
    defaultModel: process.env.AI_MODEL || "claude-sonnet-4-5",
    maxTokens: Number(process.env.AI_MAX_TOKENS || 2000),
    defaultPromptType: "standardAssistant",
  },

  errorMessages: {
    missingMessage: "Message is required",
    apiUnsupported:
      "This endpoint only supports server-sent events (SSE) requests or history requests.",
    authFailed: "Authentication failed with AI provider",
    apiKeyError: "Please check your AI API key in environment variables",
    rateLimitExceeded: "Rate limit exceeded",
    rateLimitDetails: "Please try again later",
    genericError: "Failed to get response from AI provider",
  },

  tools: {
    productSearchName: "search_shop_catalog",
    maxProductsToDisplay: 3,
  },
};

export default AppConfig;
