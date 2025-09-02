import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

import Sidebar from './Components/Sidebar';
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
    base_content: 'Animals require a balanced diet for optimal health. Nutritional needs vary by species, age, activity level, and health condition. Common deficiencies include lack of protein, calcium, and vitamins. Overfeeding can lead to obesity, which increases the risk of joint problems and diabetes. For example, working dogs may require high-protein diets, while senior cats often need reduced-calorie meals.',
    difficulty: { easy: false, medium: true, hard: false },
    description: 'Hands on practice',
    bloomsTaxonomy: 'Applying',
    title: '',
    totalMarks: '',
    totalTime: '',
    Scenarios: 1,
    Questions_per_Scenario: 4,
    Learner_Level: 'Advanced',
    special_instruction: 'Include realistic clinical situations.',
    Focus_Area: '',
    BASE_CONTENT: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [questionCategory, setQuestionCategory] = useState('simple');
  const [trigger, setTrigger] = useState(0);
  const [showFileInput, setShowFileInput] = useState(false);
  const [simpleQuestionType, setSimpleQuestionType] = useState('multiple-choice');
  const [scenarioLearnerLevel, setScenarioLearnerLevel] = useState('Advanced');
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef(null);

  // Function to derive Focus_Area and tags from text
  const deriveFocusArea = (text) => {
    if (!text || typeof text !== 'string') return 'General';
    const stopwords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const freq = {};
    words.forEach(word => {
      if (!stopwords.includes(word) && word.length > 3) {
        freq[word] = (freq[word] || 0) + 1;
      }
    });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 3).map(([word]) => word.charAt(0).toUpperCase() + word.slice(1)).join(', ') || 'General';
  };

  // Extract text from PDF
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
        textContent += pageText + '\n';
      }
      if (!textContent.trim()) {
        console.warn('PDF extraction returned empty content.');
        return 'Warning: Extracted PDF content is empty or unreadable.';
      }
      return textContent;
    } catch (error) {
      console.error('PDF text extraction error:', error);
      return `Error: Unable to extract text from PDF - ${error.message || error}`;
    }
  }

  // Extract text from Word (.docx)
  async function extractWordText(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const textContent = result.value;
      if (!textContent.trim()) {
        console.warn('Word document extraction returned empty content.');
        return 'Warning: Extracted Word content is empty or unreadable.';
      }
      return textContent;
    } catch (error) {
      console.error('Word text extraction error:', error);
      return `Error: Unable to extract text from Word document - ${error.message || error}`;
    }
  }

  // Extract text from PowerPoint (.pptx)
  async function extractPptText(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      let textContent = '';
      const slideFiles = Object.keys(zip.files).filter(file => file.match(/^ppt\/slides\/slide\d+\.xml$/));
      for (const slideFile of slideFiles) {
        const xmlContent = await zip.file(slideFile).async('string');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');
        const textNodes = xmlDoc.getElementsByTagName('a:t');
        for (let i = 0; i < textNodes.length; i++) {
          textContent += textNodes[i].textContent + ' ';
        }
      }
      if (!textContent.trim()) {
        console.warn('PowerPoint extraction returned empty content.');
        return 'Warning: Extracted PowerPoint content is empty or unreadable.';
      }
      return textContent;
    } catch (error) {
      console.error('PowerPoint text extraction error:', error);
      return `Error: Unable to extract text from PowerPoint - ${error.message || error}`;
    }
  }

  const handleFileUpload = async (file, isCaseBased, isSubjectChecked, showModalFlag) => {
    if (showModalFlag) {
      setShowModal(true);
      return;
    }

    let extractedText = formData.base_content || formData.BASE_CONTENT || 'Animals require a balanced diet for optimal health. Nutritional needs vary by species, age, activity level, and health condition.';

    if (file) {
      const validFileTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ];
      if (!validFileTypes.includes(file.type)) {
        alert('Only PDF, Word (.docx), and PowerPoint (.pptx) files are supported.');
        return;
      }
      setIsLoading(true);
      try {
        if (file.type === 'application/pdf') {
          extractedText = await extractPdfText(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          extractedText = await extractWordText(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
          extractedText = await extractPptText(file);
        }
        if (
          !extractedText ||
          extractedText.length < 20 ||
          extractedText.toLowerCase().startsWith('error') ||
          extractedText.toLowerCase().startsWith('warning')
        ) {
          alert('The uploaded file could not be parsed properly.');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        alert(`Error processing file: ${error.message}`);
        setIsLoading(false);
        return;
      }
    }

    const derivedFocus = deriveFocusArea(extractedText);
    const defaultParams = isCaseBased ? {
      subject: derivedFocus.split(', ')[0] || 'Animal Nutrition',
      tags: derivedFocus.split(', ').filter(Boolean),
      topic: derivedFocus,
      question_type: 'Case-based MCQ',
      questionType: 'case-based',
      max_question: formData.Scenarios * formData.numQuestions || 8,
      numQuestions: formData.numQuestions || 4,
      blooms_taxonomy: 'Apply',
      difficulty_level: 'Hard',
      learning_objective: 'Understand nutritional requirements in clinical scenarios',
      grade: 'Advanced',
      BASE_CONTENT: extractedText,
      difficulty: { easy: false, medium: false, hard: true },
      description: 'Include realistic clinical situations',
      bloomsTaxonomy: 'Apply',
      title: '',
      totalMarks: '',
      totalTime: '',
      Scenarios: formData.Scenarios || 1,
      Questions_per_Scenario: formData.numQuestions || 4,
      Learner_Level: 'Advanced',
      special_instruction: 'Include realistic clinical situations.',
      Focus_Area: derivedFocus,
    } : {
      subject: derivedFocus.split(', ')[0] || 'Mathematics',
      tags: derivedFocus.split(', ').filter(Boolean),
      topic: derivedFocus,
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

    console.log('Setting formData with content:', defaultParams);
    setFormData(defaultParams);
    setTrigger(Date.now());
    setIsLoading(false);
    setShowFileInput(true); // Show file input after upload
  };

  const handleModalSelect = (category, showFileInput = true) => {
    const extractedContent = formData.base_content || formData.BASE_CONTENT || 'Animals require a balanced diet for optimal health. Nutritional needs vary by species, age, activity level, and health condition.';
    const derivedFocus = deriveFocusArea(extractedContent);
    const newFormData = {
      ...formData,
      questionType: category === 'scenario-based' ? 'case-based' : simpleQuestionType,
      Question_Style: category === 'scenario-based' ? 'Case-based MCQ' : simpleQuestionType,
      Scenarios: category === 'scenario-based' ? (formData.Scenarios || 1) : undefined,
      Questions_per_Scenario: category === 'scenario-based' ? (formData.numQuestions || 4) : undefined,
      Learner_Level: category === 'scenario-based' ? scenarioLearnerLevel : undefined,
      special_instruction: category === 'scenario-based' ? 'Include realistic clinical situations.' : undefined,
      max_question: category === 'scenario-based' ? (formData.Scenarios || 1) * (formData.numQuestions || 4) : 6,
      numQuestions: formData.numQuestions || (category === 'scenario-based' ? 4 : 6),
      subject: category === 'scenario-based' ? (derivedFocus.split(', ')[0] || 'Animal Nutrition') : (derivedFocus.split(', ')[0] || 'Mathematics'),
      Focus_Area: derivedFocus,
      topic: derivedFocus,
      tags: derivedFocus.split(', ').filter(Boolean),
      difficulty_level: category === 'scenario-based' ? 'Hard' : 'Medium',
      difficulty: category === 'scenario-based' ? { hard: true, easy: false, medium: false } : { easy: false, medium: true, hard: false },
      learning_objective: category === 'scenario-based' ? 'Understand nutritional requirements in clinical scenarios' : 'Hands on practice',
      BASE_CONTENT: category === 'scenario-based' ? extractedContent : '',
      base_content: category !== 'scenario-based' ? extractedContent : '',
    };
    console.log('handleModalSelect formData:', newFormData);
    setFormData(newFormData);
    setQuestionCategory(category);
    setShowModal(false);
    if (showFileInput) {
      setShowFileInput(true); // Only show file input if explicitly allowed
    }
    setTrigger(Date.now());
  };

  // Handle subject checkbox change
  const handleSubjectCheckboxChange = (isChecked) => {
    if (isChecked) {
      handleModalSelect('simple', false); // Switch to simple question type without showing file input
    }
  };

  // Function to trigger modal manually
  const handleShowModal = () => {
    setShowModal(true);
  };

  // Function to toggle file input visibility
  const handleToggleFileInput = () => {
    setShowFileInput(true);
  };

  return (
    <>
      <Navbar
        onFileUpload={handleFileUpload}
        onShowModal={handleShowModal}
        onToggleFileInput={handleToggleFileInput}
        onSubjectCheckboxChange={handleSubjectCheckboxChange}
      />
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-white text-lg">Loading...</div>
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
                    onClick={() => handleModalSelect('simple', true)} // Show file input when selecting from modal
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
                    onClick={() => handleModalSelect('scenario-based', true)} // Show file input when selecting from modal
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