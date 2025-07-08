import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { examCodeAPI } from '../../services/api';

const ExamCodesPage = () => {
  const { questionPaperId } = useParams();
  const navigate = useNavigate();
  
  const [examCodes, setExamCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [stats, setStats] = useState(null);
  const [questionPaper, setQuestionPaper] = useState(null);
  
  // Dialog state
  const [generateData, setGenerateData] = useState({
    count: 10,
    expiryDays: 7,
    description: '',
  });

  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState('all'); // all, active, used, expired

  useEffect(() => {
    if (questionPaperId) {
      fetchExamCodes();
      fetchStats();
    }
  }, [questionPaperId, page, rowsPerPage, filter]);

  const fetchExamCodes = async () => {
    try {
      setLoading(true);
      const response = await examCodeAPI.getExamCodes(questionPaperId, {
        page: page + 1,
        limit: rowsPerPage,
        status: filter === 'all' ? undefined : filter,
      });
      
      if (response.data.success) {
        setExamCodes(response.data.data.examCodes || []);
        setQuestionPaper(response.data.data.questionPaper || null);
      }
    } catch (error) {
      console.error('Error fetching exam codes:', error);
      setError('Failed to fetch exam codes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await examCodeAPI.getExamCodeStats(questionPaperId);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleGenerateExamCodes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await examCodeAPI.generateExamCodes(questionPaperId, generateData);
      
      if (response.data.success) {
        setSuccess(`Successfully generated ${generateData.count} exam codes`);
        setOpenDialog(false);
        setGenerateData({ count: 10, expiryDays: 7, description: '' });
        fetchExamCodes();
        fetchStats();
      }
    } catch (error) {
      console.error('Error generating exam codes:', error);
      setError(error.response?.data?.message || 'Failed to generate exam codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setSuccess('Exam code copied to clipboard');
  };

  const handleDeactivateCode = async (codeId) => {
    try {
      const response = await examCodeAPI.deactivateExamCode(codeId);
      if (response.data.success) {
        setSuccess('Exam code deactivated successfully');
        fetchExamCodes();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deactivating exam code:', error);
      setError('Failed to deactivate exam code');
    }
  };

  const getExamCodeStatus = (examCode) => {
    if (!examCode.isActive) return 'inactive';
    if (examCode.isUsed) return 'used';
    if (examCode.expiresAt && new Date(examCode.expiresAt) < new Date()) return 'expired';
    return 'active';
  };

  const getStatusColor = (examCode) => {
    const status = getExamCodeStatus(examCode);
    switch (status) {
      case 'active':
        return 'success';
      case 'used':
        return 'primary';
      case 'expired':
        return 'error';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (examCode) => {
    const status = getExamCodeStatus(examCode);
    switch (status) {
      case 'active':
        return 'Active';
      case 'used':
        return 'Used';
      case 'expired':
        return 'Expired';
      case 'inactive':
        return 'Inactive';
      default:
        return status;
    }
  };

  if (loading && examCodes.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Exam Codes
        </Typography>
        {questionPaper && (
          <Typography variant="subtitle1" color="text.secondary">
            {questionPaper.title} - {questionPaper.jobRole}
          </Typography>
        )}
      </Box>

      {/* Alert Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Codes
                </Typography>
                <Typography variant="h4">
                  {stats.total || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Active
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.active || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Used
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats.used || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Expired
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.expired || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Actions */}
      <Box mb={3} display="flex" gap={2} alignItems="center">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Generate Exam Codes
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchExamCodes();
            fetchStats();
          }}
        >
          Refresh
        </Button>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            value={filter}
            label="Filter"
            onChange={(e) => setFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="used">Used</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Exam Codes Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Exam Code</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Generated</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Used By</TableCell>
                <TableCell>Used At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {examCodes.map((examCode) => (
                <TableRow key={examCode._id}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {examCode.code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(examCode)}
                      color={getStatusColor(examCode)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(examCode.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {examCode.expiresAt || examCode.expiryDate
                      ? new Date(examCode.expiresAt || examCode.expiryDate).toLocaleDateString()
                      : 'No Expiry'}
                  </TableCell>
                  <TableCell>
                    {examCode.usedBy 
                      ? typeof examCode.usedBy === 'object' 
                        ? (
                          <Box>
                            <Typography variant="body2">
                              {examCode.usedBy.name || 'Unknown Name'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {examCode.usedBy.email || examCode.usedBy.mobile || 'No contact'}
                            </Typography>
                          </Box>
                        )
                        : examCode.usedBy
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {examCode.usedAt
                      ? new Date(examCode.usedAt).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Copy Code">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyCode(examCode.code)}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    {getExamCodeStatus(examCode) === 'active' && (
                      <Tooltip title="Deactivate">
                        <IconButton
                          size="small"
                          onClick={() => handleDeactivateCode(examCode._id)}
                        >
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {examCode.usedBy && (
                      <Tooltip title="View Exam">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/evaluations/exam/${examCode.code}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Generate Exam Codes Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Exam Codes</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Number of Codes"
              type="number"
              value={generateData.count}
              onChange={(e) => setGenerateData({
                ...generateData,
                count: Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
              })}
              sx={{ mb: 2 }}
              helperText="Generate between 1 and 100 codes"
            />
            <TextField
              fullWidth
              label="Expiry Days"
              type="number"
              value={generateData.expiryDays}
              onChange={(e) => setGenerateData({
                ...generateData,
                expiryDays: Math.max(1, parseInt(e.target.value) || 7)
              })}
              sx={{ mb: 2 }}
              helperText="Number of days until codes expire"
            />
            <TextField
              fullWidth
              label="Description (Optional)"
              multiline
              rows={3}
              value={generateData.description}
              onChange={(e) => setGenerateData({
                ...generateData,
                description: e.target.value
              })}
              helperText="Optional description for this batch of codes"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateExamCodes}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExamCodesPage;
