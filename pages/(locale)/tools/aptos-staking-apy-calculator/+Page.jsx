import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CalculatorForm from './components/CalculatorForm';
import ResultsDisplay from './components/ResultsDisplay';
import DisclaimerText from './components/DisclaimerText';
import CalculatorFAQ from './components/CalculatorFAQ';
import { usePageContext } from '../../../../renderer/usePageContext.jsx';

export default function Page() {
  const { t } = useTranslation();
  const pageContext = usePageContext();
  const { defaultApy, aptPriceUSD, error } = pageContext.data || {};

  const [formData, setFormData] = useState({
    useCustomApy: false,
    aptAmount: '',
    customApy: undefined
  });
  const [rewards, setRewards] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateRewards = useCallback((amountToCalc, apyToUse) => {
    if (!amountToCalc || !apyToUse || Number(amountToCalc) <= 0 || Number(apyToUse) <= 0) {
      setRewards([]);
      setIsCalculating(false);
      return;
    }
    setIsCalculating(true);
    const amount = parseFloat(amountToCalc);
    const dailyRate = (apyToUse / 100) / 365;
    const periods = [
      { name: t('apyCalculatorPage.results.daily'), days: 1 },
      { name: t('apyCalculatorPage.results.weekly'), days: 7 },
      { name: t('apyCalculatorPage.results.monthly'), days: 30 },
      { name: t('apyCalculatorPage.results.yearly'), days: 365 }
    ];
    const calculatedRewards = periods.map(p => ({
      period: p.name,
      apt: amount * dailyRate * p.days,
      usd: aptPriceUSD ? (amount * dailyRate * p.days) * aptPriceUSD : 0
    }));
    setRewards(calculatedRewards);
    setTimeout(() => setIsCalculating(false), 150);
  }, [aptPriceUSD, t]);

  useEffect(() => {
    if (defaultApy && formData.aptAmount === '') {
      const initialAmount = '100';
      setFormData(prev => ({...prev, aptAmount: initialAmount}));
    }
  }, [defaultApy]);

  useEffect(() => {
    const apy = formData.useCustomApy ? formData.customApy : defaultApy;
    calculateRewards(formData.aptAmount, apy);
  }, [formData, defaultApy, calculateRewards]);

  const handleFormChange = (changedValues, allValues) => {
    setFormData(allValues);
  };

  const pageUrl = "https://aptcore.one/tools/aptos-staking-apy-calculator";
  const pageTitle = t('apyCalculatorPage.meta.title');
  const pageDescription = t('apyCalculatorPage.meta.description');
  const shortTwitterDescription = t('apyCalculatorPage.meta.twitterDescription');
  
  const faqSchemaData = {
      "@context": "https://schema.org", "@type": "FAQPage",
      "mainEntity": [
          {"@type": "Question", "name": t('apyCalculatorPage.schema.faq.q1.question'), "acceptedAnswer": {"@type": "Answer", "text": t('apyCalculatorPage.schema.faq.q1.answer')}},
          {"@type": "Question", "name": t('apyCalculatorPage.schema.faq.q2.question'), "acceptedAnswer": {"@type": "Answer", "text": t('apyCalculatorPage.schema.faq.q2.answer')}},
          {"@type": "Question", "name": t('apyCalculatorPage.schema.faq.q3.question'), "acceptedAnswer": {"@type": "Answer", "text": t('apyCalculatorPage.schema.faq.q3.answer')}},
          {"@type": "Question", "name": t('apyCalculatorPage.schema.faq.q4.question'), "acceptedAnswer": {"@type": "Answer", "text": t('apyCalculatorPage.schema.faq.q4.answer')}},
          {"@type": "Question", "name": t('apyCalculatorPage.schema.faq.q5.question'), "acceptedAnswer": {"@type": "Answer", "text": t('apyCalculatorPage.schema.faq.q5.answer')}}
      ]
  };
  const softwareAppSchema = {
      "@context": "https://schema.org", "@type": "SoftwareApplication", "name": t('apyCalculatorPage.schema.software.name'),
      "applicationCategory": "FinanceApplication", "operatingSystem": "Web", "browserRequirements": "Requires a modern web browser with JavaScript enabled.",
      "description": t('apyCalculatorPage.schema.software.description'), "keywords": t('apyCalculatorPage.schema.software.keywords'),
      "author": { "@type": "Organization", "name": "aptcore.one", "url": "https://aptcore.one" }, "url": pageUrl,
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  };
  const howToSchema = {
      "@context": "https://schema.org", "@type": "HowTo", "name": t('apyCalculatorPage.schema.howTo.name'),
      "description": t('apyCalculatorPage.schema.howTo.description'),
      "step": [
          {"@type": "HowToStep", "name": t('apyCalculatorPage.schema.howTo.s1.name'), "text": t('apyCalculatorPage.schema.howTo.s1.text')},
          {"@type": "HowToStep", "name": t('apyCalculatorPage.schema.howTo.s2.name'), "text": t('apyCalculatorPage.schema.howTo.s2.text')},
          {"@type": "HowToStep", "name": t('apyCalculatorPage.schema.howTo.s3.name'), "text": t('apyCalculatorPage.schema.howTo.s3.text')}
      ],
      "tool": [{"@type": "HowToTool", "name": t('apyCalculatorPage.schema.software.name')}]
  };
  const webPageSchema = {"@context": "https://schema.org", "@type": "WebPage", "name": pageTitle, "description": pageDescription, "url": pageUrl, "isPartOf": { "@type": "WebSite", "url": "https://aptcore.one", "name": "aptcore.one" }};

  if (error) {
    return (
        <div className="flex justify-center items-center min-h-screen p-4">
            <div className="w-full max-w-md mx-auto text-center p-8 bg-red-900/40 border border-red-700/60 rounded-lg">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
                <h2 className="mt-4 text-xl font-semibold text-white">{t('apyCalculatorPage.error.title')}</h2>
                <p className="mt-2 text-red-300">{error}</p>
            </div>
        </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content="https://aptcore.one/og-image-apy-calculator.jpg" />
        <meta property="og:site_name" content="aptcore.one" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={pageUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={shortTwitterDescription} />
        <meta name="twitter:image" content="https://aptcore.one/og-image-apy-calculator.jpg" />
        <script type="application/ld+json">{JSON.stringify(webPageSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(softwareAppSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchemaData)}</script>
      </Helmet>
      
      <div className="w-full max-w-4xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight mb-4">
            {t('apyCalculatorPage.hero.title')}
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            {t('apyCalculatorPage.hero.description')}
          </p>
        </div>

        <div className="w-full rounded-3xl bg-[#0d0d1f]/70 backdrop-blur-xl border border-purple-600 p-8 sm:p-10 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
          <div className="mb-6">
            <CalculatorForm
              defaultApy={defaultApy}
              onValuesChange={handleFormChange}
              isCustomApy={!!formData.useCustomApy}
              initialValues={formData}
              isApyLoading={defaultApy === null && !error}
            />
          </div>

          {(rewards.length > 0) && (
            <>
              <hr className="my-8 border-zinc-800" />
              <ResultsDisplay
                rewards={rewards}
                aptPriceUSD={aptPriceUSD}
                showResults={true}
                isLoading={isCalculating}
                isPriceAvailable={aptPriceUSD !== null}
              />
            </>
          )}
        </div>

        <div className="mt-16 sm:mt-24">
          <CalculatorFAQ />
          <hr className="my-12 border-zinc-800" />
          <DisclaimerText />
        </div>
      </div>
    </>
  );
}