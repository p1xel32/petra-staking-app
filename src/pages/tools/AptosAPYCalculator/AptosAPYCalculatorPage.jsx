// src/pages/tools/AptosAPYCalculator/AptosAPYCalculatorPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Spin, Divider } from 'antd'; 
import { Helmet } from 'react-helmet-async';
import CalculatorForm from './components/CalculatorForm';
import ResultsDisplay from './components/ResultsDisplay';
import DisclaimerText from './components/DisclaimerText';
import CalculatorFAQ from './components/CalculatorFAQ'; 
import { getDefaultApy, getAptPrice } from '../../../services/aptosService';
import { AlertTriangle } from 'lucide-react'; 

const { Title, Paragraph } = Typography;

const AptosAPYCalculatorPage = () => {
  const [formData, setFormData] = useState({
    useCustomApy: false,
    aptAmount: undefined,
    customApy: undefined,
  });
  const [defaultApy, setDefaultApy] = useState(null);
  const [aptPriceUSD, setAptPriceUSD] = useState(null);
  const [rewards, setRewards] = useState([]);

  const [isApyLoading, setIsApyLoading] = useState(true);
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsApyLoading(true);
      setIsPriceLoading(true);
      setFetchError(null);
      let errors = [];

      try {
        const apy = await getDefaultApy();
        setDefaultApy(apy);
      } catch (err) {
        console.error("Failed to fetch default APY:", err);
        setDefaultApy(null);
        errors.push('Failed to load network APY.');
      } finally {
        setIsApyLoading(false);
      }

      try {
        const price = await getAptPrice();
        setAptPriceUSD(price);
      } catch (err) {
        console.error("Failed to fetch APT price:", err);
        setAptPriceUSD(null);
        errors.push('Failed to load APT price.');
      } finally {
        setIsPriceLoading(false);
      }

      if (errors.length > 0) {
        setFetchError(errors.join(' '));
      }
    };
    fetchData();
  }, []);

  const calculateRewards = useCallback(() => {
    if (!formData.aptAmount || Number(formData.aptAmount) <= 0) {
      setRewards([]);
      return;
    }
    setIsCalculating(true);
    const amount = parseFloat(formData.aptAmount);
    let currentApyToUse = null;

    if (formData.useCustomApy && formData.customApy !== undefined && formData.customApy !== null) {
        currentApyToUse = parseFloat(formData.customApy);
    } else if (defaultApy !== null && defaultApy !== undefined) {
        currentApyToUse = defaultApy;
    }

    if (currentApyToUse === null || isNaN(currentApyToUse) || currentApyToUse < 0 || isNaN(amount)) {
      setRewards([]);
      setIsCalculating(false);
      return;
    }

    const dailyRate = (currentApyToUse / 100) / 365;
    const periods = [
      { name: 'Daily', days: 1 }, { name: 'Weekly', days: 7 },
      { name: 'Monthly', days: 30 }, { name: 'Yearly', days: 365 },
    ];

    const calculatedRewards = periods.map(p => ({
      period: p.name,
      apt: amount * dailyRate * p.days,
      usd: aptPriceUSD !== null && aptPriceUSD !== undefined ? (amount * dailyRate * p.days) * aptPriceUSD : 0,
    }));

    setRewards(calculatedRewards);
    setTimeout(() => setIsCalculating(false), 150);
  }, [formData, defaultApy, aptPriceUSD]);


  useEffect(() => {
    const canUseDefaultApy = defaultApy !== null && defaultApy !== undefined;
    const canUseCustomApy = formData.useCustomApy && formData.customApy !== undefined && formData.customApy !== null;
    const canCalculateBasedOnApy = canUseCustomApy || (!formData.useCustomApy && canUseDefaultApy);

    if (formData.aptAmount && Number(formData.aptAmount) > 0 && canCalculateBasedOnApy) {
      calculateRewards();
    } else if (!formData.aptAmount || Number(formData.aptAmount) <= 0) {
      setRewards([]);
    }
  }, [formData.aptAmount, formData.useCustomApy, formData.customApy, defaultApy, calculateRewards]);


  const handleFormChange = (changedValues, allValues) => {
    setFormData(allValues);
  };

  const isLoadingOverall = isApyLoading || isPriceLoading;
  const isPriceAvailableForDisplay = aptPriceUSD !== null && aptPriceUSD !== undefined;
  
  const pageUrl = "https://aptcore.one/tools/aptos-staking-apy-calculator"; 
  const pageTitle = "Aptos (APT) Staking Yield Calculator | Estimate Earnings | Aptcore.one";
  const pageDescription = "Use the free Aptos (APT) staking APY calculator by Aptcore.one to estimate your potential daily, weekly, monthly, and yearly staking rewards in APT and USD.";

  // FAQ data for schema (should match content in CalculatorFAQ.jsx)
  const faqSchemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is APY and how is it different from APR?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "APY (Annual Percentage Yield) includes the effect of compounding interest, meaning that earnings are reinvested to generate their own earnings. APR (Annual Percentage Rate) does not include compounding. This calculator primarily focuses on APY."
        }
      },
      {
        "@type": "Question",
        "name": "Is the 'Current estimated network APY' accurate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The network APY displayed is an estimate based on current on-chain data from the Aptos network. It can fluctuate and serves as a current estimate, not a guaranteed rate."
        }
      },
      {
        "@type": "Question",
        "name": "Are validator commissions included in this calculation?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, this calculator shows gross earnings before any validator commissions are deducted. Factor in your chosen validator's commission for net earnings."
        }
      },
      {
        "@type": "Question",
        "name": "How often are staking rewards actually distributed on Aptos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Aptos network rewards are typically distributed at the end of each epoch. The calculator simplifies this into daily, weekly, etc., projections based on APY."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use this calculator for any Aptos validator?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, you can use the 'Specify your own APY' option if you know the specific APY offered by a validator or if you want to explore different scenarios. The default network APY is a general network estimate."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Aptos (APT) Staking APY Calculator | Aptcore.one" />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Aptcore.one" />
        {/* <meta property="og:image" content="https://aptcore.one/og-image-calculator.png" /> */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Aptos (APT) Staking APY Calculator | Aptcore.one" />
        <meta name="twitter:description" content="Calculate your potential Aptos staking rewards with the Aptcore.one APY tool." />
        {/* <meta name="twitter:image" content="https://aptcore.one/twitter-image-calculator.png" /> */}

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": pageTitle,
            "description": pageDescription,
            "url": pageUrl,
            "isPartOf": { "@type": "WebSite", "url": "https://aptcore.one", "name": "Aptcore.one" }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Use the Aptos APY Staking Calculator on Aptcore.one",
            "description": "Calculate your potential Aptos (APT) staking rewards with the Aptcore.one APY calculator by entering your stake amount and optionally a custom APY.",
            "step": [
              {"@type": "HowToStep", "name": "Enter Staking Amount", "text": "Input the total amount of APT you plan to stake into the 'Amount of APT to stake' field."},
              {"@type": "HowToStep", "name": "Specify APY (Optional)", "text": "The calculator uses the current estimated network APY by default. If you want to use a different APY, check 'Specify your own APY' and enter your desired percentage." },
              {"@type": "HowToStep", "name": "View Estimated Returns", "text": "The calculator will automatically display your estimated earnings for daily, weekly, monthly, and yearly periods in both APT and its approximate USD value."}
            ],
            "tool": [{"@type": "HowToTool", "name": "Aptos (APT) Staking Yield Calculator on Aptcore.one"}]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Aptos APY Staking Calculator",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web",
            "browserRequirements": "Requires a modern web browser with JavaScript enabled.",
            "description": "A free online tool by Aptcore.one to calculate and estimate potential earnings from staking Aptos (APT) tokens based on stake amount and APY.",
            "author": { "@type": "Organization", "name": "Aptcore.one", "url": "https://aptcore.one" },
            "url": pageUrl,
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchemaData)}
        </script>
      </Helmet>

      <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
        {isLoadingOverall && (
          <div className="py-10 text-center">
            <Spin size="large" />
            <p className="text-gray-400 mt-4 text-base">Loading initial data...</p>
          </div>
        )}
        {!isLoadingOverall && fetchError && (
          <div className="mb-6 p-4 bg-red-900/40 border border-red-700/60 text-red-300 rounded-lg text-sm flex items-center gap-x-3">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <div>
              <strong className="font-semibold block text-red-200">Data Loading Error</strong>
              <span>{`Failed to load some data: ${fetchError}. Some functions may be limited. Please refresh.`}</span>
            </div>
          </div>
        )}

        {!isLoadingOverall && (
          <>
            <div className="text-center mb-10 sm:mb-12">
              <Title level={1} className="!text-3xl sm:!text-4xl font-bold !mb-3 tracking-tight !text-white">
                Aptos Staking Yield Calculator
              </Title>
              <Paragraph className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto">
                Estimate your potential profit from staking APT tokens.
                Enter the amount you plan to stake and use the current network APY or specify your own.
              </Paragraph>
            </div>

            <div className="mb-10 sm:mb-12">
              <CalculatorForm
                defaultApy={defaultApy}
                onValuesChange={handleFormChange}
                isCustomApy={!!formData.useCustomApy}
                initialValues={formData}
                isApyLoading={isApyLoading}
              />
            </div>

            {(formData.aptAmount && Number(formData.aptAmount) > 0 && rewards.length > 0) && (
              <div className="mb-10 sm:mb-12">
                <Divider className="!my-6 sm:!my-8 !bg-slate-700/70" />
                <ResultsDisplay
                  rewards={rewards}
                  aptPriceUSD={aptPriceUSD}
                  showResults={true}
                  isLoading={isCalculating}
                  isPriceAvailable={isPriceAvailableForDisplay}
                />
              </div>
            )}
            
            <Divider className="!my-10 sm:!my-12 !bg-slate-700/60" />
            
            <CalculatorFAQ />

            <div className="mt-10 sm:mt-12 pt-6 border-t border-gray-700/50">
              <DisclaimerText />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AptosAPYCalculatorPage;
