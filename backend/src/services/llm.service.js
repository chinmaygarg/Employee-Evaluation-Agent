const { generateText } = require('../config/llm');
const logger = require('../config/logger');

/**
 * Service for LLM-based operations
 */
class LLMService {
  /**
   * Generate question paper based on given parameters
   * @param {Object} params - Question paper parameters
   * @returns {Promise<Object>} - Generated question paper
   */
  async generateQuestionPaper(params) {
    try {
      const { title, jobRole, skills, experience, sections, duration } = params;
      
      // Create a well-structured prompt
      const prompt = this._createQuestionPaperPrompt(
        title,
        jobRole,
        skills,
        experience,
        sections,
        duration
      );
      
      // Log the prompt for debugging
      logger.debug(`Question paper generation prompt: ${prompt}`);
      
      // Generate questions using LLM
      const llmResponse = await generateText(prompt, {
        temperature: 0.7,
        max_tokens: 4000,
      });
      
      // Parse the response
      const questions = this._parseQuestionPaperResponse(llmResponse);
      
      return {
        questions,
        prompt,
        rawResponse: llmResponse,
      };
    } catch (error) {
      logger.error(`Failed to generate question paper: ${error.message}`);
      throw new Error(`Question generation failed: ${error.message}`);
    }
  }
  
  /**
   * Evaluate exam answers
   * @param {Object} session - Exam session with answers
   * @param {Object} questionPaper - Question paper with expected answers
   * @returns {Promise<Object>} - Evaluation results
   */
  async evaluateAnswers(session, questionPaper) {
    try {
      // Create a well-structured prompt
      const prompt = this._createEvaluationPrompt(session, questionPaper);
      
      // Log the prompt for debugging
      logger.debug(`Evaluation prompt: ${prompt}`);
      
      // Generate evaluation using LLM
      const llmResponse = await generateText(prompt, {
        temperature: 0.3, // Lower temperature for more consistent evaluations
        max_tokens: 4000,
      });
      
      // Parse the evaluation response
      const evaluation = this._parseEvaluationResponse(llmResponse, session, questionPaper);
      
      return {
        evaluation,
        prompt,
        rawResponse: llmResponse,
      };
    } catch (error) {
      logger.error(`Failed to evaluate answers: ${error.message}`);
      throw new Error(`Answer evaluation failed: ${error.message}`);
    }
  }
  
  /**
   * Create a structured prompt for question paper generation
   * @private
   */
  _createQuestionPaperPrompt(title, jobRole, skills, experience, sections, duration) {
    const expLevel = {
      entry: 'Entry level (0-2 years)',
      mid: 'Mid level (3-5 years)',
      senior: 'Senior level (6+ years)',
    }[experience] || 'Mid level (3-5 years)';
    
    const skillsText = skills.join(', ');
    const sectionsText = sections.map(s => `- ${s.title}: ${s.description || 'Various questions related to the topic'}`).join('\\n');
    
    return `
You are an expert assessment creator tasked with generating a technical assessment for the following job role and skill set:

ASSESSMENT DETAILS:
- Title: ${title}
- Job Role: ${jobRole}
- Experience Level: ${expLevel}
- Skills to Assess: ${skillsText}
- Duration: ${duration} minutes
- Sections: 
${sectionsText}

REQUIREMENTS:
1. Create questions for each section listed above.
2. For each section, generate a mix of descriptive questions.
3. Each question should test practical knowledge, not just theory.
4. Include a variety of difficulty levels appropriate for the experience level.
5. For each question, provide an expected answer or evaluation criteria.
6. Ensure ALL questions are unique and not repetitive.
7. Assign appropriate marks to each question (1-10 points).
8. Tag each question with the specific skill being tested.

RESPONSE FORMAT:
Please format your response as a JSON object with the following structure:
{
  "sections": [
    {
      "title": "Section Title",
      "questions": [
        {
          "text": "Question text",
          "type": "descriptive",
          "expectedAnswer": "Example of what a good answer should include",
          "marks": 5,
          "skillTag": "specific skill"
        },
        // more questions...
      ]
    },
    // more sections...
  ]
}

Make sure the generated JSON is valid and can be parsed. The entire response should be a valid JSON object.
`;
  }
  
  /**
   * Parse the LLM response for question paper
   * @private
   */
  _parseQuestionPaperResponse(response) {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/```\n([\s\S]*?)\n```/) ||
                         response.match(/{[\s\S]*}/);
      
      let jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
      
      // Clean up any markdown or unexpected content
      if (jsonStr.indexOf('{') > 0) {
        jsonStr = jsonStr.substring(jsonStr.indexOf('{'));
      }
      
      // Parse the JSON
      const parsedData = JSON.parse(jsonStr);
      
      // Validate the structure
      if (!parsedData.sections || !Array.isArray(parsedData.sections)) {
        throw new Error('Invalid response format: missing sections array');
      }
      
