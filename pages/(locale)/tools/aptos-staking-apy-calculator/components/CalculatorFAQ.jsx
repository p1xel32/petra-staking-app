import React, { useState } from 'react';
import { Typography, Space } from 'antd';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const { Title } = Typography;

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-4 border-b border-slate-700/60 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left focus:outline-none group"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question.replace(/\s+/g, '-')}`}
      >
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
          <p className="text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
};

const CalculatorFAQ = () => {
  const { t } = useTranslation();
  const faqData = t('apyCalculatorPage.faq.items', { returnObjects: true }) || [];

  return (
    <div className="mt-10 sm:mt-12">
      <Title level={2} className="!text-2xl sm:!text-3xl !font-semibold !mb-6 sm:!mb-8 text-center !text-white">
        <Space align="center">
          <HelpCircle size={28} className="text-purple-400" />
          <span>{t('apyCalculatorPage.faq.title')}</span>
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