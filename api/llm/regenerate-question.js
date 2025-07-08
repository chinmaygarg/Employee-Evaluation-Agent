const connectDB = require('../_utils/db');
const { verifyToken } = require('../_utils/auth');
const { generateText } = require('../../backend/src/config/llm');

const handler = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { 
      questionId,
      questionText,
      questionType,
      jobRole,
      skillTag,
      experience,
      customPrompt
    } = req.body;
    
    if (!questionText || !jobRole) {
      return res.status(400).json({
        success: false,
        message: 'Question text and job role are required'
      });
    }
    
    // Build the prompt
    let prompt = `
You are an expert question generator for technical assessments. 
Generate a new question to replace the following question:

Original Question: "${questionText}"
Job Role: ${jobRole}
Experience Level: ${experience}
Skill: ${skillTag}
Question Type: ${questionType}

Requirements:
1. Generate a completely different question that tests the same skill
2. Maintain the same difficulty level appropriate for ${experience} experience
3. Keep the same question type (${questionType})
4. Make it practical and relevant to ${jobRole}
5. If it's an MCQ, provide 4 options with one correct answer
6. Include the expected answer or evaluation criteria

${customPrompt ? `\nAdditional Instructions: ${customPrompt}` : ''}

Return the response in this JSON format:
{
  "question": "The new question text",
  "type": "${questionType}",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "The correct answer or expected answer",
  "marks": 5,
  "skillTag": "${skillTag}",
  "difficulty": "medium"
}
`;

    const response = await generateText(prompt, {
      temperature: 0.7,
      max_tokens: 500
    });
    
    // Parse the response
    let newQuestion;
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        newQuestion = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Failed to parse question from LLM response'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: newQuestion
    });

  } catch (error) {
    console.error('Regenerate question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error regenerating question',
      error: error.message
    });
  }
};

module.exports = verifyToken(handler);
