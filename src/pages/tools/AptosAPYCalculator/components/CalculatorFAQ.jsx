// src/pages/tools/AptosAPYCalculator/components/CalculatorFAQ.jsx
import React, { useState } from 'react';
import { Typography, Space } from 'antd'; // Typography for semantic elements if needed
import { ChevronDown, HelpCircle } from 'lucide-react';

const { Title, Paragraph, Text } = Typography; // Using AntD Text for consistency if you prefer

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-4 border-b border-slate-700/60 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left focus:outline-none group" // Added group for chevron hover
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question.replace(/\s+/g, '-')}`}
      >
        {/* Question Text: Ensure it's light */}
        <span className="text-base font-medium text-slate-100 dark:text-slate-100 group-hover:text-purple-300 transition-colors">
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
          className="mt-3 pr-6" 
        >
          {/* Answer Text: Ensure it's light */}
          <p className="text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

const CalculatorFAQ = () => {
  const faqData = [
    {
      question: "What is APY and how is it different from APR?",
      answer: "APY (Annual Percentage Yield) includes the effect of compounding interest, meaning that earnings are reinvested to generate their own earnings. APR (Annual Percentage Rate) does not include compounding. This calculator primarily focuses on APY to give a more complete picture of potential returns over time, though the underlying calculation for short periods is based on a daily rate derived from APY."
    },
    {
      question: "Is the 'Current estimated network APY' accurate?",
      answer: "The network APY displayed is an estimate based on current on-chain data from the Aptos network (staking config and block information). It can fluctuate frequently based on network conditions, total amount staked, and other factors. It serves as a good current estimate but is not a guaranteed rate."
    },
    {
      question: "Are validator commissions included in this calculation?",
      answer: "No, this calculator shows gross earnings before any validator commissions are deducted. Different validators charge different commission rates. You should factor in your chosen validator's commission to estimate your net earnings."
    },
    {
      question: "How often are staking rewards actually distributed on Aptos?",
      answer: "Aptos network rewards are typically distributed at the end of each epoch. An epoch is a set period of time (e.g., roughly 2 hours, but this can change). The calculator simplifies this by showing daily, weekly, etc., projections based on the annualized APY."
    },
    {
      question: "Can I use this calculator for any Aptos validator?",
      answer: "Yes, you can use the 'Specify your own APY' option if you know the specific APY offered by a validator (after their commission, if they provide that figure) or if you want to explore different scenarios. The default network APY is a general network estimate."
    }
  ];

  return (
    <div className="mt-10 sm:mt-12">
      {/* FAQ Title: Ensure it's light */}
      <Title level={2} className="!text-2xl sm:!text-3xl !font-semibold !mb-6 sm:!mb-8 text-center !text-white">
        <Space align="center">
          <HelpCircle size={28} className="text-purple-400" />
          <span>Frequently Asked Questions</span>
        </Space>
      </Title>
      <div className="space-y-0">
        {faqData.map((item, index) => (
          <FaqItem key={index} question={item.question} answer={item.answer} />
        ))}
      </div>
    </div>
  );
};

export default CalculatorFAQ;
