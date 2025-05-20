import React from 'react';
import { Helmet } from "react-helmet-async";
import aptcoreLogoUrl from '../assets/aptcore-logo.svg';

const StructuredData = () => {
  const SITE_URL = "https://aptcore.one";
  const VALIDATOR_POOL_ADDRESS = "0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb";
  const ORGANIZATION_ID = `${SITE_URL}/#organization`;
  const WEBSITE_ID = `${SITE_URL}/#website`;

  const faqData = [
    {
      question: "How can I start earning rewards with my Aptos (APT) tokens?",
      answer: "You can earn rewards by staking your Aptos (APT) tokens, which also helps secure the Aptos network. Platforms like aptcore.one offer a simple and secure way to connect your wallet, delegate your APT to our reliable validator, and receive regular staking rewards."
    },
    {
      question: "What makes aptcore.one a good choice for staking Aptos?",
      answer: "aptcore.one provides a user-friendly platform with a low 4% commission on earned rewards. For the most current estimated Net and Gross APY, please see the live \"Validator Pool Details\" dashboard displayed on this page. We prioritize robust security, transparency with our open-source approach, and making Aptos staking efficient for everyone."
    },
    {
      question: "Is staking Aptos (APT) through aptcore.one secure?",
      answer: "Yes, security is a top priority at aptcore.one. We operate a resilient validator node on the Aptos Mainnet and adhere to industry best practices. Aptos staking is non-custodial, meaning you always retain control of your private keys, and your tokens are delegated securely, not transferred out of your possession."
    },
    {
      question: "How much Aptos (APT) do I need to start staking with aptcore.one?",
      answer: "While the Aptos network often has a recommended minimum (typically around 11 APT) for direct interactions with delegation pools, aptcore.one ensures an accessible staking experience. You can start staking with this amount and begin earning rewards."
    },
    {
      question: "Is it complicated to stake Aptos if I'm new to crypto?",
      answer: "Not with aptcore.one! We've designed our platform to be intuitive and straightforward. You can easily connect common Aptos wallets (like Petra or Martian) and follow simple on-screen steps to delegate your APT, even if you're new to cryptocurrency or staking."
    }
  ];

  const faqPageSchema = {
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        "name": "aptcore.one",
        "url": SITE_URL,
        "description": "Secure and efficient Aptos (APT) staking with aptcore.one. Maximize rewards, minimize complexity.",
        "publisher": {
          "@id": ORGANIZATION_ID
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${SITE_URL}/search?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        "name": "aptcore.one",
        "url": SITE_URL,
        "logo": new URL(aptcoreLogoUrl, SITE_URL).href,
        "description": "aptcore.one provides a secure, reliable, and user-friendly staking service for Aptos (APT) token holders.",
        "identifier": {
          "@type": "PropertyValue",
          "propertyID": "DecentralizedIdentifier",
          "value": "did:aptos:aptcore.one"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "hello@aptcore.one",
          "contactType": "customer support"
        },
        "sameAs": [
          "https://www.youtube.com/@aptcoreone"
        ]
      },
      {
        "@type": "Service",
        "serviceType": "Aptos Staking Validator",
        "name": "aptcore.one Validator Staking Service",
        "description": "Stake your Aptos (APT) with the aptcore.one validator, operating on the Aptos Mainnet. Our service features a non-custodial, open-source platform with transparent on-chain statistics, competitive commission rates, and user-friendly tools to manage your stake. Validator Address: " + VALIDATOR_POOL_ADDRESS,
        "provider": {
          "@id": ORGANIZATION_ID
        },
        "areaServed": "Worldwide",
        "availableChannel": {
          "@type": "ServiceChannel",
          "serviceUrl": SITE_URL
        },
        "identifier": [
          {
            "@type": "PropertyValue",
            "propertyID": "validatorPoolAddress",
            "value": VALIDATOR_POOL_ADDRESS
          }
        ],
        "offers": {
          "@type": "Offer",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": 0.04,
            "priceCurrency": "APT",
            "unitText": "commission rate"
          },
          "availability": "https://schema.org/InStock",
          "validFrom": "2024-01-01"
        },
        "category": "Cryptocurrency Staking Service"
      },
      faqPageSchema // <-- ДОБАВЛЕН БЛОК FAQPAGE
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

export default StructuredData;