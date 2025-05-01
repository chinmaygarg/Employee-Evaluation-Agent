const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * Service for PDF generation operations
 */
class PDFService {
  /**
   * Generate evaluation report PDF
   * @param {Object} evaluation - Evaluation data
   * @param {Object} session - Exam session data
   * @param {Object} questionPaper - Question paper data
   * @returns {Promise<string>} - Path to generated PDF
   */
  async generateEvaluationReport(evaluation, session, questionPaper) {
    return new Promise((resolve, reject) => {
      try {
        // Create filename and directory if it doesn't exist
        const reportDir = path.join(__dirname, '../../reports');
        if (!fs.existsSync(reportDir)) {
          fs.mkdirSync(reportDir, { recursive: true });
        }
        
        const filename = `evaluation_${session._id}_${Date.now()}.pdf`;
        const filePath = path.join(reportDir, filename);
        
        // Create PDF document
        const doc = new PDFDocument({
          autoFirstPage: true,
          size: 'A4',
          margin: 50,
          info: {
            Title: `Evaluation Report - ${session.candidate.name}`,
            Author: 'Smart Examination System',
          },
        });
        
        // Pipe PDF to file
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        
        // Add content to PDF
        this._addReportContent(doc, evaluation, session, questionPaper);
        
        // Finalize PDF
        doc.end();
        
        // Handle stream events
        stream.on('finish', () => {
          logger.info(`PDF report generated: ${filePath}`);
          resolve(filePath);
        });
        
        stream.on('error', (error) => {
          logger.error(`Error generating PDF: ${error.message}`);
          reject(error);
        });
      } catch (error) {
        logger.error(`Failed to generate PDF report: ${error.message}`);
        reject(error);
      }
    });
  }
  
  /**
   * Add content to PDF document
   * @private
   */
  _addReportContent(doc, evaluation, session, questionPaper) {
    // Add header
    doc.fontSize(20).text('Evaluation Report', { align: 'center' });
    doc.moveDown();
    
    // Add candidate information
    doc.fontSize(14).text('Candidate Information');
    doc.moveDown(0.5);
    
    doc.fontSize(10);
    this._addKeyValueRow(doc, 'Name:', session.candidate.name);
    this._addKeyValueRow(doc, 'Email:', session.candidate.email);
    this._addKeyValueRow(doc, 'Mobile:', session.candidate.mobile);
    this._addKeyValueRow(doc, 'Exam Title:', questionPaper.title);
    this._addKeyValueRow(doc, 'Job Role:', questionPaper.jobRole);
    this._addKeyValueRow(doc, 'Experience Level:', questionPaper.experience);
    this._addKeyValueRow(doc, 'Exam Date:', session.startTime.toLocaleDateString());
    this._addKeyValueRow(doc, 'Duration:', `${questionPaper.duration} minutes`);
    
    doc.moveDown();
    
    // Add score summary
    doc.fontSize(14).text('Score Summary');
    doc.moveDown(0.5);
    
    // Overall score
    doc.fontSize(12);
    this._addKeyValueRow(doc, 'Overall Score:', `${evaluation.overallScore}%`);
    
    // Draw progress bar
    this._drawProgressBar(doc, evaluation.overallScore);
    doc.moveDown();
    
    // Section scores
    doc.fontSize(10);
    evaluation.sectionScores.forEach((sectionScore) => {
      const percentage = Math.round((sectionScore.score / sectionScore.maxScore) * 100);
      this._addKeyValueRow(
        doc, 
        `${sectionScore.sectionTitle}:`,
        `${sectionScore.score}/${sectionScore.maxScore} (${percentage}%)`
      );
    });
    
    doc.moveDown();
    
    // Strengths and weaknesses
    doc.fontSize(14).text('Analysis');
    doc.moveDown(0.5);
    
    doc.fontSize(12).text('Strengths:');
    doc.fontSize(10);
    evaluation.strengths.forEach((strength, index) => {
      doc.text(`${index + 1}. ${strength}`);
    });
    
    doc.moveDown();
    
    doc.fontSize(12).text('Areas for Improvement:');
    doc.fontSize(10);
    evaluation.weaknesses.forEach((weakness, index) => {
      doc.text(`${index + 1}. ${weakness}`);
    });
    
    doc.moveDown();
    
    // Overall summary
    doc.fontSize(14).text('Overall Summary');
    doc.moveDown(0.5);
    doc.fontSize(10).text(evaluation.summary);
    
    doc.moveDown();
    
    // Detailed evaluation
    doc.fontSize(14).text('Detailed Evaluation');
    doc.moveDown(0.5);
    
    // Group questions by section
    const sectionMap = new Map();
    questionPaper.sections.forEach(section => {
      sectionMap.set(section._id.toString(), section.title);
    });
    
    const questionsBySection = new Map();
    evaluation.questionEvaluations.forEach(q => {
      const sectionTitle = sectionMap.get(q.sectionId) || 'Unknown Section';
      if (!questionsBySection.has(sectionTitle)) {
        questionsBySection.set(sectionTitle, []);
      }
      questionsBySection.get(sectionTitle).push(q);
    });
    
    // Add each section and its questions
    Array.from(questionsBySection.entries()).forEach(([sectionTitle, questions]) => {
      // Add page break if needed
      if (doc.y > 700) {
        doc.addPage();
      }
      
      doc.fontSize(12).text(sectionTitle, { underline: true });
      doc.moveDown(0.5);
      
      questions.forEach((q, index) => {
        // Add page break if needed
        if (doc.y > 680) {
          doc.addPage();
        }
        
        doc.fontSize(10).text(`Question ${index + 1}:`, { continued: true })
          .fontSize(9).text(` ${q.questionText}`);
        
        doc.fontSize(9).text('Answer:', { continued: true })
          .fontSize(8).text(` ${q.answer || '[No answer provided]'}`);
        
        const scorePercentage = Math.round((q.score / q.maxScore) * 100);
        doc.fontSize(9).text('Score:', { continued: true })
          .fontSize(8).text(` ${q.score}/${q.maxScore} (${scorePercentage}%)`);
        
        doc.fontSize(9).text('Feedback:', { continued: true })
          .fontSize(8).text(` ${q.feedback}`);
        
        doc.moveDown(0.5);
      });
      
      doc.moveDown();
    });
    
    // Add footer
    this._addFooter(doc);
  }
  
