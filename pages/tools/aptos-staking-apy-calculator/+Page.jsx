// File: pages/tools/aptos-staking-apy-calculator/+Page.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle } from 'lucide-react';

// ✅ Убираем все импорты из 'antd'. Компоненты будут заменены.
import CalculatorForm from './components/CalculatorForm';
import ResultsDisplay from './components/ResultsDisplay';
import DisclaimerText from './components/DisclaimerText';
import CalculatorFAQ from './components/CalculatorFAQ';

export default function Page({ defaultApy, aptPriceUSD, error }) {
  // ... Ваша логика остается без изменений (useState, useEffect, useCallback) ...
  const [formData, setFormData] = useState({ useCustomApy: false, aptAmount: undefined, customApy: undefined });
  const [rewards, setRewards] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const calculateRewards = useCallback(() => {
    if (!formData.aptAmount || Number(formData.aptAmount) <= 0) { setRewards([]); return; }
    setIsCalculating(true);
    let amount = parseFloat(formData.aptAmount);
    let currentApyToUse = formData.useCustomApy ? parseFloat(formData.customApy) : defaultApy;
    if (currentApyToUse === null || isNaN(currentApyToUse) || currentApyToUse < 0 || isNaN(amount)) { setRewards([]); setIsCalculating(false); return; }
    const dailyRate = (currentApyToUse / 100) / 365;
    const periods = [{ name: 'Daily', days: 1 }, { name: 'Weekly', days: 7 }, { name: 'Monthly', days: 30 }, { name: 'Yearly', days: 365 }];
    const calculatedRewards = periods.map(p => ({ period: p.name, apt: amount * dailyRate * p.days, usd: aptPriceUSD ? (amount * dailyRate * p.days) * aptPriceUSD : 0 }));
    setRewards(calculatedRewards);
    setTimeout(() => setIsCalculating(false), 150);
  }, [formData, defaultApy, aptPriceUSD]);
  useEffect(() => {
    const canUseDefaultApy = defaultApy !== null && defaultApy !== undefined;
    const canUseCustomApy = formData.useCustomApy && formData.customApy !== undefined && formData.customApy !== null;
    if (formData.aptAmount && Number(formData.aptAmount) > 0 && (canUseCustomApy || (!formData.useCustomApy && canUseDefaultApy))) {
      calculateRewards();
    } else if (!formData.aptAmount || Number(formData.aptAmount) <= 0) {
      setRewards([]);
    }
  }, [formData.aptAmount, formData.useCustomApy, formData.customApy, defaultApy, calculateRewards]);
  const handleFormChange = (changedValues, allValues) => { setFormData(allValues); };
  
  // ... Все ваши константы для SEO остаются без изменений ...
  const pageUrl = "https://aptcore.one/tools/aptos-staking-apy-calculator";
  const pageTitle = "Interactive Aptos (APT) Staking APY Calculator – Estimate Your Rewards | aptcore.one";
  const pageDescription = "Easily calculate your potential Aptos (APT) staking rewards with aptcore.one's free APY calculator. Input stake amount & see estimated daily, monthly, and yearly earnings.";
  // ... и остальные SEO константы ...
  const shortTwitterDescription = "Calculate your potential Aptos (APT) staking rewards. Input stake amount & see estimated daily, weekly, monthly, and yearly earnings with aptcore.one's APY tool.";
  const faqSchemaData = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "What is APY and how is it different from APR?", "acceptedAnswer": {"@type": "Answer", "text": "APY (Annual Percentage Yield) includes the effect of compounding interest, meaning that earnings are reinvested to generate their own earnings. APR (Annual Percentage Rate) does not include compounding. This calculator primarily focuses on APY."}}, {"@type": "Question", "name": "Is the 'Current estimated network APY' accurate?", "acceptedAnswer": {"@type": "Answer", "text": "The network APY displayed is an estimate based on current on-chain data from the Aptos network. It can fluctuate and serves as a current estimate, not a guaranteed rate."}}, {"@type": "Question", "name": "Are validator commissions included in this calculation?", "acceptedAnswer": {"@type": "Answer", "text": "No, this calculator shows gross earnings before any validator commissions are deducted. Factor in your chosen validator's commission for net earnings."}}, {"@type": "Question", "name": "How often are staking rewards actually distributed on Aptos?", "acceptedAnswer": {"@type": "Answer", "text": "Aptos network rewards are typically distributed at the end of each epoch. The calculator simplifies this into daily, weekly, etc., projections based on APY."}}, {"@type": "Question", "name": "Can I use this calculator for any Aptos validator?", "acceptedAnswer": {"@type": "Answer", "text": "Yes, you can use the 'Specify your own APY' option if you know the specific APY offered by a validator or if you want to explore different scenarios. The default network APY is a general network estimate."}}]};
  const softwareAppSchema = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Interactive Aptos (APT) Staking APY Calculator", "applicationCategory": "FinanceApplication", "operatingSystem": "Web", "browserRequirements": "Requires a modern web browser with JavaScript enabled.", "description": "A free online tool by aptcore.one to calculate and estimate potential earnings from staking Aptos (APT) tokens based on stake amount and APY. Understand your potential daily, weekly, monthly, and yearly rewards.", "keywords": "Aptos staking APY calculator, APT APY calculator, Aptos rewards calculator, calculate Aptos staking profit, APT staking earnings estimator, how much can i earn staking aptos calculator, aptos staking potential return calculator, free aptos apy tool aptcore.one, daily aptos staking rewards calculator", "author": { "@type": "Organization", "name": "aptcore.one", "url": "https://aptcore.one" }, "url": pageUrl, "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }};
  const howToSchema = {"@context": "https://schema.org", "@type": "HowTo", "name": "How to Use the Interactive Aptos APY Staking Calculator on aptcore.one", "description": "Calculate your potential Aptos (APT) staking rewards with the aptcore.one APY calculator by entering your stake amount and optionally a custom APY.", "step": [{"@type": "HowToStep", "name": "Enter Staking Amount", "text": "Input the total amount of APT you plan to stake into the 'Amount of APT to stake' field."}, {"@type": "HowToStep", "name": "Specify APY (Optional)", "text": "The calculator uses the current estimated network APY by default. If you want to use a different APY, check 'Specify your own APY' and enter your desired percentage." }, {"@type": "HowToStep", "name": "View Estimated Returns", "text": "The calculator will automatically display your estimated earnings for daily, weekly, monthly, and yearly periods in both APT and its approximate USD value if the APT price is available."}], "tool": [{"@type": "HowToTool", "name": "Interactive Aptos (APT) Staking APY Calculator on aptcore.one"}]};
  const webPageSchema = {"@context": "https://schema.org", "@type": "WebPage", "name": pageTitle, "description": pageDescription, "url": pageUrl, "isPartOf": { "@type": "WebSite", "url": "https://aptcore.one", "name": "aptcore.one" }};


  return (
    <>
      <Helmet>
        {/* ... Весь ваш блок Helmet остается без изменений ... */}
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
      
      {/* ✅ Основной контейнер страницы */}
      <div className="w-full max-w-4xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {/* ✅ Заголовок и параграф в едином стиле */}
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight mb-4">
            Interactive Aptos (APT) Staking APY Calculator
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Estimate your potential rewards by entering a stake amount. The calculator uses a live network APY or lets you specify your own.
          </p>
        </div>

        {/* ✅ Главная карточка-контейнер для калькулятора */}
        <div className="w-full rounded-3xl bg-[#0d0d1f]/70 backdrop-blur-xl border border-purple-600 p-8 sm:p-10 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
          {error && (
            <div className="mb-6 p-4 bg-red-900/40 border border-red-700/60 text-red-300 rounded-lg text-sm flex items-center gap-x-3">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <div><strong className="font-semibold block text-red-200">Data Loading Error</strong><span>{`Failed to load some data: ${error}. Some functions may be limited.`}</span></div>
            </div>
          )}

          {/* Форма калькулятора */}
          <div className="mb-6">
            <CalculatorForm
              defaultApy={defaultApy}
              onValuesChange={handleFormChange}
              isCustomApy={!!formData.useCustomApy}
              initialValues={formData}
              isApyLoading={defaultApy === null && !error}
            />
          </div>

          {/* Результаты */}
          {(formData.aptAmount && Number(formData.aptAmount) > 0 && rewards.length > 0) && (
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

        {/* ✅ FAQ и Disclaimer в едином стиле */}
        <div className="mt-16 sm:mt-24">
          <CalculatorFAQ />
          <hr className="my-12 border-zinc-800" />
          <DisclaimerText />
        </div>
      </div>
    </>
  );
}