const { asyncHandler } = require('../middleware/error.middleware');
const { generateText } = require('../config/llm');
const logger = require('../config/logger');

/**
 * @desc    Regenerate a single question
 * @route   POST /api/admin/llm/regenerate-question
 * @access  Private
 */
const regenerateQuestion = asyncHandler(async (req, res) => {
  const {
    questionPaperId,
    sectionTitle,
    questionType,
    jobRole,
    skills,
    experience,
    difficulty,
    customPrompt
  } = req.body;

  // Validate required fields
  if (!sectionTitle || !questionType || !jobRole || !skills || !experience) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: sectionTitle, questionType, jobRole, skills, experience'
    });
  }

  try {
    logger.info(`Regenerating question for paper ${questionPaperId}, section: ${sectionTitle}`);

    // Create a prompt for regenerating a single question
    let prompt = `Generate a ${questionType} question for the following requirements:
- Job Role: ${jobRole}
- Skills: ${Array.isArray(skills) ? skills.join(', ') : skills}
- Experience Level: ${experience}
- Section: ${sectionTitle}
- Difficulty: ${difficulty || 'medium'}`;

    if (customPrompt) {
      prompt += `\n- Additional Instructions: ${customPrompt}`;
    }

    prompt += `\n\nGenerate ONE unique, high-quality question that tests the candidate's knowledge and skills effectively. Return the response in the following JSON format:

{
  "question": "The question text",
  "type": "${questionType}",
  "marks": 10,
  ${questionType === 'mcq' ? `"options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "correct option text",` : ''}
  ${questionType === 'true_false' ? `"options": ["True", "False"],
  "correctAnswer": "True or False",` : ''}
  ${questionType === 'fill_blank' ? `"correctAnswer": "expected answer",` : ''}
  ${questionType === 'matching' ? `"options": ["item1", "item2", "item3"],
  "correctAnswer": "matching pairs explanation",` : ''}
  ${questionType === 'descriptive' || questionType === 'coding' || questionType === 'short_answer' ? `"keywords": ["keyword1", "keyword2", "keyword3"],
  "correctAnswer": "sample correct answer or explanation",` : ''}
  "difficulty": "${difficulty || 'medium'}"
}

Ensure the question is:
1. Clear and unambiguous
2. Relevant to the job role and skills
3. Appropriate for the experience level
4. Technically accurate
5. Free from bias`;

    // Call LLM service
    const response = await generateText(prompt, {
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    // Parse the response
    let generatedQuestion;
    try {
      // Try to parse as JSON first
      generatedQuestion = JSON.parse(response);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedQuestion = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse LLM response as JSON');
      }
    }

    // Validate the generated question structure
    if (!generatedQuestion.question || !generatedQuestion.type) {
      throw new Error('Invalid question structure from LLM');
    }

    // Ensure question has required fields
    generatedQuestion = {
      question: generatedQuestion.question,
      type: generatedQuestion.type || questionType,
      marks: generatedQuestion.marks || 10,
      difficulty: generatedQuestion.difficulty || difficulty || 'medium',
      options: generatedQuestion.options || [],
      correctAnswer: generatedQuestion.correctAnswer || '',
      keywords: generatedQuestion.keywords || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    logger.info(`Successfully regenerated question for section: ${sectionTitle}`);

    res.status(200).json({
      success: true,
      data: {
        question: generatedQuestion
      },
      message: 'Question regenerated successfully'
    });

  } catch (error) {
    logger.error(`Error regenerating question: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate question. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @desc    Test LLM connection
 * @route   GET /api/admin/llm/test
 * @access  Private
 */
const testConnection = asyncHandler(async (req, res) => {
  try {
    const testPrompt = 'Respond with "Connection successful" if you can read this message.';
    const response = await generateText(testPrompt, {
      temperature: 0.3,
      max_tokens: 100,
    });
    
    res.status(200).json({
      success: true,
      data: {
        response: response.substring(0, 100) + (response.length > 100 ? '...' : '')
      },
      message: 'LLM connection test successful'
    });
  } catch (error) {
    logger.error(`LLM connection test failed: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'LLM connection test failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = {
  regenerateQuestion,
  testConnection
};