  /**
   * Add key-value row to PDF
   * @private
   */
  _addKeyValueRow(doc, key, value) {
    doc.text(key, { continued: true })
       .text(` ${value}`, { align: 'left' });
  }
  
  /**
   * Draw progress bar for overall score
   * @private
   */
  _drawProgressBar(doc, score) {
    const barWidth = 300;
    const barHeight = 20;
    const x = doc.x;
    const y = doc.y + 5;
    
    // Bar background
    doc.rect(x, y, barWidth, barHeight).fill('#eeeeee');
    
    // Calculate fill width
    const fillWidth = (score / 100) * barWidth;
    
    // Get color based on score
    let fillColor;
    if (score >= 80) fillColor = '#4CAF50'; // Green
    else if (score >= 60) fillColor = '#FFC107'; // Yellow
    else if (score >= 40) fillColor = '#FF9800'; // Orange
    else fillColor = '#F44336'; // Red
    
    // Fill bar
    doc.rect(x, y, fillWidth, barHeight).fill(fillColor);
    
    // Add score text
    const textX = x + barWidth / 2;
    const textY = y + barHeight / 2 - 5;
    doc.fontSize(10).fillColor('black').text(`${score}%`, textX, textY, {
      align: 'center',
    });
    
    // Move down after bar
    doc.y = y + barHeight + 10;
  }
  
  /**
   * Add footer to PDF
   * @private
   */
  _addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Save current y position
      const originalY = doc.y;
      
      // Go to bottom of page
      doc.fontSize(8).text(
        `Generated by Smart Examination System - ${new Date().toLocaleDateString()}`,
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 }
      );
      
      // Add page number
      doc.text(
        `Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 35,
        { align: 'center', width: doc.page.width - 100 }
      );
      
      // Restore y position
      doc.y = originalY;
    }
  }
}

module.exports = new PDFService();
