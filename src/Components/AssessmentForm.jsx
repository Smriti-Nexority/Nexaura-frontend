import React, { useState, useEffect } from 'react';
import generateIcon from './Components_assets/Generate.svg';

const defaultSimpleFormData = {
  subject: 'Mathematics',
  tags: [], // start empty, subject is separate
  questionType: 'multiple-choice',
  question_type: 'multiple-choice',
  numQuestions: 6,
  difficulty: { easy: false, medium: true, hard: false },
  description: 'Hands on practice',
  grade: '7',
  bloomsTaxonomy: 'Applying',
  title: '',
  totalMarks: '',
  totalTime: '',
  topic: '',
  max_question: 6,
  blooms_taxonomy: 'Apply',
  difficulty_level: 'Medium',
  base_content:
    'Animals require a balanced diet for optimal health. Nutritional needs vary by species, age, activity level, and health condition. Common deficiencies include lack of protein, calcium, and vitamins. Overfeeding can lead to obesity, which increases the risk of joint problems and diabetes. For example, working dogs may require high-protein diets, while senior cats often need reduced-calorie meals.',
  learning_objective: 'Hands on practice',
};

const defaultScenarioFormData = {
  subject: 'Animal Nutrition',
  tags: [],
  questionType: 'case-based',
  Question_Style: 'Case-based MCQ',
  numQuestions: 4,
  difficulty: { hard: true, easy: false, medium: false },
  description: 'Include realistic clinical situations',
  grade: 'Advanced',
  bloomsTaxonomy: 'Apply',
  title: 'Assessment Craft',
  totalMarks: '',
  totalTime: '',
  Focus_Area: 'Animal Nutrition',
  max_question: 4,
  blooms_taxonomy: 'Apply',
  difficulty_level: 'Hard',
  BASE_CONTENT: '',
  learning_objective: 'Understand nutritional requirements in clinical scenarios',
  Scenarios: '1',
  Learner_Level: 'Advanced',
  special_instruction: 'Include realistic clinical situations and avoid overly simplistic wording.',
};

