// src/components/FaqSection.jsx
import React from 'react';
import FaqItem from './FaqItem'; // Убедитесь, что путь правильный

const faqData = [
  {
    id: 1,
    question: "How can I start earning rewards with my Aptos (APT) tokens?",
    answer: "You can earn rewards by staking your Aptos (APT) tokens, which also helps secure the Aptos network. Platforms like aptcore.one offer a simple and secure way to connect your wallet, delegate your APT to our reliable validator, and receive regular staking rewards."
  },
  {
    id: 2,
    question: "What makes aptcore.one a good choice for staking Aptos?",
    answer: "aptcore.one provides a user-friendly platform with a low 4% commission on earned rewards. For the most current estimated Net and Gross APY, please see the live \"Validator Pool Details\" dashboard displayed on this page. We prioritize robust security, transparency with our open-source approach, and making Aptos staking efficient for everyone."
  },
  {
    id: 3,
    question: "Is staking Aptos (APT) through aptcore.one secure?",
    answer: "Yes, security is a top priority at aptcore.one. We operate a resilient validator node on the Aptos Mainnet and adhere to industry best practices. Aptos staking is non-custodial, meaning you always retain control of your private keys, and your tokens are delegated securely, not transferred out of your possession."
  },
  {
    id: 4,
    question: "How much Aptos (APT) do I need to start staking with aptcore.one?",
    answer: "While the Aptos network often has a recommended minimum (typically around 11 APT) for direct interactions with delegation pools, aptcore.one ensures an accessible staking experience. You can start staking with this amount and begin earning rewards."
  },
  {
    id: 5,
    question: "Is it complicated to stake Aptos if I'm new to crypto?",
    answer: "Not with aptcore.one! We've designed our platform to be intuitive and straightforward. You can easily connect common Aptos wallets (like Petra or Martian) and follow simple on-screen steps to delegate your APT, even if you're new to cryptocurrency or staking."
  }
];

const FaqSection = () => {
  return (
    <section className="w-full max-w-3xl mx-auto my-12 lg:my-16 py-8 px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-100 mb-8 md:mb-10">
        Frequently Asked Questions
      </h2>
      <div className="divide-y divide-white/10 rounded-xl bg-white/5 backdrop-blur-md border border-white/20 shadow-xl p-4 sm:p-6">
        {faqData.map((faq) => (
          <FaqItem key={faq.id} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </section>
  );
};

export default FaqSection;