const Joi = require('joi');
const logger = require('../config/logger');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema 
 * @returns {Function} - Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        message: detail.message,
        path: detail.path,
      }));
      
      logger.warn(`Validation error: ${JSON.stringify(errorDetails)}`);
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorDetails,
      });
    }
    
    next();
  };
};

// Auth validation schemas
const authSchemas = {
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),
  
  register: Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),
    role: Joi.string().valid('admin', 'super-admin').default('admin'),
  }),
};

// Candidate validation schemas
const candidateSchemas = {
  register: Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    mobile: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
      'string.pattern.base': 'Mobile number must be 10-15 digits',
      'any.required': 'Mobile number is required',
    }),
    examCode: Joi.string().required().messages({
      'any.required': 'Exam code is required',
    }),
  }),
};

// Question paper validation schemas
const questionPaperSchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required().messages({
      'string.min': 'Title must be at least 5 characters',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required',
    }),
    jobRole: Joi.string().min(3).max(100).required().messages({
      'string.min': 'Job role must be at least 3 characters',
      'string.max': 'Job role cannot exceed 100 characters',
      'any.required': 'Job role is required',
    }),
    skills: Joi.array().items(Joi.string()).min(1).required().messages({
      'array.min': 'At least one skill is required',
      'any.required': 'Skills are required',
    }),
    experience: Joi.string().valid('entry', 'mid', 'senior').required().messages({
      'any.only': 'Experience must be one of: entry, mid, senior',
      'any.required': 'Experience level is required',
    }),
    duration: Joi.number().integer().min(10).max(240).required().messages({
      'number.base': 'Duration must be a number',
      'number.integer': 'Duration must be an integer',
      'number.min': 'Duration must be at least 10 minutes',
      'number.max': 'Duration cannot exceed 240 minutes (4 hours)',
      'any.required': 'Duration is required',
    }),
    sections: Joi.array().items(
      Joi.object({
        title: Joi.string().min(3).max(100).required().messages({
          'string.min': 'Section title must be at least 3 characters',
          'string.max': 'Section title cannot exceed 100 characters',
          'any.required': 'Section title is required',
        }),
        description: Joi.string().max(500).allow(''),
      })
    ).min(1).required().messages({
      'array.min': 'At least one section is required',
      'any.required': 'Sections are required',
    }),
  }),
  
  addQuestion: Joi.object({
    sectionId: Joi.string().required().messages({
      'any.required': 'Section ID is required',
    }),
    text: Joi.string().min(10).required().messages({
      'string.min': 'Question text must be at least 10 characters',
      'any.required': 'Question text is required',
    }),
    type: Joi.string().valid('descriptive', 'mcq').required().messages({
      'any.only': 'Question type must be one of: descriptive, mcq',
      'any.required': 'Question type is required',
    }),
    options: Joi.when('type', {
      is: 'mcq',
      then: Joi.array().items(Joi.string()).min(2).required().messages({
        'array.min': 'At least 2 options are required for MCQ',
        'any.required': 'Options are required for MCQ',
      }),
      otherwise: Joi.array().items(Joi.string()).optional(),
    }),
    expectedAnswer: Joi.string().allow(''),
    marks: Joi.number().integer().min(1).required().messages({
      'number.base': 'Marks must be a number',
      'number.integer': 'Marks must be an integer',
      'number.min': 'Marks must be at least 1',
      'any.required': 'Marks are required',
    }),
    skillTag: Joi.string().required().messages({
      'any.required': 'Skill tag is required',
    }),
  }),
};

// Exam session validation schemas
const examSessionSchemas = {
  saveAnswer: Joi.object({
    questionId: Joi.string().required().messages({
      'any.required': 'Question ID is required',
    }),
    sectionId: Joi.string().required().messages({
      'any.required': 'Section ID is required',
    }),
    answer: Joi.string().allow(''),
  }),
};

module.exports = {
  validate,
  authSchemas,
  candidateSchemas,
  questionPaperSchemas,
  examSessionSchemas,
};
