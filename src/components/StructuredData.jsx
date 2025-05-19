import React from 'react';
import { Helmet } from "react-helmet-async";
import aptcoreLogoUrl from '../assets/aptcore-logo.svg';

const StructuredData = () => {
  const SITE_URL = "https://aptcore.one";
  const VALIDATOR_POOL_ADDRESS = "0xf747e3a6282cc0dee1c89239c529b039c64fe48e88b50e5cedd40e9c094800bb";
  const ORGANIZATION_ID = `${SITE_URL}/#organization`;
  const WEBSITE_ID = `${SITE_URL}/#website`;

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
      }
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