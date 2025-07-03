import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const faqId = `faq-${question.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="py-5"> 
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left text-lg font-semibold text-zinc-100 hover:text-purple-400 focus:outline-none transition-colors duration-150"
        aria-expanded={isOpen}
        aria-controls={faqId}
      >
        <span>{question}</span>
        {isOpen
          ? <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0" />
          : <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
        }
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={faqId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4 text-base text-zinc-300 leading-relaxed max-w-none">
              <p>{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FaqItem;