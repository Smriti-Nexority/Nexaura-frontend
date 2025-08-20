import React, { useState, useEffect } from 'react';
import axios from 'axios';
import generateIcon from './Components_assets/Generate.svg';

const QuestionBar = ({ formData, trigger }) => {
  const [questions, setQuestions] = useState([]);
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
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
        ? '/api'
        : 'https://fypc6y8q41.execute-api.ap-south-1.amazonaws.com/dev';

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

      console.log('Normalized payload:', JSON.stringify(normalizedPayload, null, 2));

      for (let i = 0; i < retries; i++) {
        try {
          const response = await axios.post(apiUrl, normalizedPayload, {
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            timeout: 60000,
          });

          if (!isMounted) return;

          console.log('Raw API response:', response.data);

          if (!response.data || typeof response.data.body !== 'string') {
            throw new Error('Invalid API response structure: missing or non-string body.');
          }

          let body;
          try {
            body = JSON.parse(response.data.body);
          } catch {
            throw new Error('Failed to parse response body JSON.');
          }

          if (body.error) {
            throw new Error(`API returned an error: ${body.error}`);
          }

          // Get the raw questions string
          let questionsString = body.questions || body.Questions;
          let scenarioText = '';
          let parsedQuestions = [];

          console.log('Raw questions string:', questionsString);
          console.log('Questions string type:', typeof questionsString);
          console.log('Questions string length:', questionsString?.length);

          // Store debug info
          setDebugInfo(`Type: ${typeof questionsString}, Length: ${questionsString?.length || 0}, First 500 chars: ${questionsString?.substring(0, 500) || 'N/A'}`);

          if (typeof questionsString === 'string') {
            // Enhanced cleaning with step-by-step logging
            let cleanedString = questionsString;
            
            console.log('Step 1 - Original:', cleanedString.substring(0, 100));
            
            // Remove various wrapper patterns
            cleanedString = cleanedString
              .trim()
              .replace(/^\uFEFF/, '') // Remove BOM
              .replace(/``````/g, '') // Remove code blocks
              .replace(/^"/, '').replace(/"$/, ''); // Remove outer quotes
              
            console.log('Step 2 - After wrapper removal:', cleanedString.substring(0, 100));
            
            // Handle escaped content
            cleanedString = cleanedString
              .replace(/\\"/g, '"') // Unescape quotes
              .replace(/\\\\/g, '\\') // Unescape backslashes
              .replace(/\\n/g, '') // Remove escaped newlines
              .replace(/\\r/g, ''); // Remove escaped carriage returns
              
            console.log('Step 3 - After unescaping:', cleanedString.substring(0, 100));

            // Try different parsing strategies
            let parseSuccess = false;

            // Strategy 1: Direct parsing
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

            // Strategy 2: Extract JSON object from string
            if (!parseSuccess) {
              try {
                console.log('Attempting JSON extraction...');
                // Look for the main JSON object
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

            // Strategy 3: Enhanced regex with more flexible patterns
            if (!parseSuccess) {
              try {
                console.log('Attempting enhanced regex extraction...');
                
                // More flexible scenario extraction
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

                // More flexible questions extraction
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
                  // Clean up the questions string
                  questionsStr = questionsStr
                    .replace(/,(\s*[\]}])/g, '$1') // Remove trailing commas
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

            // Strategy 4: Line-by-line text parsing
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
                  const questionMatch = trimmed.match(/"([^"]+)"/);
                  currentQuestion = {
                    QuestionStem: questionMatch ? questionMatch[1] : 'Extracted question',
                    Options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
                    CorrectAnswer: 'A',
                    Feedback: { Correct: 'This question was extracted from malformed text.' }
                  };
                }
              }
              if (Object.keys(currentQuestion).length > 0) {
                tempQuestions.push(currentQuestion);
              }
              
              if (tempQuestions.length > 0) {
                parsedQuestions = tempQuestions;
                scenarioText = 'Enter the Assessment Form again';
                parseSuccess = true;
                console.log('Line-by-line parsing successful');
              }
            }

            // Final fallback
            if (!parseSuccess) {
              console.log('All parsing strategies failed, using fallback');
              parsedQuestions = [questionsString];
              scenarioText = 'Parsing Error - Unable to extract scenario from API response, Enter the Base content and button to generate questions';
            }
          } else if (Array.isArray(questionsString)) {
            parsedQuestions = questionsString;
          } else if (questionsString && typeof questionsString === 'object') {
            if (questionsString.Scenario && questionsString.Questions) {
              scenarioText = questionsString.Scenario;
              parsedQuestions = questionsString.Questions;
            } else {
              parsedQuestions = [questionsString];
            }
          }

          if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
            throw new Error('No valid questions could be extracted from the response');
          }

          // Transform questions to match component structure
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
          console.log('Successfully processed questions:', updatedQuestions);
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
          if (i < retries - 1) {
            console.warn(`Retrying in ${baseDelay * Math.pow(2, i)}ms...`);
            await new Promise((resolve) => setTimeout(resolve, baseDelay * Math.pow(2, i)));
          } else {
            setError(`Failed to fetch questions after ${retries} attempts: ${err.message}`);
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
          className="w-full sm:w-auto bg-[#0296E0] text-[#0D0D0D] font-poppins font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          <img src={generateIcon} alt="Generate" />
          <span>Export</span>
        </button>
      </div>
      <hr className="border-t border-[#B8B8B8] my-4" />
      <div className="space-y-6 max-h-[1030px] overflow-y-auto pr-2">
        {loading ? (
          <div className="flex justify-center items-center h-full min-h-[200px]">
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
          </div>
        ) : error ? (
          <div className="p-4 bg-red-900/20 border border-red-500 rounded-md">
            <p className="text-red-400 font-semibold mb-2">Error Loading Questions</p>
            <p className="text-red-300 text-sm mb-3">{error}</p>
            {debugInfo && (
              <details className="text-xs text-red-200">
                <summary className="cursor-pointer hover:text-red-100">Debug Information</summary>
                <div className="mt-2 p-2 bg-red-900/30 rounded font-mono text-xs overflow-x-auto">
                  {debugInfo}
                </div>
              </details>
            )}
          </div>
        ) : questions.length === 0 ? (
          <p className="text-sm text-gray-400">
            No questions generated. Please submit the form or upload a file to generate questions.
          </p>
        ) : (
          <>
            {/* Display Scenario if available */}
            {scenario && (
              <div className="p-4 bg-[#2A2A2A] rounded-md border-l-4 border-blue-400 mb-6">
                
                <p className="text-gray-200 leading-relaxed">{scenario}</p>
              </div>
            )}

            {/* Display Questions */}
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

                  {/* Multiple Choice Options */}
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

                  {/* Fill in the blank input */}
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

                  {/* Action Buttons */}
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

                  {/* Display Hint and Answer */}
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
                            <strong className="text-green-400">✅ Correct Answer:</strong> {q.CorrectAnswer}
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

                  {/* Tags */}
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
