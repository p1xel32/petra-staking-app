// src/components/FaqItem.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left text-lg font-semibold text-gray-100 hover:text-purple-400 focus:outline-none transition-colors duration-150"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <span>{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div
          id={`faq-answer-${question.replace(/\s+/g, '-').toLowerCase()}`} 
          className="mt-3 text-base text-zinc-300 leading-relaxed prose prose-invert max-w-none"
        >
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

export default FaqItem;