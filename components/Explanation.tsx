
import React from 'react';

interface ExplanationProps {
  text: string;
}

const Explanation: React.FC<ExplanationProps> = ({ text }) => {
  if (!text) return null;

  // Split the text into paragraphs to render them with proper spacing
  const paragraphs = text.split('\n').filter(p => p.trim() !== '');

  return (
    <div className="mt-6 p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
      <h3 className="text-xl font-bold text-blue-800 mb-3">Let's break it down:</h3>
      <div className="space-y-3 text-slate-700">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
};

export default Explanation;