      return parsedData;
    } catch (error) {
      logger.error(`Failed to parse question paper response: ${error.message}`);
      logger.debug(`Raw response: ${response}`);
      throw new Error(`Invalid question paper format: ${error.message}`);
    }
  }
  
  /**
   * Create a structured prompt for answer evaluation
   * @private
   */
  _createEvaluationPrompt(session, questionPaper) {
    const { answers, candidate } = session;
    
    // Create a mapping of question IDs to questions
    const questionMap = new Map();
    questionPaper.sections.forEach(section => {
      section.questions.forEach(question => {
        questionMap.set(question._id.toString(), {
          ...question,
          sectionId: section._id.toString(),
          sectionTitle: section.title,
        });
      });
    });
    
    // Format answers and questions
    const formattedAnswers = answers.map(answer => {
      const question = questionMap.get(answer.questionId.toString());
      if (!question) return null;
      
      return {
        sectionTitle: question.sectionTitle,
        questionText: question.text,
        skillTag: question.skillTag,
        marks: question.marks,
        expectedAnswer: question.expectedAnswer,
        candidateAnswer: answer.answer,
        questionId: answer.questionId.toString(),
        sectionId: answer.sectionId.toString(),
      };
    }).filter(Boolean);
    
    // Group by section
    const sectionAnswers = {};
    formattedAnswers.forEach(a => {
      if (!sectionAnswers[a.sectionTitle]) {
        sectionAnswers[a.sectionTitle] = [];
      }
      sectionAnswers[a.sectionTitle].push(a);
    });
    
    // Calculate total marks
    const totalAvailableMarks = formattedAnswers.reduce((sum, a) => sum + a.marks, 0);
    
    // Format questions and answers by section
    let sectionsText = '';
    Object.entries(sectionAnswers).forEach(([sectionTitle, answers]) => {
      sectionsText += `\n## SECTION: ${sectionTitle}\n\n`;
      
      answers.forEach((a, index) => {
        sectionsText += `### Question ${index + 1} (${a.marks} marks) - Skill: ${a.skillTag}\n`;
        sectionsText += `Q: ${a.questionText}\n\n`;
        sectionsText += `Candidate's Answer: ${a.candidateAnswer || '[No answer provided]'}\n\n`;
        sectionsText += `Expected Answer: ${a.expectedAnswer || '[No criteria provided]'}\n\n`;
      });
    });
    
    return `
You are an expert evaluator tasked with assessing a candidate's exam responses for a ${questionPaper.jobRole} role. The candidate has a claimed experience level of ${questionPaper.experience}.

CANDIDATE INFORMATION:
- Name: ${candidate.name}
- Job Role Being Assessed: ${questionPaper.jobRole}
- Experience Level: ${questionPaper.experience}
- Skills Tested: ${questionPaper.skills.join(', ')}

EVALUATION TASKS:
1. For each answer, provide a score based on accuracy, completeness, and relevance.
2. Provide brief feedback for each answer.
3. Rate each answer on a scale of 0-10 for relevance, accuracy, and completion.
4. Identify strengths and weaknesses based on the candidate's answers.
5. Provide an overall evaluation summary.

QUESTIONS AND ANSWERS:
${sectionsText}

RESPONSE FORMAT:
Please format your response as a JSON object with the following structure:
{
  "questionEvaluations": [
    {
      "questionId": "id-from-input",
      "sectionId": "id-from-input",
      "score": 5,
      "maxScore": 10,
      "feedback": "Detailed feedback",
      "relevance": 7,
      "accuracy": 8,
      "completion": 6
    },
    // more evaluations...
  ],
  "sectionScores": [
    {
      "sectionId": "id-from-input",
      "sectionTitle": "Section title",
      "score": 15,
      "maxScore": 20
    },
    // more section scores...
  ],
  "overallScore": 75,
  "summary": "Overall evaluation summary",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"]
}

Make sure the generated JSON is valid and can be parsed. The entire response should be a valid JSON object.
The overall score should be a percentage (0-100).
`;
  }
  
  /**
   * Parse the LLM response for evaluation
   * @private
   */
  _parseEvaluationResponse(response, session, questionPaper) {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/```\n([\s\S]*?)\n```/) ||
                         response.match(/{[\s\S]*}/);
      
      let jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
      
      // Clean up any markdown or unexpected content
      if (jsonStr.indexOf('{') > 0) {
        jsonStr = jsonStr.substring(jsonStr.indexOf('{'));
      }
      
      // Parse the JSON
      const parsedData = JSON.parse(jsonStr);
      
      // Validate the structure
      if (!parsedData.questionEvaluations || !Array.isArray(parsedData.questionEvaluations)) {
        throw new Error('Invalid response format: missing questionEvaluations array');
      }
      
      if (!parsedData.sectionScores || !Array.isArray(parsedData.sectionScores)) {
        throw new Error('Invalid response format: missing sectionScores array');
      }
      
      if (typeof parsedData.overallScore !== 'number') {
        throw new Error('Invalid response format: missing overallScore');
      }
      
      // Add question text to each evaluation
      const questionMap = new Map();
      questionPaper.sections.forEach(section => {
        section.questions.forEach(question => {
          questionMap.set(question._id.toString(), {
            text: question.text,
            marks: question.marks,
          });
        });
      });
      
      parsedData.questionEvaluations.forEach(evaluation => {
        const question = questionMap.get(evaluation.questionId);
        if (question) {
          evaluation.questionText = question.text;
          if (!evaluation.maxScore) {
            evaluation.maxScore = question.marks;
          }
        }
        
        // Find the corresponding answer
        const answer = session.answers.find(a => a.questionId.toString() === evaluation.questionId);
        if (answer) {
          evaluation.answer = answer.answer;
        }
      });
      
      return parsedData;
    } catch (error) {
      logger.error(`Failed to parse evaluation response: ${error.message}`);
      logger.debug(`Raw response: ${response}`);
      throw new Error(`Invalid evaluation format: ${error.message}`);
    }
  }
}

module.exports = new LLMService();
