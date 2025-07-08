 llmService.evaluateAnswers(
      session,
      questionPaper
    );
    
    // Create evaluation record
    const evaluationRecord = new Evaluation({
      sessionId: session._id,
      candidateId: session.candidateId,
      questionPaperId: questionPaper._id,
      examCode: session.examCode,
      overallScore: evaluation.overallScore,
      completionRate: evaluation.completionRate || 0,
      accuracyRate: evaluation.accuracyRate || 0,
      answeredCount: evaluation.answeredCount || 0,
      totalQuestions: evaluation.totalQuestions || 0,
      sectionScores: evaluation.sectionScores,
      questionEvaluations: evaluation.questionEvaluations,
      summary: evaluation.summary,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      llmPrompt: prompt,
      llmResponse: rawResponse,
    });
    
    await evaluationRecord.save();
    
    // Update session
    session.status = 'evaluated';
    await session.save();
    
    console.log(`Evaluation completed for session ${sessionId}`);
    
    // Try to generate PDF report (optional)
    try {
      const reportPath = await pdfService.generateEvaluationReport(
        evaluationRecord,
        session,
        questionPaper
      );
      evaluationRecord.reportUrl = reportPath.split('/').pop();
      await evaluationRecord.save();
    } catch (pdfError) {
      console.error('Failed to generate PDF report:', pdfError);
    }
    
    // Try to send email (optional)
    try {
      await emailService.sendEvaluationToAdmin(
        evaluationRecord,
        session,
        questionPaper,
        evaluationRecord.reportUrl
      );
      evaluationRecord.sentToAdmin = true;
      await evaluationRecord.save();
    } catch (emailError) {
      console.error('Failed to send evaluation email:', emailError);
    }
    
  } catch (error) {
    console.error('Error in evaluation process:', error);
  }
}