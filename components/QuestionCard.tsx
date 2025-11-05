
import React from 'react';
import type { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  onAnswerSelect: (selectedIndex: number) => void;
  selectedAnswerIndex: number | null;
  isAnswered: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswerSelect, selectedAnswerIndex, isAnswered }) => {

  const getButtonClass = (index: number) => {
    if (!isAnswered) {
      return "bg-white hover:bg-slate-100 text-slate-800";
    }

    const isCorrect = index === question.correctAnswerIndex;
    const isSelected = index === selectedAnswerIndex;

    if (isCorrect) {
      return "bg-green-500 text-white transform scale-105 shadow-lg";
    }
    if (isSelected && !isCorrect) {
      return "bg-red-500 text-white";
    }
    
    return "bg-white text-slate-500 opacity-70";
  };

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8" style={{ minHeight: '3em' }}>
        {question.question}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswerSelect(index)}
            disabled={isAnswered}
            className={`
              p-4 rounded-lg shadow-md text-left text-lg
              font-semibold transition-all duration-300 ease-in-out
              disabled:cursor-not-allowed
              ${getButtonClass(index)}
            `}
          >
            <span className="mr-3 font-bold">{String.fromCharCode(65 + index)}.</span>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
