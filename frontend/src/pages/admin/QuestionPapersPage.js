import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { questionPaperAPI } from '../../services/api';

const QuestionPapersPage = () => {
  const navigate = useNavigate();
  const [questionPapers, setQuestionPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, paper: null });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuestionPapers();
  }, []);

  useEffect(() => {
    // Re-fetch when search or filter changes
    const timer = setTimeout(() => {
      fetchQuestionPapers();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchTerm, filterRole]);

  const fetchQuestionPapers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await questionPaperAPI.getAllQuestionPapers({
        search: searchTerm,
        jobRole: filterRole,
        page: 1,
        limit: 50
      });
      
      if (response.data.success) {
        const papers = response.data.data.questionPapers.map(paper => ({
          id: paper.id,
          title: paper.title,
          jobRole: paper.jobRole,
          skills: paper.skills,
          experience: paper.experience,
          duration: paper.duration,
          examCode: paper.examCode,
          createdAt: new Date(paper.createdAt),
          questionsCount: paper.totalQuestions,
          totalMarks: paper.totalMarks
        }));
        setQuestionPapers(papers);
      }
    } catch (error) {
      console.error('Error fetching question papers:', error);
      setError('Failed to load question papers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaper = async (paperId) => {
    try {
      // TODO: Implement delete API call when backend supports it
      // await questionPaperAPI.deleteQuestionPaper(paperId);
      setQuestionPapers(prev => prev.filter(paper => paper.id !== paperId));
      setDeleteDialog({ open: false, paper: null });
      // Show success message
    } catch (error) {
      console.error('Error deleting question paper:', error);
      // Show error message
    }
  };

  const filteredPapers = questionPapers.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         paper.jobRole.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || paper.jobRole === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Button onClick={fetchQuestionPapers} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Question Papers
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/question-papers/create')}
          >
            Create New Paper
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Search"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ flexGrow: 1 }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Job Role</InputLabel>
            <Select
              value={filterRole}
              label="Job Role"
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="Frontend Developer">Frontend Developer</MenuItem>
              <MenuItem value="Backend Developer">Backend Developer</MenuItem>
              <MenuItem value="Full Stack Developer">Full Stack Developer</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Question Papers Grid */}
        <Grid container spacing={3}>
          {filteredPapers.map((paper) => (
            <Grid item xs={12} md={6} lg={4} key={paper.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                      {paper.title}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/question-papers/${paper.id}/questions`)}
                        title="View Questions"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/question-papers/edit/${paper.id}`)}
                        title="Edit Question Paper"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/admin/question-papers/${paper.id}/exam-codes`)}
                        title="Manage Exam Codes"
                      >
                        <CodeIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteDialog({ open: true, paper })}
                        title="Delete Question Paper"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography color="text.secondary" gutterBottom>
                    {paper.jobRole} • {paper.experience}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    {paper.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Duration:</strong> {paper.duration} minutes
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Questions:</strong> {paper.questionsCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {paper.createdAt.toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredPapers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No question papers found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {questionPapers.length === 0 
                ? "Get started by creating your first question paper"
                : "Try adjusting your search criteria"
              }
            </Typography>
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, paper: null })}
      >
        <DialogTitle>Delete Question Paper</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.paper?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, paper: null })}>
            Cancel
          </Button>
          <Button 
            color="error" 
            onClick={() => handleDeletePaper(deleteDialog.paper?.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuestionPapersPage;