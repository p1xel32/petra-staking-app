import React from 'react';
import { useTranslation } from 'react-i18next';
import FaqItem from './FaqItem';
import StructuredData from './StructuredData';

const FaqSection = () => {
  const { t } = useTranslation();
  const faqData = t('generalFaq.items', { returnObjects: true }) || [];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <>
      <StructuredData data={faqSchema} />
      
      <section className="w-full max-w-4xl mx-auto px-4 mt-24 sm:mt-32">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-zinc-100 mb-12 tracking-tight">
          {t('generalFaq.title')}
        </h2>
        
        <div className="
          divide-y divide-zinc-800
          rounded-2xl
          bg-zinc-900/50
          border border-zinc-800
          p-6 sm:p-8
        ">
          {faqData.map((faq) => (
            <FaqItem key={faq.id} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>
    </>
  );
};

export default FaqSection;