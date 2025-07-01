// --- START OF FILE LockupFAQ.jsx ---

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-3.5 border-b border-zinc-800 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left focus:outline-none group py-1"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-zinc-100 group-hover:text-purple-300 transition-colors">
          {question}
        </span>
        <ChevronDown
          size={20}
          className={`text-purple-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="mt-2.5 pr-6 pb-1">
          <p className="text-sm text-zinc-300 leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

const LockupFAQ = ({ faqData = [] }) => {
  if (!faqData || faqData.length === 0) {
    return null;
  }

  return (
    // ✅ Убран внешний div с фоном и рамкой
    <div> 
      <div className="flex items-center justify-center text-center mb-8">
          <HelpCircle size={28} className="text-zinc-400 mr-3" />
          <h2 className="text-3xl font-semibold text-zinc-100">
            Lockup & Unstaking FAQs
          </h2>
      </div>
      <div>
        {faqData.map((item, index) => (
          <FaqItem key={index} question={item.question} answer={item.answer} />
        ))}
      </div>
    </div>
  );
};

export default LockupFAQ;