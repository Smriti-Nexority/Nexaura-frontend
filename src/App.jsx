// App.jsx

import React, { useState, useRef } from 'react';
// Import pdfjs-dist legacy build for v4.x compatibility
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Set workerSrc to exact matching version on CDN without query parameters
pdfjsLib.GlobalWorkerOptions.workerSrc = '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs';

import Sidebar from './Components/sidebar';
import Navbar from './Components/Navbar';
import AssessmentDashboard from './Components/AssessmentDashboard';

const App = () => {
  const [formData, setFormData] = useState({
    subject: 'Mathematics',
    topic: '',
    tags: ['triangle'],
    question_type: 'multiple-choice',
    questionType: 'multiple-choice',
    max_question: 6,
    numQuestions: 6,
    blooms_taxonomy: 'Apply',
    difficulty_level: 'Medium',
    learning_objective: 'Hands on practice',
    grade: '7',
    base_content: '',
    difficulty: { easy: false, medium: true, hard: false },
    description: 'Hands on practice',
    bloomsTaxonomy: 'Applying',
    title: '',
    totalMarks: '',
    totalTime: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [questionCategory, setQuestionCategory] = useState(null);
  const [trigger, setTrigger] = useState(0);
  const [showFileInput, setShowFileInput] = useState(false);
  const [simpleQuestionType, setSimpleQuestionType] = useState('multiple-choice');
  const [scenarioLearnerLevel, setScenarioLearnerLevel] = useState('Advanced');
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef(null);

  // PDF text extraction with detailed logging and error handling
  async function extractPdfText(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let textContent = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        const pageText = text.items.map(item => item.str).join(' ');
        console.log(`Page ${i} text:`, pageText);
        textContent += pageText + '\n';
      }
      if (!textContent.trim()) {
        console.warn('PDF extraction returned empty content.');
        return 'Warning: Extracted PDF content is empty or unreadable.';
      }
      return textContent;
    } catch (error) {
      console.error('PDF text extraction error:', error);
      if (error.message && error.message.includes('worker')) {
        return 'Error: Failed to load PDF worker script. Ensure the worker script is correctly configured.';
      }
      return `Error: Unable to extract text from PDF - ${error.message || error}`;
    }
  }

  // File upload handler - extracts text and sets formData
  const handleFileUpload = async (file, isCaseBased, isSubjectChecked, showModalFlag) => {
    if (showModalFlag) {
      setShowModal(true);
      return;
    }
    if (!file && !questionCategory) {
      setShowFileInput(true);
      return;
    }
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Only PDF files are supported for text extraction.');
        return;
      }
      setIsLoading(true);
      try {
        let extractedText = await extractPdfText(file);
        if (
          !extractedText ||
          extractedText.length < 20 ||
          extractedText.toLowerCase().startsWith('error') ||
          extractedText.toLowerCase().startsWith('warning')
        ) {
          alert('The uploaded PDF could not be parsed properly. Please upload a valid text-based PDF.');
          return;
        }
        let topic = '';
        const firstLine = extractedText.split('\n')[0];
        if (firstLine && firstLine.length < 80) {
          topic = firstLine;
        }
        const defaultParams = {
          subject: 'Mathematics',
          tags: ['triangle'],
          topic,
          question_type: simpleQuestionType,
          questionType: simpleQuestionType,
          max_question: 6,
          numQuestions: 6,
          blooms_taxonomy: 'Apply',
          difficulty_level: 'Medium',
          learning_objective: 'Hands on practice',
          grade: '7',
          base_content: extractedText,
          difficulty: { easy: false, medium: true, hard: false },
          description: 'Hands on practice',
          bloomsTaxonomy: 'Applying',
          title: '',
          totalMarks: '',
          totalTime: '',
        };
        console.log('Setting formData with extracted base_content:', extractedText.substring(0, 200));
        setFormData(defaultParams);
        setTrigger(Date.now());
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleModalSelect = (category) => {
    const newFormData = {
      ...formData,
      questionType: category === 'scenario-based' ? 'case-based' : simpleQuestionType,
      Question_Style: category === 'scenario-based' ? 'Case-based MCQ' : simpleQuestionType,
      Scenarios: category === 'scenario-based' ? '1' : undefined,
      Learner_Level: category === 'scenario-based' ? scenarioLearnerLevel : undefined,
      special_instruction:
        category === 'scenario-based' ? 'Include realistic clinical situations...' : undefined,
      max_question: category === 'scenario-based' ? 4 : 6,
      numQuestions: category === 'scenario-based' ? 4 : 6,
      subject: category === 'scenario-based' ? 'Animal Nutrition' : 'Mathematics',
      Focus_Area: category === 'scenario-based' ? '' : '',
      topic: category === 'scenario-based' ? 'Animal Nutrition' : '',
      tags: category === 'scenario-based' ? ['Animal Nutrition'] : ['triangle'],
      difficulty_level: category === 'scenario-based' ? 'Hard' : 'Medium',
      difficulty:
        category === 'scenario-based'
          ? { hard: true, easy: false, medium: false }
          : { easy: false, medium: true, hard: false },
      learning_objective:
        category === 'scenario-based'
          ? 'Understand nutritional requirements...'
          : 'Hands on practice',
      BASE_CONTENT: category === 'scenario-based' ? '' : '',
      base_content: category === 'scenario-based' ? '' : '',
    };
    setFormData(newFormData);
    setQuestionCategory(category);
    setShowModal(false);
    setShowFileInput(true);
  };

  return (
    <>
      <Navbar onFileUpload={handleFileUpload} />
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-white text-lg">Loading PDF...</div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D0D0D] p-8 rounded-xl border border-[#7DB8FF] text-white max-w-md w-full shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">Select Question Type</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Simple Questions</label>
                <div className="flex items-center gap-4">
                  <select
                    value={simpleQuestionType}
                    onChange={(e) => setSimpleQuestionType(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white border border-[#2F343C] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7DB8FF] text-sm"
                    aria-label="Simple question type"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="fill-in-the-blanks">Fill-in-the-Blanks</option>
                    <option value="multiple-choice,fill-in-the-blanks">Multiple Choice & Fill-in-the-Blanks</option>
                  </select>
                  <button
                    onClick={() => handleModalSelect('simple')}
                    className="bg-blue-300 text-black font-medium py-2 px-4 rounded-md hover:bg-[#2E8CFF] active:bg-[#0278C0] transition-colors duration-200 choose-button"
                    aria-label="Select Simple Questions"
                  >
                    Choose
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Scenario-Based Questions</label>
                <div className="flex items-center gap-4">
                  <select
                    value={scenarioLearnerLevel}
                    onChange={(e) => setScenarioLearnerLevel(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white border border-[#2F343C] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7DB8FF] text-sm"
                    aria-label="Scenario learner level"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <button
                    onClick={() => handleModalSelect('scenario-based')}
                    className="bg-blue-300 text-black font-medium py-2 px-4 rounded-md hover:bg-[#2E8CFF] active:bg-[#0278C0] transition-colors duration-200 choose-button"
                    aria-label="Select Scenario-Based Questions"
                  >
                    Choose
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full bg-blue-300 text-black font-medium py-2 px-4 rounded-md hover:bg-gray-700 active:bg-gray-800 transition-colors duration-200 cancel-button"
              aria-label="Cancel question type selection"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="flex min-h-screen w-full max-w-full">
        <Sidebar />
        <div className="flex-1">
          <AssessmentDashboard
            formData={formData}
            setFormData={setFormData}
            trigger={trigger}
            setTrigger={setTrigger}
            questionCategory={questionCategory}
            showFileInput={showFileInput}
            onFileUpload={handleFileUpload}
          />
        </div>
      </div>
    </>
  );
};

export default App;
