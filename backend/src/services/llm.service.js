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
      const { title, jobRole, skills, experience, sections, duration, questionType, objectivePercentage } = params;
      
      // Create a well-structured prompt
      const prompt = this._createQuestionPaperPrompt(
        title,
        jobRole,
        skills,
        experience,
        sections,
        duration,
        questionType,
        objectivePercentage
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
  _createQuestionPaperPrompt(title, jobRole, skills, experience, sections, duration, questionType = 'mixed', objectivePercentage = 50) {
    const expLevel = {
      entry: 'Entry level (0-2 years)',
      'Entry Level': 'Entry level (0-2 years)',
      mid: 'Mid level (3-5 years)',
      'Mid Level': 'Mid level (3-5 years)',
      senior: 'Senior level (6+ years)',
      'Senior Level': 'Senior level (6+ years)',
      'Lead/Principal': 'Lead/Principal level (8+ years)',
    }[experience] || 'Mid level (3-5 years)';
    
    const skillsText = skills.join(', ');
    
    // Determine question type instructions
    let questionTypeInstructions = '';
    let questionTypeInfo = '';
    
    switch (questionType) {
      case 'objective':
        questionTypeInstructions = `
QUESTION TYPES (OBJECTIVE ONLY):
- Multiple Choice Questions (MCQ): 4 options with 1 correct answer [type: "mcq"]
- True/False Questions: Simple true or false statements [type: "true_false"]
- Fill-in-the-blank Questions: Complete sentences with missing key terms [type: "fill_blank"]
- Matching Questions: Match items from two columns [type: "matching"]
- Short Answer Questions: Brief factual responses (1-2 sentences) [type: "short_answer"]
        `;
        questionTypeInfo = 'ALL questions must be objective type (mcq, true_false, fill_blank, matching, short_answer)';
        break;
        
      case 'subjective':
        questionTypeInstructions = `
QUESTION TYPES (SUBJECTIVE ONLY):
- Descriptive Questions: Detailed explanations (3-5 sentences) [type: "descriptive"]
- Essay Questions: Comprehensive answers (paragraph format) [type: "essay"]
- Problem Solving Questions: Step-by-step solutions [type: "problem_solving"]
- Code Explanation Questions: Explain code snippets or algorithms [type: "code_explanation"]
- Case Study Questions: Analyze scenarios and provide solutions [type: "case_study"]
- Design Questions: Explain system design or architecture [type: "design"]
- Coding Questions: Write actual code solutions [type: "coding"]
        `;
        questionTypeInfo = 'ALL questions must be subjective type (descriptive, essay, problem_solving, code_explanation, case_study, design, coding)';
        break;
        
      case 'mixed':
      default:
        const objectiveCount = Math.round((objectivePercentage / 100) * sections.reduce((sum, s) => sum + (s.questionCount || 5), 0));
        const subjectiveCount = sections.reduce((sum, s) => sum + (s.questionCount || 5), 0) - objectiveCount;
        
        questionTypeInstructions = `
QUESTION TYPES (MIXED):
- ${objectivePercentage}% Objective Questions (${objectiveCount} questions):
  * Multiple Choice Questions (MCQ): 4 options with 1 correct answer [type: "mcq"]
  * True/False Questions: Simple true or false statements [type: "true_false"]
  * Fill-in-the-blank Questions: Complete sentences with missing key terms [type: "fill_blank"]
  * Short Answer Questions: Brief factual responses (1-2 sentences) [type: "short_answer"]
  
- ${100 - objectivePercentage}% Subjective Questions (${subjectiveCount} questions):
  * Descriptive Questions: Detailed explanations (3-5 sentences) [type: "descriptive"]
  * Essay Questions: Comprehensive answers (paragraph format) [type: "essay"]
  * Problem Solving Questions: Step-by-step solutions [type: "problem_solving"]
  * Code Explanation Questions: Explain code snippets or algorithms [type: "code_explanation"]
        `;
        questionTypeInfo = `Mix of ${objectivePercentage}% objective and ${100 - objectivePercentage}% subjective questions. Use exact type names: mcq, true_false, fill_blank, short_answer, descriptive, essay, problem_solving, code_explanation, case_study, design, coding.`;
        break;
    }
    
    // Create detailed section requirements with exact question counts
    const sectionsText = sections.map(s => {
      const questionCount = s.questionCount || s.questions?.length || 5;
      return `- ${s.title || s.name}: Generate EXACTLY ${questionCount} questions. ${s.description || 'Various questions related to the topic'}`;
    }).join('\n');
    
    const totalQuestions = sections.reduce((sum, s) => sum + (s.questionCount || s.questions?.length || 5), 0);
    
    return `
You are an expert assessment creator. You MUST generate a technical assessment with EXACTLY the number of questions specified for each section.

ASSESSMENT DETAILS:
- Title: ${title}
- Job Role: ${jobRole}
- Experience Level: ${expLevel}
- Skills to Assess: ${skillsText}
- Duration: ${duration} minutes
- Total Questions Required: ${totalQuestions}
- Question Type: ${questionType.toUpperCase()}

${questionTypeInstructions}

SECTION REQUIREMENTS (EXACT COUNTS REQUIRED):
${sectionsText}

CRITICAL REQUIREMENTS:
1. You MUST generate EXACTLY the number of questions specified for each section. NO MORE, NO LESS.
2. ${questionTypeInfo}
3. Questions must test practical knowledge relevant to ${jobRole} at ${expLevel}.
4. Include variety in difficulty appropriate for the experience level.
5. Each question must have clear evaluation criteria or correct answers.
6. ALL questions must be unique - no repetition or similar questions.
7. Assign marks between 1-15 points based on question complexity and type.
8. Tag each question with the most relevant skill from: ${skillsText}

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object in this exact structure:
{
  "sections": [
    {
      "title": "Section Title",
      "description": "Brief section description",
      "questions": [
        {
          "text": "Question text",
          "type": "mcq|true_false|fill_blank|matching|descriptive|coding|essay|short_answer|problem_solving|code_explanation|case_study|design",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": "Correct option or answer",
          "expectedAnswer": "Detailed criteria for subjective questions or correct answer for objective",
          "marks": 5,
          "skillTag": "specific skill from the list"
        }
      ]
    }
  ]
}

IMPORTANT NOTES:
- For MCQ questions: Include 4 options in "options" array and specify correct answer in "correctAnswer"
- For True/False: Use "options": ["True", "False"] and specify correct answer
- For Fill-in-blank: Use "correctAnswer" for the missing word/phrase
- For Subjective: Use "expectedAnswer" for evaluation criteria
- Generate EXACTLY ${totalQuestions} questions in total
- Each section must have EXACTLY its specified number of questions
- Response must be valid JSON only - no markdown, no explanations
- All questions must be unique and test different aspects
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
          ...question.toObject(), // Convert Mongoose doc to plain object
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
        questionType: question.type,
        options: question.options || [],
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
        sectionsText += `### Question ${index + 1} (${a.marks} marks) - Type: ${a.questionType} - Skill: ${a.skillTag}\n`;
        sectionsText += `Q: ${a.questionText}\n\n`;
        
        // Include options for objective questions
        if (a.questionType === 'mcq' && a.options.length > 0) {
          sectionsText += `Options: ${a.options.join(', ')}\n`;
        } else if (a.questionType === 'true_false') {
          sectionsText += `Options: True, False\n`;
        }
        
        sectionsText += `Candidate's Answer: ${a.candidateAnswer || '[No answer provided]'}\n\n`;
        sectionsText += `Expected/Correct Answer: ${a.expectedAnswer || '[No criteria provided]'}\n\n`;
      });
    });
    
    // Create evaluation instructions based on question types
    const hasObjective = formattedAnswers.some(a => ['mcq', 'true_false', 'fill_blank'].includes(a.questionType));
    const hasSubjective = formattedAnswers.some(a => ['descriptive', 'coding', 'matching'].includes(a.questionType));
    
    let evaluationInstructions = '';
    if (hasObjective && hasSubjective) {
      evaluationInstructions = `
EVALUATION INSTRUCTIONS:
For OBJECTIVE questions (MCQ, True/False, Fill-in-blank):
- Award full marks for exact correct answers
- Award zero marks for incorrect answers
- Be strict with spelling and case sensitivity for fill-in-blank questions

For SUBJECTIVE questions (Descriptive, Coding, Matching):
- Evaluate based on accuracy, completeness, and relevance
- Award partial marks for partially correct answers
- Consider the depth of understanding demonstrated
- For coding questions, evaluate logic, syntax, and approach`;
    } else if (hasObjective) {
      evaluationInstructions = `
EVALUATION INSTRUCTIONS:
For OBJECTIVE questions (MCQ, True/False, Fill-in-blank):
- Award full marks for exact correct answers
- Award zero marks for incorrect answers
- Be strict with spelling and case sensitivity for fill-in-blank questions`;
    } else {
      evaluationInstructions = `
EVALUATION INSTRUCTIONS:
For SUBJECTIVE questions (Descriptive, Coding, Matching):
- Evaluate based on accuracy, completeness, and relevance
- Award partial marks for partially correct answers
- Consider the depth of understanding demonstrated
- For coding questions, evaluate logic, syntax, and approach`;
    }
    
    return `
You are an expert evaluator tasked with assessing a candidate's exam responses for a ${questionPaper.jobRole} role. The candidate has a claimed experience level of ${questionPaper.experience}.

CANDIDATE INFORMATION:
- Name: ${candidate.name}
- Job Role Being Assessed: ${questionPaper.jobRole}
- Experience Level: ${questionPaper.experience}
- Skills Tested: ${questionPaper.skills.join(', ')}
- Question Type Mix: ${questionPaper.questionType || 'mixed'}

${evaluationInstructions}

EVALUATION TASKS:
1. For each answer, provide a score based on the question type and marking criteria.
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
      "feedback": "Detailed feedback explaining the scoring",
      "relevance": 7,
      "accuracy": 8,
      "completion": 6,
      "isObjective": true,
      "questionType": "mcq"
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
  "summary": "Overall evaluation summary considering both objective and subjective performance",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "objectiveScore": 80,
  "subjectiveScore": 70
}

Make sure the generated JSON is valid and can be parsed. The overall score should be a percentage (0-100).
For objective questions, use strict marking. For subjective questions, use rubric-based evaluation.
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
      
      // CRITICAL FIX: Create evaluations for ALL questions in the paper, not just answered ones
      const allQuestionEvaluations = [];
      const sectionScoresMap = new Map();
      const answerMap = new Map();
      
      // Create answer mapping from session
      session.answers.forEach(answer => {
        answerMap.set(answer.questionId.toString(), {
          answer: answer.answer,
          sectionId: answer.sectionId.toString()
        });
      });
      
      // Process ALL questions from the question paper
      questionPaper.sections.forEach((section, sectionIndex) => {
        let sectionScore = 0;
        let sectionMaxScore = 0;
        
        section.questions.forEach((question, questionIndex) => {
          const questionId = question._id.toString();
          const sectionId = section._id.toString();
          const answerData = answerMap.get(questionId);
          
          let questionEvaluation;
          
          if (answerData && answerData.answer && answerData.answer.trim() !== '') {
            // Question was answered - find evaluation from LLM response
            const llmEvalIndex = session.answers.findIndex(a => a.questionId.toString() === questionId);
            const llmEval = parsedData.questionEvaluations[llmEvalIndex];
            
            if (llmEval) {
              questionEvaluation = {
                questionId: questionId,
                sectionId: sectionId,
                questionText: question.text || '',
                answer: answerData.answer,
                score: llmEval.score || 0,
                maxScore: question.marks || llmEval.maxScore || 5,
                feedback: llmEval.feedback || 'Answer evaluated',
                relevance: llmEval.relevance || 5,
                accuracy: llmEval.accuracy || 5,
                completion: llmEval.completion || 5,
              };
            } else {
              // Answered but no LLM evaluation found - default to 0
              questionEvaluation = {
                questionId: questionId,
                sectionId: sectionId,
                questionText: question.text || '',
                answer: answerData.answer,
                score: 0,
                maxScore: question.marks || 5,
                feedback: 'Answer submitted but evaluation not found',
                relevance: 0,
                accuracy: 0,
                completion: 0,
              };
            }
          } else {
            // Question was NOT answered - assign 0 score
            questionEvaluation = {
              questionId: questionId,
              sectionId: sectionId,
              questionText: question.text || '',
              answer: '', // No answer provided
              score: 0,   // Zero points for unanswered
              maxScore: question.marks || 5,
              feedback: 'Question not answered',
              relevance: 0,
              accuracy: 0,
              completion: 0,
            };
          }
          
          allQuestionEvaluations.push(questionEvaluation);
          sectionScore += questionEvaluation.score;
          sectionMaxScore += questionEvaluation.maxScore;
        });
        
        // Store section scores
        sectionScoresMap.set(sectionId, {
          sectionId: sectionId,
          sectionTitle: section.title,
          score: sectionScore,
          maxScore: sectionMaxScore,
        });
      });
      
      // Convert section scores map to array
      const correctedSectionScores = Array.from(sectionScoresMap.values());
      
      // Calculate the CORRECT overall score based on ALL questions
      const totalScore = allQuestionEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0);
      const totalMaxScore = allQuestionEvaluations.reduce((sum, evaluation) => sum + evaluation.maxScore, 0);
      const correctOverallScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
      
      // Calculate additional metrics
      const answeredQuestions = allQuestionEvaluations.filter(q => q.answer && q.answer.trim() !== '');
      const completionRate = Math.round((answeredQuestions.length / allQuestionEvaluations.length) * 100);
      const accuracyRate = answeredQuestions.length > 0 ? 
        Math.round((answeredQuestions.filter(q => q.score > 0).length / answeredQuestions.length) * 100) : 0;
      
      logger.info(`Evaluation metrics - Total Questions: ${allQuestionEvaluations.length}, Answered: ${answeredQuestions.length}, Completion Rate: ${completionRate}%, Accuracy Rate: ${accuracyRate}%, Overall Score: ${correctOverallScore}%`);
      
      return {
        questionEvaluations: allQuestionEvaluations,
        sectionScores: correctedSectionScores,
        overallScore: correctOverallScore, // Use corrected score instead of LLM score
        summary: parsedData.summary || `Evaluation completed. ${answeredQuestions.length}/${allQuestionEvaluations.length} questions answered (${completionRate}% completion rate).`,
        strengths: parsedData.strengths || [],
        weaknesses: parsedData.weaknesses || [
          answeredQuestions.length < allQuestionEvaluations.length ? 'Incomplete exam - many questions left unanswered' : null
        ].filter(Boolean),
        // Additional metrics for transparency
        completionRate: completionRate,
        accuracyRate: accuracyRate,
        answeredCount: answeredQuestions.length,
        totalQuestions: allQuestionEvaluations.length,
      };
    } catch (error) {
      logger.error(`Failed to parse evaluation response: ${error.message}`);
      logger.debug(`Raw response: ${response}`);
      throw new Error(`Invalid evaluation format: ${error.message}`);
    }
  }
}

module.exports = new LLMService();
