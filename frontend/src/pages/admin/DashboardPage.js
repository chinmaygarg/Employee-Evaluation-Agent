import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Description as PaperIcon,
  Assessment as EvalIcon,
  Person as CandidateIcon,
  Leaderboard as StatsIcon,
  School as ExamIcon,
} from '@mui/icons-material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { format } from 'date-fns';

import PageHeader from '../../components/common/PageHeader';
import { getEvaluationStats } from '../../store/slices/evaluationSlice';
import { getCandidateStats } from '../../store/slices/candidateSlice';
import { getAllQuestionPapers } from '../../store/slices/questionPaperSlice';

// Register Chart.js components
Chart.register(...registerables);

const DashboardPage = () => {
  const dispatch = useDispatch();
  
  const { stats: evalStats, loading: evalLoading } = useSelector((state) => state.evaluation);
  const { stats: candidateStats, loading: candidateLoading } = useSelector((state) => state.candidate);
  const { papers, loading: papersLoading } = useSelector((state) => state.questionPaper);
  
  useEffect(() => {
    dispatch(getEvaluationStats());
    dispatch(getCandidateStats());
    dispatch(getAllQuestionPapers({ limit: 5 }));
  }, [dispatch]);
  
  const loading = evalLoading || candidateLoading || papersLoading;
  
  // Example data for charts (replace with actual data when available)
  const scoreDistributionData = {
    labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
    datasets: [
      {
        label: 'Candidates',
        data: [5, 15, 25, 30, 10],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
        ],
      },
    ],
  };
  
  const candidateTrendData = {
    labels: candidateStats ? candidateStats.candidatesByMonth.map(item => item._id) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Candidates',
        data: candidateStats ? candidateStats.candidatesByMonth.map(item => item.count) : [12, 19, 3, 5, 2, 3],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4,
      },
    ],
  };
  
  const examsByJobRoleData = {
    labels: evalStats ? evalStats.statsByJobRole.map(item => item._id) : ['Developer', 'Designer', 'Manager', 'Admin', 'Tester'],
    datasets: [
      {
        label: 'Exams',
        data: evalStats ? evalStats.statsByJobRole.map(item => item.count) : [12, 19, 3, 5, 2],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  return (
    <Container maxWidth="lg">
      <PageHeader 
        title="Dashboard" 
        subtitle="Overview of system activity and metrics"
      />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    Question Papers
                  </Typography>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <PaperIcon />
                  </Avatar>
                </Box>
                <Typography component="p" variant="h4">
                  {papers ? papers.length : 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total question papers
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    Evaluations
                  </Typography>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <EvalIcon />
                  </Avatar>
                </Box>
                <Typography component="p" variant="h4">
                  {evalStats ? evalStats.totalEvaluations : 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total evaluations
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    Candidates
                  </Typography>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CandidateIcon />
                  </Avatar>
                </Box>
                <Typography component="p" variant="h4">
                  {candidateStats ? candidateStats.totalCandidates : 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total candidates
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography component="h2" variant="h6" color="primary" gutterBottom>
                    Avg. Score
                  </Typography>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <StatsIcon />
                  </Avatar>
                </Box>
                <Typography component="p" variant="h4">
                  {evalStats ? evalStats.averageScore : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average candidate score
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Candidate Trend
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 300 }}>
                  <Line 
                    data={candidateTrendData} 
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Candidates'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Month'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Score Distribution
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                  <Doughnut 
                    data={scoreDistributionData} 
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        }
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Exams by Job Role
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 300 }}>
                  <Bar 
                    data={examsByJobRoleData} 
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Exams'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Exam Papers
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List sx={{ height: 300, overflow: 'auto' }}>
                  {papers && papers.length > 0 ? (
                    papers.map((paper) => (
                      <ListItem key={paper.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
                            <ExamIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={paper.title}
                          secondary={`${paper.jobRole} | ${paper.totalQuestions} questions | Created: ${format(new Date(paper.createdAt), 'MMM d, yyyy')}`}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No question papers available" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default DashboardPage;
