import React, { useState, useRef } from 'react';
import Sidebar  from './Components/sidebar';
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
  const fileRef = useRef(null);

  const handleFileUpload = async (file, isCaseBased, isSubjectChecked, showModalFlag) => {
    if (showModalFlag) {
      console.log('Opening modal for question type selection');
      setShowModal(true);
      return;
    }

    if (!file && !questionCategory) {
      setShowFileInput(true);
      return;
    }

    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Content = reader.result.split(',')[1];

        const caseBasedParams = {
          Scenarios: '1',
          Questions_per_Scenario: 4,
          Question_Style: 'Case-based MCQ',
          Focus_Area: 'Animal Nutrition',
          difficulty_level: 'Hard',
          Learner_Level: scenarioLearnerLevel,
          special_instruction: 'Include realistic clinical situations and avoid overly simplistic wording.',
          BASE_CONTENT: 'Animals require a balanced diet for optimal health. Nutritional needs vary by species, age, activity level, and health condition. Common deficiencies include lack of protein, calcium, and vitamins. Overfeeding can lead to obesity, which increases the risk of joint problems and diabetes. For example, working dogs may require high-protein diets, while senior cats often need reduced-calorie meals.',
          file_content: base64Content,
          max_question: 4,
          blooms_taxonomy: 'Apply',
          questionType: 'case-based',
          subject: 'Animal Nutrition',
          tags: ['Animal Nutrition'],
          learning_objective: 'Understand nutritional requirements in clinical scenarios',
          title: 'Assesssment Craft',
          totalMarks: '',
          totalTime: '',
          difficulty: { hard: true, easy: false, medium: false },
          description: 'Include realistic clinical situations',
          bloomsTaxonomy: 'Apply',
        };

        const defaultParams = {
          subject: 'Mathematics',
          tags: ['triangle'],
          topic: '',
          question_type: simpleQuestionType,
          questionType: simpleQuestionType,
          max_question: 6,
          numQuestions: 6,
          blooms_taxonomy: 'Apply',
          difficulty_level: 'Medium',
          learning_objective: 'Hands on practice',
          grade: '7',
          base_content: base64Content,
          difficulty: { easy: false, medium: true, hard: false },
          description: 'Hands on practice',
          bloomsTaxonomy: 'Applying',
          title: '',
          totalMarks: '',
          totalTime: '',
        };

        const useCaseBased = isCaseBased || isSubjectChecked || questionCategory === 'scenario-based';
        const payload = useCaseBased ? caseBasedParams : defaultParams;

        console.log('Setting formData after file upload:', JSON.stringify(payload, null, 2));
        setFormData(payload);
        setTrigger(Date.now());
      };

      reader.onerror = () => {
        alert('Error reading file. Please try again.');
      };
    }
  };

  const handleModalSelect = (category) => {
    console.log('Modal selected category:', category);
    const newFormData = {
      ...formData,
      questionType: category === 'scenario-based' ? 'case-based' : simpleQuestionType,
      Question_Style: category === 'scenario-based' ? 'Case-based MCQ' : simpleQuestionType,
      Scenarios: category === 'scenario-based' ? '1' : undefined,
      Learner_Level: category === 'scenario-based' ? scenarioLearnerLevel : undefined,
      special_instruction: category === 'scenario-based' ? 'Include realistic clinical situations and avoid overly simplistic wording.' : undefined,
      max_question: category === 'scenario-based' ? 4 : 6,
      numQuestions: category === 'scenario-based' ? 4 : 6,
      subject: category === 'scenario-based' ? 'Animal Nutrition' : 'Mathematics',
      Focus_Area: category === 'scenario-based' ? 'Animal Nutrition' : '',
      topic: category === 'scenario-based' ? 'Animal Nutrition' : '',
      tags: category === 'scenario-based' ? ['Animal Nutrition'] : ['triangle'],
      difficulty_level: category === 'scenario-based' ? 'Hard' : 'Medium',
      difficulty: category === 'scenario-based' ? { hard: true, easy: false, medium: false } : { easy: false, medium: true, hard: false },
      learning_objective: category === 'scenario-based' ? 'Understand nutritional requirements in clinical scenarios' : 'Hands on practice',
      BASE_CONTENT: category === 'scenario-based' ? '' : '',
      base_content: category === 'scenario-based' ? '' : '',
    };

    console.log('Updating formData in handleModalSelect:', JSON.stringify(newFormData, null, 2));
    setFormData(newFormData);
    setQuestionCategory(category);
    setShowModal(false);
    setShowFileInput(true);
  };

  return (
    <>
      <Navbar onFileUpload={handleFileUpload} />
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
                    onChange={(e) => {
                      setSimpleQuestionType(e.target.value);
                      console.log('Simple question type selected:', e.target.value);
                    }}
                    className="w-full bg-[#1A1A1A] text-white border border-[#2F343C] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7DB8FF] text-sm"
                    aria-label="Simple question type"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="fill-in-the-blanks">Fill-in-the-Blanks</option>
                    <option value="multiple-choice,fill-in-the-blanks">Multiple Choice & Fill-in-the-Blanks</option>
                  </select>
                  <button
                    onClick={() => handleModalSelect('simple')}
                    className="bg-blue-300 text-black font-medium py-2 px-4 rounded-md hover:bg-[#2E8CFF] active:bg-[#0278C0] transition-colors duration-200"
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
                    onChange={(e) => {
                      setScenarioLearnerLevel(e.target.value);
                      console.log('Scenario learner level selected:', e.target.value);
                    }}
                    className="w-full bg-[#1A1A1A] text-white border border-[#2F343C] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7DB8FF] text-sm"
                    aria-label="Scenario learner level"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <button
                    onClick={() => handleModalSelect('scenario-based')}
                    className="bg-blue-300 text-black font-medium py-2 px-4 rounded-md hover:bg-[#2E8CFF] active:bg-[#0278C0] transition-colors duration-200"
                    aria-label="Select Scenario-Based Questions"
                  >
                    Choose
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                console.log('Modal cancelled');
                setShowModal(false);
              }}
              className="mt-6 w-full bg-blue-300 text-black font-medium py-2 px-4 rounded-md hover:bg-gray-700 active:bg-gray-800 transition-colors duration-200"
              aria-label="Cancel question type selection"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="flex min-h-screen">
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