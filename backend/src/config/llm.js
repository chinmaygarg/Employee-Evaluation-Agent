const OpenAI = require('openai');
const logger = require('./logger');

/**
 * Configure OpenAI API
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    logger.info(`Making OpenAI API call with model: ${params.model}`);
    
    const response = await openai.chat.completions.create(params);
    
    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response from OpenAI API');
    }
    
    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('Empty response from OpenAI API');
    }
    
    logger.info(`Successfully received response from OpenAI API`);
    return content.trim();
  } catch (error) {
    logger.error(`LLM API Error: ${error.message}`);
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your billing.');
    } else if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your configuration.');
    } else if (error.code === 'model_not_found') {
      throw new Error(`Model ${getLLMModel()} not found. Please check your model configuration.`);
    }
    
    throw new Error(`Failed to generate text from LLM: ${error.message}`);
  }
};

/**
 * Test the OpenAI connection
 * @returns {Promise<boolean>} - Whether the connection is working
 */
const testConnection = async () => {
  try {
    await generateText('Hello, this is a test. Please respond with "Test successful".', {
      max_tokens: 50,
      temperature: 0.1,
    });
    return true;
  } catch (error) {
    logger.error(`OpenAI connection test failed: ${error.message}`);
    return false;
  }
};

module.exports = {
  openai,
  generateText,
  getLLMModel,
  testConnection,
};