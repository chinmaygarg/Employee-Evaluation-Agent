const { sendEmail } = require('../config/email');
const logger = require('../config/logger');

/**
 * Service for email operations
 */
class EmailService {
  /**
   * Send evaluation results to admin
   * @param {Object} evaluation - Evaluation data
   * @param {Object} session - Exam session data
   * @param {Object} questionPaper - Question paper data
   * @param {string} reportUrl - URL to evaluation report
   * @returns {Promise<Object>} - Email send response
   */
  async sendEvaluationToAdmin(evaluation, session, questionPaper, reportUrl) {
    try {
      const { candidate } = session;
      
      // Create email subject
      const subject = `Evaluation Results: ${candidate.name} - ${questionPaper.title}`;
      
      // Create email content
      const html = `
        <h2>Candidate Evaluation Report</h2>
        
        <h3>Candidate Information</h3>
        <p>
          <strong>Name:</strong> ${candidate.name}<br>
          <strong>Email:</strong> ${candidate.email}<br>
          <strong>Mobile:</strong> ${candidate.mobile}<br>
          <strong>Job Role:</strong> ${questionPaper.jobRole}<br>
          <strong>Experience Level:</strong> ${questionPaper.experience}<br>
        </p>
        
        <h3>Evaluation Summary</h3>
        <p>
          <strong>Overall Score:</strong> ${evaluation.overallScore}%<br>
          <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
        </p>
        
        <h3>Section Scores</h3>
        <ul>
          ${evaluation.sectionScores.map(section => `
            <li>
              <strong>${section.sectionTitle}:</strong> 
              ${section.score}/${section.maxScore} 
              (${Math.round((section.score / section.maxScore) * 100)}%)
            </li>
          `).join('')}
        </ul>
        
        <h3>Strengths</h3>
        <ul>
          ${evaluation.strengths.map(strength => `<li>${strength}</li>`).join('')}
        </ul>
        
        <h3>Areas for Improvement</h3>
        <ul>
          ${evaluation.weaknesses.map(weakness => `<li>${weakness}</li>`).join('')}
        </ul>
        
        <h3>Summary</h3>
        <p>${evaluation.summary}</p>
        
        <p>
          For detailed evaluation, please login to the admin panel or 
          <a href="${reportUrl}">download the full report</a>.
        </p>
        
        <p>
          <em>This is an automated email from the Smart Examination System.</em>
        </p>
      `;
      
      // Get admin email from environment variable or use default
      const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
      
      // Send email
      const info = await sendEmail({
        to: adminEmail,
        subject,
        html,
      });
      
      logger.info(`Evaluation email sent to admin: ${adminEmail}`);
      return info;
    } catch (error) {
      logger.error(`Failed to send evaluation email: ${error.message}`);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
  
  /**
   * Send confirmation to candidate
   * @param {Object} session - Exam session data
   * @param {Object} questionPaper - Question paper data
   * @returns {Promise<Object>} - Email send response
   */
  async sendExamConfirmationToCandidate(session, questionPaper) {
    try {
      const { candidate } = session;
      
      // Create email subject
      const subject = `Exam Confirmation: ${questionPaper.title}`;
      
      // Create email content
      const html = `
        <h2>Exam Submission Confirmation</h2>
        
        <p>Dear ${candidate.name},</p>
        
        <p>Thank you for completing the assessment for <strong>${questionPaper.title}</strong>.</p>
        
        <p><strong>Exam details:</strong></p>
        <ul>
          <li><strong>Exam:</strong> ${questionPaper.title}</li>
          <li><strong>Job Role:</strong> ${questionPaper.jobRole}</li>
          <li><strong>Date:</strong> ${session.startTime.toLocaleDateString()}</li>
          <li><strong>Start Time:</strong> ${session.startTime.toLocaleTimeString()}</li>
          <li><strong>End Time:</strong> ${session.endTime ? session.endTime.toLocaleTimeString() : 'N/A'}</li>
        </ul>
        
        <p>Your responses have been successfully recorded and will be evaluated. The results will be communicated to you by the hiring team.</p>
        
        <p>Thank you for your participation!</p>
        
        <p>Best regards,<br>Smart Examination System</p>
        
        <p><em>This is an automated email. Please do not reply to this message.</em></p>
      `;
      
      // Send email
      const info = await sendEmail({
        to: candidate.email,
        subject,
        html,
      });
      
      logger.info(`Confirmation email sent to candidate: ${candidate.email}`);
      return info;
    } catch (error) {
      logger.error(`Failed to send confirmation email: ${error.message}`);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}

module.exports = new EmailService();
