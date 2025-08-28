import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import generateIcon from './Components_assets/Generate.svg';

const QuestionBar = ({ formData, trigger }) => {
  const [questions, setQuestions] = useState([]);
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  // Helper function to convert fill-in-blank format for PDF
  const formatQuestionForPDF = (text) => {
    if (!text) return '';
    
    // Replace various blank patterns with underscores
    return text
      .replace(/\$\s*_{3,}\s*\$/g, '_______________________') // Replace $____$ with underscores
      .replace(/\$+[^$]*\$+/g, '_______________________') // Replace any $content$ with underscores
      .replace(/__{3,}/g, '_______________________') // Standardize existing underscores
      .trim();
  };

  // PDF Export function with enhanced formatting
  const exportQuestions = () => {
    if (questions.length === 0) {
      alert('No questions to export');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // PDF styling constants
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPosition = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (neededHeight) => {
      if (yPosition + neededHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Helper function to wrap text
    const wrapText = (text, maxWidth, fontSize = 12) => {
      doc.setFontSize(fontSize);
      return doc.splitTextToSize(text, maxWidth);
    };

    // Title Page
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Generated Questions', pageWidth / 2, yPosition + 15, { align: 'center' });
    yPosition += 30;

    // Metadata section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const metadata = [
      `Total Questions: ${questions.length}`,
      `Question Type: ${formatQuestionType(formData?.Question_Style || formData?.question_type)}`,
      `Export Date: ${new Date().toLocaleDateString()}`,
      `Focus Area: ${formData?.Focus_Area || formData?.topic || 'N/A'}`,
      `Difficulty Level: ${formData?.difficulty_level || 'Medium'}`,
      `Learning Objective: ${formData?.learning_objective || 'N/A'}`
    ];

    metadata.forEach(item => {
      checkPageBreak(8);
      doc.text(item, margin, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Scenario section (if available)
    if (scenario) {
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Scenario:', margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const scenarioLines = wrapText(scenario, contentWidth, 11);
      scenarioLines.forEach(line => {
        checkPageBreak(6);
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Questions section
    questions.forEach((q, index) => {
      const isFillInTheBlank = (formData?.Question_Style || formData?.question_type)?.includes('Fill-in-the-Blanks');
      const isMultipleChoice = (formData?.Question_Style || formData?.question_type)?.includes('MCQs') || 
                             (formData?.Question_Style || formData?.question_type)?.includes('Case-based MCQ') ||
                             q.Options.length > 0;

      // Check if we need a new page for this question
      checkPageBreak(40);

      // Question number and text with proper blank formatting
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`Q${index + 1}.`, margin, yPosition);
      
      doc.setFont('helvetica', 'normal');
      const formattedQuestionText = formatQuestionForPDF(q.QuestionText);
      const questionLines = wrapText(formattedQuestionText, contentWidth - 15, 12);
      
      questionLines.forEach((line, lineIndex) => {
        if (lineIndex === 0) {
          doc.text(line, margin + 15, yPosition);
        } else {
          checkPageBreak(6);
          doc.text(line, margin, yPosition);
        }
        yPosition += 6;
      });
      yPosition += 8;

      // Multiple choice options
      if (isMultipleChoice && q.Options && q.Options.length > 0) {
        doc.setFontSize(11);
        q.Options.forEach((option, i) => {
          checkPageBreak(6);
          const optionLabel = q.optionLabels ? q.optionLabels[i] : String.fromCharCode(65 + i);
          const optionText = `${optionLabel}. ${option}`;
          const optionLines = wrapText(optionText, contentWidth - 10, 11);
          
          optionLines.forEach((line, lineIndex) => {
            if (lineIndex === 0) {
              doc.text(line, margin + 8, yPosition);
            } else {
              checkPageBreak(5);
              doc.text(line, margin + 15, yPosition);
            }
            yPosition += 5;
          });
        });
        yPosition += 8;
      }

      // Fill in the blank answer line (for questions without embedded blanks)
      if (isFillInTheBlank && !/\$\s*_{3,}\s*\$|\$+.*?\$+/.test(q.QuestionText)) {
        checkPageBreak(12);
        doc.setFontSize(11);
        doc.text('Answer: _______________________', margin + 8, yPosition);
        yPosition += 12;
      }

     // Alternative: Put answer on next line with indentation
if (q.CorrectAnswer && q.CorrectAnswer !== 'N/A') {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // Black color
  doc.text('Correct Answer:', margin + 8, yPosition);
  yPosition += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 120, 0); // Dark green for answer
  const answerLines = wrapText(q.CorrectAnswer, contentWidth - 15, 11);
  answerLines.forEach(line => {
    checkPageBreak(5);
    doc.text(line, margin + 15, yPosition); // Indented answer
    yPosition += 5;
  });
  yPosition += 3;
}
      // Explanation - ALWAYS SHOW IN PDF
      if (q.Explanation) {
        checkPageBreak(15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Black color
        doc.text('Explanation:', margin + 8, yPosition);
        yPosition += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60); // Dark gray for explanation
        const explanationLines = wrapText(q.Explanation, contentWidth - 15, 10);
        explanationLines.forEach(line => {
          checkPageBreak(5);
          doc.text(line, margin + 8, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }

      // Hint - ALWAYS SHOW IN PDF
      if (q.Hint) {
        checkPageBreak(12);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Black color
        doc.text('Hint:', margin + 8, yPosition);
        yPosition += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 0); // Dark yellow/brown for hint
        const hintLines = wrapText(q.Hint, contentWidth - 15, 10);
        hintLines.forEach(line => {
          checkPageBreak(5);
          doc.text(line, margin + 8, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }

      // Additional feedback
      if (q.feedback?.Incorrect) {
        checkPageBreak(10);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('If Incorrect:', margin + 8, yPosition);
        yPosition += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 0, 0); // Dark red for incorrect feedback
        const incorrectLines = wrapText(q.feedback.Incorrect, contentWidth - 15, 10);
        incorrectLines.forEach(line => {
          checkPageBreak(5);
          doc.text(line, margin + 8, yPosition);
          yPosition += 5;
        });
        yPosition += 3;
      }

      // Tags
      if ((q.Tags && q.Tags.length > 0) || (formData?.tags && formData.tags.length > 0)) {
        checkPageBreak(10);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Tags:', margin + 8, yPosition);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100); // Gray for tags
        const tags = q.Tags && q.Tags.length > 0 ? q.Tags : formData.tags.filter(tag => tag.trim());
        const tagsText = tags.join(', ');
        const tagLines = wrapText(tagsText, contentWidth - 20, 9);
        
        tagLines.forEach((line, lineIndex) => {
          if (lineIndex === 0) {
            doc.text(line, margin + 20, yPosition);
          } else {
            checkPageBreak(4);
            doc.text(line, margin + 8, yPosition);
          }
          yPosition += 4;
        });
        yPosition += 5;
      }

      // Reset text color to black for next question
      doc.setTextColor(0, 0, 0);

      // Add spacing between questions
      yPosition += 15;

      // Add a separator line between questions (except for the last one)
      if (index < questions.length - 1) {
        checkPageBreak(8);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition - 8, pageWidth - margin, yPosition - 8);
        yPosition += 5;
      }
    });

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Add generation timestamp on first page
      if (i === 1) {
        doc.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 10);
      }
    }

    // Save the PDF
    const fileName = `questions_export_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };


  useEffect(() => {
    // Prevent fetching if trigger is initial value (0)
    if (trigger === 0) {
      console.log('Skipping fetch: trigger is 0 (initial state)');
      return;
    }

    if (!formData) {
      console.log('No formData provided to QuestionBar');
      setError('No form data provided. Please submit the form or upload a file.');
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const fetchQuestions = async (retries = 3, baseDelay = 1000) => {
      if (!isMounted) return;

      setLoading(true);
      setError(null);
      setQuestions([]);
      setScenario('');
      setDebugInfo('');
      
      const isCaseBased = formData.Scenarios !== undefined || formData.Question_Style === 'Case-based MCQ';
      
      const apiUrl = isCaseBased
        ? (import.meta.env.DEV 
            ? '/api'
            : 'https://x3sjgoquc2.execute-api.ap-south-1.amazonaws.com/dev'
          )
        : 'https://fypc6y8q41.execute-api.ap-south-1.amazonaws.com/dev';

      console.log('Environment Details:');
      console.log('- Development mode:', import.meta.env.DEV);
      console.log('- Production mode:', import.meta.env.PROD);
      console.log('- Mode:', import.meta.env.MODE);
      console.log('- Is case-based:', isCaseBased);
      console.log('- Selected API URL:', apiUrl);

      const normalizedPayload = {
        ...formData,
        Focus_Area: formData.Focus_Area || formData.topic || 'Default',
        Question_Style: formData.Question_Style || formData.question_type || 'multiple-choice',
        max_question: formData.max_question || formData.Questions_per_Scenario || formData.numQuestions || 6,
        blooms_taxonomy: formData.blooms_taxonomy || formData.bloomsTaxonomy || 'Apply',
        difficulty_level:
          formData.difficulty_level ||
          (formData.difficulty
            ? Object.keys(formData.difficulty)
                .filter((key) => formData.difficulty[key])
                .map((key) => key.charAt(0).toUpperCase() + key.slice(1))
                .join(',') || 'Medium'
            : 'Medium'),
        BASE_CONTENT: formData.BASE_CONTENT || formData.base_content || '',
        Scenarios: formData.Scenarios || (isCaseBased ? '1' : undefined),
        Questions_per_Scenario: formData.Questions_per_Scenario || formData.max_question || (isCaseBased ? 4 : undefined),
        Learner_Level: formData.Learner_Level || (isCaseBased ? 'Advanced' : undefined),
        special_instruction: formData.special_instruction || (isCaseBased ? 'Include realistic clinical situations and avoid overly simplistic wording.' : ''),
        learning_objective: formData.learning_objective || formData.description || 'Hands on practice',
      };

      console.log('Sending payload:', JSON.stringify(normalizedPayload, null, 2));

      for (let i = 0; i < retries; i++) {
        try {
          const response = await axios.post(apiUrl, normalizedPayload, {
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            signal: controller.signal,
            timeout: 60000,
          });

          if (!isMounted) return;

          console.log('Raw API response received:');
          console.log('- Status:', response.status);
          console.log('- Headers:', response.headers);
          console.log('- Data type:', typeof response.data);
          console.log('- Data content:', response.data);

          let responseData = response.data;
          let body;

          if (typeof responseData === 'string' && responseData.includes('<!DOCTYPE html>')) {
            throw new Error(`Received HTML response instead of JSON. This indicates a routing/proxy issue. 
              Possible causes:
              1. API endpoint not found (404)
              2. CORS issues in production
              3. Nginx/server misconfiguration
              4. API Gateway not properly configured
              
              Debug info: Environment=${import.meta.env.DEV ? 'dev' : 'prod'}, URL=${apiUrl}`);
          }

          if (!responseData) {
            throw new Error('Empty response received from API');
          }

          if (responseData.body && typeof responseData.body === 'string') {
            try {
              body = JSON.parse(responseData.body);
              console.log('Parsed AWS Lambda response body');
            } catch (parseError) {
              throw new Error(`Failed to parse AWS Lambda response body JSON: ${parseError.message}`);
            }
          }
          else if (typeof responseData === 'object') {
            body = responseData;
            console.log('Using direct API response object');
          }
          else if (typeof responseData === 'string') {
            try {
              body = JSON.parse(responseData);
              console.log('Parsed string response');
            } catch (parseError) {
              throw new Error(`Failed to parse string response as JSON: ${parseError.message}`);
            }
          }
          else {
            throw new Error(`Unexpected response format: ${typeof responseData}`);
          }

          if (body.error || body.errorMessage || body.message?.includes('error')) {
            throw new Error(`API returned an error: ${body.error || body.errorMessage || body.message}`);
          }

          let questionsString = body.questions || body.Questions || body.data?.questions;
          let scenarioText = '';
          let parsedQuestions = [];

          console.log('Questions extraction:');
          console.log('- Type:', typeof questionsString);
          console.log('- Length:', questionsString?.length);
          console.log('- First 500 chars:', questionsString?.substring(0, 500) || 'N/A');

          setDebugInfo(`
             Debug Information:
            - Environment: ${import.meta.env.DEV ? 'Development' : 'Production'}
            - Mode: ${import.meta.env.MODE}
            - API URL: ${apiUrl}
            - Response Type: ${typeof responseData}
            - Questions Type: ${typeof questionsString}
            - Questions Length: ${questionsString?.length || 0}
            - Timestamp: ${new Date().toISOString()}
          `);

          if (typeof questionsString === 'string') {
            let cleanedString = questionsString;
            
            console.log('Step 1 - Original:', cleanedString.substring(0, 100));
            
            cleanedString = cleanedString
              .trim()
              .replace(/^\uFEFF/, '')
              .replace(/``````/g, '')
              .replace(/^"/, '').replace(/"$/, '');
              
            console.log('Step 2 - After wrapper removal:', cleanedString.substring(0, 100));
            
            cleanedString = cleanedString
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\')
              .replace(/\\n/g, '')
              .replace(/\\r/g, '');
              
            console.log('Step 3 - After unescaping:', cleanedString.substring(0, 100));

            let parseSuccess = false;

            if (!parseSuccess) {
              try {
                console.log('Attempting direct JSON parse...');
                const parsedData = JSON.parse(cleanedString);
                
                if (parsedData.Scenario && parsedData.Questions) {
                  scenarioText = parsedData.Scenario;
                  parsedQuestions = parsedData.Questions;
                  parseSuccess = true;
                  console.log('Direct parsing successful');
                } else if (parsedData.questions) {
                  parsedQuestions = parsedData.questions;
                  parseSuccess = true;
                  console.log('Direct parsing successful (questions field)');
                } else if (Array.isArray(parsedData)) {
                  parsedQuestions = parsedData;
                  parseSuccess = true;
                  console.log('Direct parsing successful (array)');
                }
              } catch (directError) {
                console.warn('Direct parsing failed:', directError.message);
              }
            }

            if (!parseSuccess) {
              try {
                console.log('Attempting JSON extraction...');
                const jsonMatch = cleanedString.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const extractedJson = jsonMatch[0];
                  console.log('Extracted JSON:', extractedJson.substring(0, 200));
                  
                  const parsedData = JSON.parse(extractedJson);
                  
                  if (parsedData.Scenario && parsedData.Questions) {
                    scenarioText = parsedData.Scenario;
                    parsedQuestions = parsedData.Questions;
                    parseSuccess = true;
                    console.log('JSON extraction successful');
                  }
                }
              } catch (extractError) {
                console.warn('JSON extraction failed:', extractError.message);
              }
            }

            if (!parseSuccess) {
              try {
                console.log('Attempting enhanced regex extraction...');
                
                const scenarioPatterns = [
                  /"Scenario"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/,
                  /'Scenario'\s*:\s*'([^']*(?:\\.[^']*)*)'/,
                  /Scenario["\s]*:["\s]*([^"'\n\r]*)/
                ];
                
                for (const pattern of scenarioPatterns) {
                  const scenarioMatch = cleanedString.match(pattern);
                  if (scenarioMatch) {
                    scenarioText = scenarioMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                    console.log('Scenario extracted:', scenarioText.substring(0, 100));
                    break;
                  }
                }

                const questionsPatterns = [
                  /"Questions"\s*:\s*(\[[\s\S]*?\](?=\s*[,}]|$))/,
                  /'Questions'\s*:\s*(\[[\s\S]*?\](?=\s*[,}]|$))/,
                  /Questions["\s]*:["\s]*(\[[\s\S]*?\])/
                ];
                
                let questionsStr = null;
                for (const pattern of questionsPatterns) {
                  const questionsMatch = cleanedString.match(pattern);
                  if (questionsMatch) {
                    questionsStr = questionsMatch[1];
                    console.log('Questions string extracted:', questionsStr.substring(0, 200));
                    break;
                  }
                }

                if (questionsStr) {
                  questionsStr = questionsStr
                    .replace(/,(\s*[\]}])/g, '$1')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                  
                  console.log('Cleaned questions string:', questionsStr.substring(0, 200));
                  parsedQuestions = JSON.parse(questionsStr);
                  parseSuccess = true;
                  console.log('Enhanced regex extraction successful');
                }
              } catch (regexError) {
                console.warn('Enhanced regex extraction failed:', regexError.message);
              }
            }

            if (!parseSuccess) {
              console.log('Attempting line-by-line text parsing...');
              const lines = cleanedString.split(/[\n\r]+/);
              let tempQuestions = [];
              let currentQuestion = {};
              
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.includes('QuestionStem') || trimmed.includes('QuestionText')) {
                  if (Object.keys(currentQuestion).length > 0) {
                    tempQuestions.push(currentQuestion);
                  }
                  
                 
                }
              }
              if (Object.keys(currentQuestion).length > 0) {
                tempQuestions.push(currentQuestion);
              }
              
              if (tempQuestions.length > 0) {
                parsedQuestions = tempQuestions;
                scenarioText = 'Questions were extracted from malformed text. Please regenerate for better quality.';
                parseSuccess = true;
                console.log('Line-by-line parsing successful');
              }
            }

            if (!parseSuccess) {
              console.log('All parsing strategies failed, using final fallback');
             
              scenarioText = `Parsing Error - Unable to extract questions from API 
                Try regenerating questions `;
            }

          } else if (Array.isArray(questionsString)) {
            parsedQuestions = questionsString;
            console.log('Using array of questions directly');
          } else if (questionsString && typeof questionsString === 'object') {
            if (questionsString.Scenario && questionsString.Questions) {
              scenarioText = questionsString.Scenario;
              parsedQuestions = questionsString.Questions;
              console.log('Using object with Scenario and Questions');
            } else {
              parsedQuestions = [questionsString];
              console.log('Using single question object');
            }
          }

          if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
            throw new Error('No valid questions could be extracted from the response');
          }

          const updatedQuestions = parsedQuestions.map((q, index) => ({
            QuestionText: q.QuestionStem || q.QuestionText || q.question || q.text || `Question ${index + 1}`,
            Options: q.Options ? (typeof q.Options === 'object' ? Object.values(q.Options) : q.Options) : (q.options || []),
            CorrectAnswer: q.CorrectAnswer || q.correctAnswer || q.answer || 'N/A',
            Explanation: q.Feedback?.Correct || q.Explanation || q.explanation || '',
            Hint: q.Feedback?.Hint || q.Hint || q.hint || '',
            Tags: q.Tags || q.tags || formData.tags || [],
            showAnswer: false,
            showHint: false,
            feedback: q.Feedback || {},
            optionLabels: q.Options && typeof q.Options === 'object' ? Object.keys(q.Options) : ['A', 'B', 'C', 'D']
          }));

          setScenario(scenarioText);
          setQuestions(updatedQuestions);
          console.log('🎉 Successfully processed questions:', updatedQuestions.length);
          setLoading(false);
          return;

        } catch (err) {
          if (!isMounted) return;

          if (axios.isCancel(err)) {
            console.log('Request canceled by user or component unmount.');
            setLoading(false);
            return;
          }

          console.error(`Attempt ${i + 1} failed:`, err);

          let errorMessage = err.message;
          let debugDetails = '';

          if (err.code === 'ECONNABORTED') {
            errorMessage = 'Request timeout - API took too long to respond (>60s)';
            debugDetails = 'Try reducing the number of questions or check API performance.';
          } else if (err.response?.status === 0 || err.code === 'ERR_NETWORK') {
            errorMessage = 'Network error - Cannot reach the API server';
            debugDetails = `Check if the API is accessible: ${apiUrl}`;
          } else if (err.response?.status >= 500) {
            errorMessage = 'Server error - API is experiencing internal issues';
            debugDetails = 'This is likely a temporary issue. Please try again.';
          } else if (err.response?.status === 403) {
            errorMessage = 'Forbidden - Access denied to API resource';
            debugDetails = 'Check API authentication or CORS configuration.';
          } else if (err.response?.status === 404) {
            errorMessage = 'API endpoint not found';
            debugDetails = `Verify API URL: ${apiUrl}`;
          } else if (err.message.includes('CORS')) {
            errorMessage = 'CORS policy error - Browser blocked the request';
            debugDetails = 'API needs proper CORS headers for production deployment.';
          }
          
          if (i < retries - 1) {
            const delay = baseDelay * Math.pow(2, i);
            console.warn(`Retrying in ${delay}ms... (${i + 2}/${retries})`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            const finalError = `${errorMessage}${debugDetails ? '\n\n🔧 ' + debugDetails : ''}`;
            setError(finalError);
            setDebugInfo(`
               Final Error Details:
              - Environment: ${import.meta.env.DEV ? 'Development' : 'Production'}  
              - Mode: ${import.meta.env.MODE}
              - API URL: ${apiUrl}
              - Error Type: ${err.constructor.name}
              - Status: ${err.response?.status || 'No response'}
              - Message: ${err.message}
              - Timestamp: ${new Date().toISOString()}
            `);
            setLoading(false);
          }
        }
      }
    };

    fetchQuestions();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [formData, trigger]);

  const renderBlanks = (text) => {
    const parts = text?.split(/(\$\s*_{3,}\s*\$|\$+.*?\$+)/g) || [];
    return parts.map((part, i) => {
      if (part?.startsWith('$') && part?.endsWith('$')) {
        return (
          <input
            key={i}
            type="text"
            placeholder=" "
            className="border-b-2 border-white bg-transparent mx-1 px-2 w-24 text-white focus:outline-none"
            aria-label="Fill in the blank"
          />
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const toggleAnswer = (index) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, showAnswer: !q.showAnswer } : q))
    );
  };

  const toggleHint = (index) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, showHint: !q.showHint } : q))
    );
  };

  const formatQuestionType = (questionType) => {
    if (!questionType) return 'Multiple Choice';
    if (questionType.includes('Case-based')) return 'Case-Based Multiple Choice';
    if (questionType.includes('MCQs') && questionType.includes('Fill-in-the-Blanks')) {
      return 'Multiple Choice & Fill-in-the-Blanks';
    }
    if (questionType.includes('MCQs')) return 'Multiple Choice';
    if (questionType.includes('Fill-in-the-Blanks')) return 'Fill-in-the-Blanks';
    return questionType;
  };

  return (
    <div className="bg-[#0D0D0D] rounded-[9px] p-4 text-white mt-4 w-full max-w-[1081px] border border-[#7DB8FF] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="font-medium text-[20px] sm:text-[25px] font-inter">
          No. Of Questions: {questions.length}
        </div>
        <div className="text-sm text-gray-400">
          Question Type: {formatQuestionType(formData?.Question_Style || formData?.question_type)}
        </div>
        <button
          type="button"
          onClick={exportQuestions}
          disabled={questions.length === 0 || loading}
          className={`w-full sm:w-auto ${
            questions.length === 0 || loading 
              ? 'bg-gray-500 cursor-not-allowed' 
              : 'bg-[#0296E0] hover:bg-[#0280C7]'
          } text-[#0D0D0D] font-poppins font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors`}
        >
          <img src={generateIcon} alt="Generate" />
          <span>Export</span>
        </button>
      </div>
      <hr className="border-t border-[#B8B8B8] my-4" />
      <div className="space-y-6 max-h-[1030px] overflow-y-auto pr-2">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-full min-h-[200px] space-y-4">
            <svg
              className="animate-spin h-8 w-8 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-gray-300">Generating questions...</p>
            
          </div>
        ) : error ? (
          <div className="p-4 bg-red-900/20 border border-red-500 rounded-md">
            <p className="text-red-400 font-semibold mb-2">Error Loading Questions</p>
            <pre className="text-red-300 text-sm mb-3 whitespace-pre-wrap">{error}</pre>
            
          </div>
        ) : questions.length === 0 ? (
          <p className="text-sm text-gray-400">
            No questions generated. Please submit the form or upload a file to generate questions.
          </p>
        ) : (
          <>
            {scenario && (
              <div className="p-4 bg-[#2A2A2A] rounded-md border-l-4 border-blue-400 mb-6">
                <p className="text-gray-200 leading-relaxed">{scenario}</p>
              </div>
            )}

            {questions.map((q, index) => {
              const isFillInTheBlank = (formData?.Question_Style || formData?.question_type)?.includes('Fill-in-the-Blanks');
              const isMultipleChoice = (formData?.Question_Style || formData?.question_type)?.includes('MCQs') || 
                                     (formData?.Question_Style || formData?.question_type)?.includes('Case-based MCQ') ||
                                     q.Options.length > 0;

              return (
                <div key={index} className="p-4 bg-[#1A1A1A] rounded-md border border-gray-700">
                  <p className="text-lg font-semibold mb-3 text-white">
                    Q{index + 1}:{' '}
                    {isFillInTheBlank && /\$\s*_{3,}\s*\$|\$+.*?\$+/.test(q.QuestionText)
                      ? renderBlanks(q.QuestionText)
                      : q.QuestionText}
                  </p>

                  {isMultipleChoice && q.Options && q.Options.length > 0 && (
                    <div className="ml-4 mb-4">
                      {q.Options.map((option, i) => (
                        <div key={i} className="flex items-start gap-3 mb-2 p-2 hover:bg-[#2A2A2A] rounded">
                          <div className="flex-shrink-0 w-6 h-6 border border-gray-500 rounded flex items-center justify-center text-sm font-medium">
                            {q.optionLabels ? q.optionLabels[i] : String.fromCharCode(65 + i)}
                          </div>
                          <span className="text-gray-200">{option}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isFillInTheBlank && !/\$\s*_{3,}\s*\$|\$+.*?\$+/.test(q.QuestionText) && (
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Enter your answer here..."
                        className="border border-gray-500 bg-[#2A2A2A] rounded px-3 py-2 w-full text-white focus:outline-none focus:border-blue-400"
                        aria-label="Fill in the blank"
                      />
                    </div>
                  )}

                  <div className="flex gap-4 mb-3">
                    {q.Hint && (
                      <button
                        onClick={() => toggleHint(index)}
                        className="text-yellow-400 text-sm hover:text-yellow-300 transition-colors"
                      >
                        {q.showHint ? 'Hide Hint' : 'Show Hint'}
                      </button>
                    )}
                    {q.CorrectAnswer && q.CorrectAnswer !== 'N/A' && (
                      <button
                        onClick={() => toggleAnswer(index)}
                        className="text-green-400 text-sm hover:text-green-300 transition-colors"
                      >
                        {q.showAnswer ? 'Hide Answer' : 'Show Answer'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {q.showHint && q.Hint && (
                      <div className="p-3 bg-yellow-900/20 border-l-4 border-yellow-400 rounded">
                        <p className="text-yellow-200">
                          <strong className="text-yellow-400">Hint:</strong> {q.Hint}
                        </p>
                      </div>
                    )}
                    
                    {q.showAnswer && (
                      <div className="space-y-2">
                        <div className="p-3 bg-green-900/20 border-l-4 border-green-400 rounded">
                          <p className="text-green-200">
                            <strong className="text-green-400"> Correct Answer: </strong> {q.CorrectAnswer}
                          </p>
                        </div>
                        
                        {q.Explanation && (
                          <div className="p-3 bg-blue-900/20 border-l-4 border-blue-400 rounded">
                            <p className="text-blue-200">
                              <strong className="text-blue-400">📝 Explanation:</strong> {q.Explanation}
                            </p>
                          </div>
                        )}
                        
                        {q.feedback?.Incorrect && (
                          <div className="p-3 bg-red-900/20 border-l-4 border-red-400 rounded">
                            <p className="text-red-200">
                              <strong className="text-red-400">If Incorrect:</strong> {q.feedback.Incorrect}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {((q.Tags && q.Tags.length > 0) || (formData?.tags && formData.tags.length > 0)) && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-400 font-medium">Tags:</span>
                        {(q.Tags && q.Tags.length > 0 ? q.Tags : formData.tags.filter(tag => tag.trim())).map((tag, tagIndex) => (
                          <span key={tagIndex} className="px-2 py-1 bg-purple-900/30 text-purple-200 text-xs rounded-full border border-purple-500/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionBar;