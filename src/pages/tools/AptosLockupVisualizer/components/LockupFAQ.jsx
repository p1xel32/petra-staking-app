// src/pages/tools/AptosLockupVisualizer/components/LockupFAQ.jsx
import React, { useState } from 'react';
import { Typography, Space } from 'antd';
import { ChevronDown, HelpCircle } from 'lucide-react';

const { Title } = Typography;

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-3.5 border-b border-slate-700/60 last:border-b-0 first:pt-0"> {/* Removed last:pb-0 from here, container will handle bottom padding */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left focus:outline-none group py-1"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question.replace(/\s+/g, '-')}`}
      >
        <span className="text-base font-medium text-slate-100 group-hover:text-purple-300 transition-colors">
          {question}
        </span>
        <ChevronDown
          size={20}
          className={`text-purple-400 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } group-hover:text-purple-300`}
        />
      </button>
      {isOpen && (
        <div 
          id={`faq-answer-${question.replace(/\s+/g, '-')}`}
          className="mt-2.5 pr-6 pb-1"
        >
          <p className="text-sm text-slate-300 leading-relaxed">
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
    // Added more top margin to the entire FAQ section
    <div className="mt-10 sm:mt-12"> 
      <Title level={2} className="!text-2xl sm:!text-3xl !font-semibold !mb-6 sm:!mb-8 text-center !text-white">
        {/* Increased gap in Space component for icon and text */}
        <Space align="center" size="middle"> 
          <HelpCircle size={28} className="text-purple-400" />
          <span>Lockup & Unstaking FAQs</span>
        </Space>
      </Title>
      {/* Ensured padding on the container of FAQ items */}
      <div className="space-y-0 bg-slate-800/40 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 sm:p-6 shadow-md">
        {faqData.map((item, index) => (
          <FaqItem key={index} question={item.question} answer={item.answer} />
        ))}
      </div>
    </div>
  );
};

export default LockupFAQ;
