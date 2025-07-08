import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { questionPaperAPI } from '../../services/api';

const steps = ['Basic Information', 'Requirements', 'Generate Questions', 'Review'];

const CreateQuestionPaperPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [generatedPaperId, setGeneratedPaperId] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [formData, setFormData] = useState({
    title: '',
    jobRole: '',
    experience: '',
    duration: 60,
    skills: [],
    questionType: 'mixed', // 'objective', 'subjective', 'mixed'
    objectivePercentage: 50, // Only used when questionType is 'mixed'
    sections: [
      { name: 'Technical Knowledge', questionCount: 10 },
      { name: 'Problem Solving', questionCount: 5 },
      { name: 'Coding', questionCount: 3 }
    ],
    customPrompt: ''
  });
  const [errors, setErrors] = useState({});

  const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead/Principal'];
  const questionTypes = [
    { value: 'objective', label: 'Objective Only (MCQ, True/False, Fill in blanks)' },
    { value: 'subjective', label: 'Subjective Only (Descriptive, Essay, Code)' },
    { value: 'mixed', label: 'Mixed (Both Objective and Subjective)' }
  ];
  const commonSkills = [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'SQL', 'MongoDB',
    'HTML', 'CSS', 'TypeScript', 'Express', 'Django', 'Spring Boot', 'Git',
    'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST API'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSkillAdd = (skill) => {
    if (!formData.skills.includes(skill)) {
      handleInputChange('skills', [...formData.skills, skill]);
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    handleInputChange('skills', formData.skills.filter(skill => skill !== skillToRemove));
  };

  const handleSectionChange = (index, field, value) => {
    const newSections = [...formData.sections];
    newSections[index][field] = value;
    handleInputChange('sections', newSections);
  };

  const addSection = () => {
    handleInputChange('sections', [
      ...formData.sections,
      { name: '', questionCount: 5 }
    ]);
  };

  const removeSection = (index) => {
    if (formData.sections.length > 1) {
      const newSections = formData.sections.filter((_, i) => i !== index);
      handleInputChange('sections', newSections);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0:
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.jobRole.trim()) newErrors.jobRole = 'Job role is required';
        if (!formData.experience) newErrors.experience = 'Experience level is required';
        if (formData.duration < 15) newErrors.duration = 'Duration must be at least 15 minutes';
        break;
      case 1:
        if (formData.skills.length === 0) newErrors.skills = 'At least one skill is required';
        if (formData.sections.some(section => !section.name.trim())) {
          newErrors.sections = 'All sections must have names';
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === 2) {
        generateQuestions();
      } else {
        setActiveStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const generateQuestions = async () => {
    setLoading(true);
    setAlertMessage('');
    
    try {
      const requestData = {
        title: formData.title,
        jobRole: formData.jobRole,
        skills: formData.skills,
        experience: formData.experience,
        duration: parseInt(formData.duration),
        questionType: formData.questionType,
        objectivePercentage: formData.objectivePercentage ? parseInt(formData.objectivePercentage) : undefined,
        sections: formData.sections.map(section => ({
          title: section.name,
          questionCount: parseInt(section.questionCount),
          description: `Questions related to ${section.name} for ${formData.jobRole} role`
        }))
      };
      
      console.log('Sending request to generate questions:', requestData);
      
      const response = await questionPaperAPI.createQuestionPaper(requestData);
      
      if (response.data.success) {
        setGeneratedPaperId(response.data.data.id);
        setAlertMessage(`Question paper created successfully! Exam Code: ${response.data.data.examCode}`);
        setAlertSeverity('success');
        
        // Fetch the generated questions to display
        const paperResponse = await questionPaperAPI.getQuestionPaperById(response.data.data.id);
        if (paperResponse.data.success) {
          const paper = paperResponse.data.data;
          const flatQuestions = [];
          
          paper.sections.forEach(section => {
            section.questions.forEach((question, index) => {
              flatQuestions.push({
                id: question._id,
                section: section.title,
                question: question.text,
                type: question.type,
                points: question.marks,
                skillTag: question.skillTag,
                expectedAnswer: question.expectedAnswer
              });
            });
          });
          
          setGeneratedQuestions(flatQuestions);
          setActiveStep(3);
        }
      } else {
        throw new Error(response.data.message || 'Failed to create question paper');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      let errorMessage = 'Failed to generate questions';
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Handle validation errors
        const validationErrors = error.response.data.errors.map(err => err.message).join(', ');
        errorMessage = `Validation error: ${validationErrors}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAlertMessage(errorMessage);
      setAlertSeverity('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (generatedPaperId) {
      // Question paper already created, just navigate
      navigate('/admin/question-papers');
    } else {
      // This shouldn't happen, but handle it gracefully
      setAlertMessage('No question paper generated. Please generate questions first.');
      setAlertSeverity('error');
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question Paper Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Job Role"
                value={formData.jobRole}
                onChange={(e) => handleInputChange('jobRole', e.target.value)}
                error={!!errors.jobRole}
                helperText={errors.jobRole}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.experience}>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={formData.experience}
                  label="Experience Level"
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                >
                  {experienceLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                error={!!errors.duration}
                helperText={errors.duration}
                inputProps={{ min: 15, max: 300 }}
              />
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Question Type Selection
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={formData.questionType}
                  label="Question Type"
                  onChange={(e) => handleInputChange('questionType', e.target.value)}
                >
                  {questionTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {formData.questionType === 'mixed' && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Objective Questions Percentage: {formData.objectivePercentage}%
                  </Typography>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="10"
                    value={formData.objectivePercentage}
                    onChange={(e) => handleInputChange('objectivePercentage', parseInt(e.target.value))}
                    style={{ width: '100%', marginBottom: '8px' }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', typography: 'caption', color: 'text.secondary' }}>
                    <span>More Objective ({formData.objectivePercentage}% Objective, {100 - formData.objectivePercentage}% Subjective)</span>
                    <span>More Subjective</span>
                  </Box>
                </Box>
              )}

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Question Types:</strong><br />
                  • <strong>Objective:</strong> Multiple choice, True/False, Fill-in-the-blanks, Matching<br />
                  • <strong>Subjective:</strong> Descriptive answers, Essay questions, Code explanations, Problem solving<br />
                  • <strong>Mixed:</strong> Combination of both types for comprehensive assessment
                </Typography>
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Required Skills
              </Typography>
              <Box sx={{ mb: 2 }}>
                {formData.skills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    onDelete={() => handleSkillRemove(skill)}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select skills from the list below:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {commonSkills
                  .filter(skill => !formData.skills.includes(skill))
                  .map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      variant="outlined"
                      onClick={() => handleSkillAdd(skill)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
              </Box>
              {errors.skills && (
                <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {errors.skills}
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Question Sections
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addSection}
                >
                  Add Section
                </Button>
              </Box>
              {formData.sections.map((section, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Section Name"
                          value={section.name}
                          onChange={(e) => handleSectionChange(index, 'name', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Question Count"
                          type="number"
                          value={section.questionCount}
                          onChange={(e) => handleSectionChange(index, 'questionCount', parseInt(e.target.value))}
                          inputProps={{ min: 1, max: 50 }}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        {formData.sections.length > 1 && (
                          <Button
                            color="error"
                            onClick={() => removeSection(index)}
                            startIcon={<DeleteIcon />}
                          >
                            Remove
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          </Grid>
        );
        
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {alertMessage && (
              <Alert severity={alertSeverity} sx={{ mb: 3, textAlign: 'left' }}>
                {alertMessage}
              </Alert>
            )}
            {loading ? (
              <>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Generating Questions...
                </Typography>
                <Typography color="text.secondary">
                  This may take a few moments. Our AI is creating customized questions based on your requirements.
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  Ready to Generate Questions
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Click "Generate Questions" to create your question paper using AI.
                </Typography>
                <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                  <Typography variant="body2">
                    <strong>Summary:</strong><br />
                    • Job Role: {formData.jobRole}<br />
                    • Experience: {formData.experience}<br />
                    • Question Type: {questionTypes.find(type => type.value === formData.questionType)?.label}<br />
                    {formData.questionType === 'mixed' && `• Mix Ratio: ${formData.objectivePercentage}% Objective, ${100 - formData.objectivePercentage}% Subjective`}<br />
                    • Skills: {formData.skills.join(', ')}<br />
                    • Sections: {formData.sections.length}<br />
                    • Total Questions: {formData.sections.reduce((sum, section) => sum + section.questionCount, 0)}
                  </Typography>
                </Alert>
              </>
            )}
          </Box>
        );
        
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Generated Questions
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Review the generated questions below. The question paper has been created successfully.
            </Typography>
            
            {generatedQuestions.length > 0 ? (
              generatedQuestions.map((question, index) => (
                <Card key={question.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Question {index + 1} - {question.section}
                    </Typography>
                    <Typography sx={{ mb: 2, fontWeight: 'medium' }}>
                      {question.question}
                    </Typography>
                    {question.expectedAnswer && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                        Expected Answer: {question.expectedAnswer}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Chip label={`Type: ${question.type}`} size="small" />
                      <Chip label={`Points: ${question.points}`} size="small" color="primary" />
                      <Chip label={`Skill: ${question.skillTag}`} size="small" variant="outlined" />
                    </Box>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Alert severity="info">
                No questions generated yet. Please go back and generate questions.
              </Alert>
            )}
            
            {alertMessage && (
              <Alert severity={alertSeverity} sx={{ mt: 3 }}>
                {alertMessage}
              </Alert>
            )}
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/question-papers')}
            sx={{ mr: 2 }}
          >
            Back to Question Papers
          </Button>
          <Typography variant="h4" component="h1">
            Create Question Paper
          </Typography>
        </Box>

        <Paper sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleSave : handleNext}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : activeStep === steps.length - 1 ? (
                'Save Question Paper'
              ) : activeStep === 2 ? (
                'Generate Questions'
              ) : (
                'Next'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateQuestionPaperPage;