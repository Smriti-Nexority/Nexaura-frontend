import { useState } from 'react';
import AssessmentForm from './AssessmentForm';
import QuestionBar from './QuestionBar';

const AssessmentDashboard = ({ formData: externalFormData, setFormData, trigger, setTrigger, questionCategory, showFileInput, onFileUpload }) => {
  const [localFormData, setLocalFormData] = useState({
    subject: 'Mathematics',
    topic: '',
    question_type: 'multiple-choice',
    max_question: 6,
    blooms_taxonomy: 'Apply',
    difficulty_level: 'Medium',
    learning_objective: 'Hands on practice',
    grade: '7',
    base_content: '',
  });

  const handleGenerate = (payload) => {
    const updatedPayload = {
      ...payload,
      topic: payload.topic?.trim() || payload.Focus_Area || 'Triangle',
      question_type: payload.question_type || payload.Question_Style || 'multiple-choice',
      max_question: payload.max_question || payload.numQuestions || payload.Questions_per_Scenario || 6,
      blooms_taxonomy: payload.blooms_taxonomy || payload.bloomsTaxonomy || 'Apply',
      difficulty_level:
        payload.difficulty_level ||
        (payload.difficulty
          ? Object.keys(payload.difficulty)
              .filter((key) => payload.difficulty[key])
              .map((key) => key.charAt(0).toUpperCase() + key.slice(1))
              .join(',') || 'Medium'
          : 'Medium'),
      learning_objective: payload.learning_objective || payload.description || 'Hands on practice',
      BASE_CONTENT: payload.BASE_CONTENT || payload.base_content || '',
    };
    setLocalFormData(updatedPayload);
    setFormData(updatedPayload);
    setTrigger(Date.now()); // Trigger question generation only on form submission
  };

  const handleFileUpload = (file, isScenarioBased, isSubjectChecked, showModal) => {
    // Handle file upload without triggering question generation
    onFileUpload(file, isScenarioBased, isSubjectChecked, showModal);
    // Ensure trigger is not updated
  };

  const formData = externalFormData || localFormData;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 w-[1250px] mx-auto bg-[#252525]">
      <div className="lg:w-[381px] flex-shrink-0">
        <AssessmentForm
          onGenerate={handleGenerate}
          externalFormData={formData}
          questionCategory={questionCategory}
          showFileInput={showFileInput}
          onFileUpload={handleFileUpload}
        />
      </div>
      <div className="flex-1">
        <QuestionBar formData={formData} trigger={trigger} />
      </div>
    </div>
  );
};

export default AssessmentDashboard;