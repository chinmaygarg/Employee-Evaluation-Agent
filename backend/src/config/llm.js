const { Configuration, OpenAIApi } = require('openai');
const logger = require('./logger');

/**
 * Configure OpenAI API
 */
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

/**
 * Get LLM model based on environment
 */
const getLLMModel = () => {
  return process.env.OPENAI_MODEL || 'gpt-4';
};

/**
 * Default parameters for LLM API calls
 */
const defaultParams = {
  temperature: 0.7,
  max_tokens: 2000,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

/**
 * Generate text from LLM
 * @param {string} prompt - The prompt to send to LLM
 * @param {object} options - Additional parameters for the API call
 * @returns {Promise<string>} - The generated text
 */
const generateText = async (prompt, options = {}) => {
  try {
    const params = {
      ...defaultParams,
      ...options,
      model: getLLMModel(),
      messages: [{ role: 'user', content: prompt }],
    };

    const response = await openai.createChatCompletion(params);
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    logger.error(`LLM API Error: ${error.message}`);
    throw new Error(`Failed to generate text from LLM: ${error.message}`);
  }
};

module.exports = {
  openai,
  generateText,
  getLLMModel,
};