const AssessmentForm = ({ onGenerate, externalFormData, questionCategory, showFileInput, onFileUpload }) => {
  const [formData, setFormData] = useState(
    questionCategory === 'scenario-based' ? defaultScenarioFormData : defaultSimpleFormData
  );
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (externalFormData) {
      const difficultyFromExternal =
        externalFormData.difficulty_level ||
        (externalFormData.difficulty
          ? Object.keys(externalFormData.difficulty).filter((key) => externalFormData.difficulty[key])
          : ['medium']);
      const difficultyLevel = Array.isArray(difficultyFromExternal)
        ? difficultyFromExternal.map((key) => key.charAt(0).toUpperCase() + key.slice(1)).join(',')
        : difficultyFromExternal;

      setFormData((prev) => ({
        ...prev,
        ...externalFormData,
        question_type:
          externalFormData.question_type ||
          externalFormData.Question_Style ||
          prev.question_type ||
          (questionCategory === 'scenario-based' ? 'Case-based MCQ' : 'multiple-choice'),
        difficulty_level: difficultyLevel,
        learning_objective:
          externalFormData.learning_objective ||
          externalFormData.description ||
          prev.learning_objective ||
          (questionCategory === 'scenario-based' ? 'Understand nutritional requirements in clinical scenarios' : 'Hands on practice'),
        Focus_Area: externalFormData.Focus_Area || externalFormData.topic || prev.Focus_Area || (questionCategory === 'scenario-based' ? 'Animal Nutrition' : ''),
        BASE_CONTENT: externalFormData.BASE_CONTENT || externalFormData.base_content || prev.BASE_CONTENT || '',
        tags: Array.isArray(externalFormData.tags) ? externalFormData.tags : prev.tags, // keep tags if provided externally
      }));
    }
  }, [externalFormData, questionCategory]);

  const validateForm = () => {
    const newErrors = {};
    if (questionCategory !== 'scenario-based') {
      if (!formData.subject) newErrors.subject = 'Subject is required';
      if (!formData.grade) newErrors.grade = 'Grade is required';
    }
    if (questionCategory === 'scenario-based') {
      if (!formData.Scenarios || parseInt(formData.Scenarios) < 1) newErrors.Scenarios = 'At least one scenario is required';
      if (!formData.numQuestions || parseInt(formData.numQuestions) < 1) newErrors.numQuestions = 'At least one question per scenario is required';
      if (!formData.BASE_CONTENT) newErrors.BASE_CONTENT = 'Base content is required';
      if (!formData.Learner_Level) newErrors.Learner_Level = 'Learner level is required';
      if (!formData.learning_objective) newErrors.learning_objective = 'Learning objective is required';
      if (!formData.Focus_Area) newErrors.Focus_Area = 'Focus area is required';
    } else {
      if (!formData.questionType) newErrors.questionType = 'Question type is required';
      if (!formData.numQuestions || parseInt(formData.numQuestions) < 1) newErrors.numQuestions = 'At least one question is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'subject') {
      // On subject change, reset tags to empty, let user add tags explicitly
      setFormData((prev) => ({
        ...prev,
        subject: value,
        tags: [],
        Focus_Area: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === 'questionType' ? { Question_Style: value === 'case-based' ? 'Case-based MCQ' : value } : {}),
      }));
    }

    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, PPT, and Word files are allowed.');
      return;
    }
    onFileUpload(file, questionCategory === 'scenario-based', false, false);
  };

  const handleDifficultyChange = (level) => {
    setFormData((prev) => ({
      ...prev,
      difficulty: { ...prev.difficulty, [level]: !prev.difficulty[level] },
    }));
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      setFormData((prev) => ({
        ...prev,
        tags: prev.tags.includes(newTag.trim()) ? prev.tags : [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const difficultyLevel = Object.keys(formData.difficulty)
      .filter((key) => formData.difficulty[key])
      .map((key) => key.charAt(0).toUpperCase() + key.slice(1))
      .join(',') || 'Medium';

    const bloomsTaxonomyForApi = formData.bloomsTaxonomy === 'Applying' ? 'Apply' : formData.bloomsTaxonomy;

    let questionTypeForApi = '';
    const totalQuestions = parseInt(formData.numQuestions) || (questionCategory === 'scenario-based' ? 4 : 6);
    const mcqCount = Math.floor(totalQuestions / 2);
    const fillInBlanksCount = totalQuestions - mcqCount;

    if (formData.questionType === 'case-based') {
      questionTypeForApi = 'Case-based MCQ';
    } else if (formData.questionType === 'multiple-choice,fill-in-the-blanks') {
      questionTypeForApi = `${mcqCount} MCQs, ${fillInBlanksCount} Fill-in-the-Blanks`;
    } else if (formData.questionType === 'multiple-choice') {
      questionTypeForApi = `${totalQuestions} MCQs`;
    } else if (formData.questionType === 'fill-in-the-blanks') {
      questionTypeForApi = `${totalQuestions} Fill-in-the-Blanks`;
    } else {
      questionTypeForApi = questionCategory === 'scenario-based' ? 'Case-based MCQ' : '6 MCQs';
    }

    // Combine subject and tags explicitly for Focus_Area in payload
    const combinedFocusArea = [formData.subject, ...formData.tags].filter(Boolean).join(',');

    const payload = {
      subject: questionCategory !== 'scenario-based' ? formData.subject : undefined,
      Focus_Area: combinedFocusArea,
      tags: formData.tags,
      Question_Style: questionTypeForApi,
      questionType: formData.questionType,
      max_question: totalQuestions,
      Questions_per_Scenario: questionCategory === 'scenario-based' ? totalQuestions : undefined,
      blooms_taxonomy: bloomsTaxonomyForApi || 'Apply',
      difficulty_level: difficultyLevel,
      learning_objective: formData.learning_objective,
      grade: formData.grade,
      BASE_CONTENT: formData.BASE_CONTENT || '',
      ...(questionCategory === 'scenario-based'
        ? {
            Scenarios: formData.Scenarios,
            Learner_Level: formData.Learner_Level,
            special_instruction: formData.special_instruction,
          }
        : {}),
      file_content: formData.file_content || undefined,
    };

    console.log('Generated payload:', JSON.stringify(payload, null, 2));
    onGenerate(payload);
  };

  return (
    <div className="bg-[#0D0D0D] rounded-xl p-6 text-white w-full max-w-sm mx-auto my-4 border border-[#7DB8FF] ">
      <form onSubmit={handleSubmit} className="space-y-6">
        {showFileInput && (
          <div>
            <label className="block text-sm font-medium mb-2">Upload File (PDF, PPT, Word)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.ppt,.pptx,.doc,.docx"
              className="w-full bg-[#0D0D0D] border border-[#2F343C] rounded-lg px-2 py-2 text-white focus:border-[#7DB8FF] focus:outline-none text-sm"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-2">
            Assessment Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Assessment Craft"
            className="w-full bg-[#0D0D0D] border border-[#2F343C] rounded-lg px-3 py-2 text-white placeholder-[#ADAEBC] focus:border-[#7DB8FF] focus:outline-none text-sm"
          />
        </div>
        {questionCategory !== 'scenario-based' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Subject / Category<span className="text-[#F15B5B]">*</span>
              </label>
              <select
                name="subject"
                value={formData.subject || ''}
                onChange={handleInputChange}
                className="w-full bg-[#0D0D0D] border border-[#2F343C] rounded-lg px-2 py-2 text-white focus:border-[#7DB8FF] focus:outline-none text-sm"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="History">History</option>
                <option value="Animal Nutrition">Animal Nutrition</option>
              </select>
              {errors.subject && <p className="text-red-400 text-sm mt-1">{errors.subject}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Grade / Class<span className="text-[#F15B5B]">*</span>
              </label>
              <select
                name="grade"
                value={formData.grade || ''}
                onChange={handleInputChange}
                className="w-full bg-[#0D0D0D] border border-[#2F343C] rounded-lg px-2 py-2 text-white focus:border-[#7DB8FF] focus:outline-none text-sm"
              >
                <option value="1">Grade 1</option>
                <option value="2">Grade 2</option>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
                <option value="Advanced">Advanced</option>
              </select>
              {errors.grade && <p className="text-red-400 text-sm mt-1">{errors.grade}</p>}
            </div>
          </>
        )}
        {questionCategory === 'scenario-based' ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Number of Scenarios<span className="text-[#F15B5B]">*</span>
              </label>
              <input
                type="number"
                name="Scenarios"
                value={formData.Scenarios || '1'}
                onChange={handleInputChange}
                min="1"
                className="w-full bg-[#0D0D0D] border border-[#2F343C] rounded-lg px-2 py-2 text-white focus:border-[#7DB8FF] focus:outline-none text-sm"
              />
              {errors.Scenarios && <p className="text-red-400 text-sm mt-1">{errors.Scenarios}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Questions per Scenario<span className="text-[#F15B5B]">*</span>
              </label>
              <input
                type="number"
                name="numQuestions"
                value={formData.numQuestions}
                onChange={handleInputChange}
                min="1"
                max="10"
                className="w-full bg-[#0D0D0D] border border-[#2F343C] rounded-lg px-2 py-2 text-white focus:border-[#7DB8FF] focus:outline-none text-sm"
              />
              {errors.numQuestions && <p className="text-red-400 text-sm mt-1">{errors.numQuestions}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Focus Area<span className="text-[#F15B5B]">*</span>
              </label>
              <input
                type="text"
                name="Focus_Area"
                value={formData.Focus_Area}
                onChange={handleInputChange}
                placeholder="e.g. Animal Nutrition"
                className="w-full bg-[#0D0D0D] border border-[#2F343C] rounded-lg px-2 py-2 text-white focus:border-[#7DB8FF] focus:outline-none text-sm"
              />
              {errors.Focus_Area && <p className="text-red-400 text-sm mt-1">{errors.Focus_Area}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Special Instructions</label>
              <textarea
                name="special_instruction"
                value={formData.special_instruction}
                onChange={handleInputChange}
                placeholder="e.g. Include realistic clinical situations"
                rows={4}
                className="w-full bg-[#0D0D0D] border border-[#2F343C] rounded-lg px-2 py-2 text-white focus:border-[#7DB8FF] focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Base Content</label>
              <textarea
                name="BASE_CONTENT"
                value={formData.BASE_CONTENT}
                onChange={handleInputChange}
                placeholder="e.g. Animals require a balanced diet..."
                rows={4}
                className="w-full bg-[#0D0D0D] border border-[#2F343C] rounded-lg px-2 py-2 text-white focus:border-[#7DB8FF] focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Learning Objective<span className="text-[#F15B5B]">*</span>
              </label>
              <textarea
                name="learning_objective"
                value={formData.learning_objective}
                onChange={handleInputChange}
                placeholder="e.g. Understand nutritional requirements in clinical scenarios"
                rows={4}
                className="w-full bg-[#0D0D0D] border border-[#2F343C] rounded-lg px-2 py-2 text-white focus:border-[#7DB8FF] focus:outline-none text-sm"
              />
              {errors.learning_objective && <p className="text-red-400 text-sm mt-1">{errors.learning_objective}</p>}
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={addTag}
                placeholder="Search and add tags..."
                className="w-full bg-[#0D0D0D] border border-[#2F343C] rounded-lg px-2 py-2 text-white focus:border-[#7DB8FF] focus:outline-none text-sm"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.isArray(formData.tags) && formData.tags.length > 0 ? (
                  formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-[#8FA9FF] px-3 py-1 rounded-full text-sm flex items-center text-[#141054] font-medium"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-2 focus:outline-none tag-button">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">No tags added</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g. Hands on practice"
                rows={4}
                className="w-full bg-[#0D0D0D] border border-[#2F343C] rounded-lg px-3 py-2 text-white placeholder-[#ADAEBC] focus:border-[#7DB8FF] focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Number of Questions<span className="text-[#F15B5B]">*</span>
              </label>
              <input
                type="range"
                name="numQuestions"
                min="1"
                max="50"
                value={formData.numQuestions}
                onChange={handleInputChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg [&::-webkit-slider-thumb]:bg-[#7DB8FF] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:-mt-1"
              />
              <div className="text-right text-sm text-gray-400">{formData.numQuestions}</div>
              {errors.numQuestions && <p className="text-red-400 text-sm mt-1">{errors.numQuestions}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Customize Question Type<span className="text-[#F15B5B]">*</span>
              </label>
              <select
                name="questionType"
                value={formData.questionType}
                onChange={handleInputChange}
                className="w-full bg-[#0D0D0D] border border-[#2F343C] rounded-lg px-2 py-2 text-white focus:border-[#7DB8FF] focus:outline-none text-sm"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="fill-in-the-blanks">Fill-in-the-Blanks</option>
                <option value="multiple-choice,fill-in-the-blanks">Multiple Choice & Fill-in-the-Blanks</option>
              </select>
              {errors.questionType && <p className="text-red-400 text-sm mt-1">{errors.questionType}</p>}
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium mb-2">Difficulty Level</label>
          <div className="flex space-x-4">
            {formData.difficulty ? (
              ['easy', 'medium', 'hard'].map((level) => (
                <label key={level} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.difficulty[level] || false}
                    onChange={() => handleDifficultyChange(level)}
                    className="rounded border-gray-600 bg-gray-700 text-[#7DB8FF] focus:ring-[#7DB8FF]"
                  />
                  <span className="capitalize">{level}</span>
                </label>
              ))
            ) : (
              <span className="text-gray-400 text-sm">Difficulty not set</span>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-[#0296E0] text-black font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-transform duration-200 hover:scale-105 generate-button"
        >
          <img src={generateIcon} alt="logo" />
          <span>Generate Questions</span>
        </button>
      </form>
    </div>
  );
};

export default AssessmentForm;
