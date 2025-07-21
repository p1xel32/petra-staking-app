import React from 'react';
import { useTranslation } from 'react-i18next';

import { Twitter, Youtube, Github, Award } from 'lucide-react';
import { PATHS, SOCIALS } from '@/config/consts';

const AppFooter = () => {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const currentLang = i18n.language;
  const defaultLang = 'en'; 

  const getLocalizedPath = (path) => {
    if (currentLang === defaultLang) {
      return path;
    }
    if (path === '/') {
        return `/${currentLang}`;
    }
    return `/${currentLang}${path}`;
  };

  const productLinks = [
    { label: t('footer.productLinks.stake'), href: getLocalizedPath(PATHS.home) },
    { label: t('footer.productLinks.apyCalculator'), href: getLocalizedPath(PATHS.tools.apyCalculator) },
    { label: t('footer.productLinks.lockupVisualizer'), href: getLocalizedPath(PATHS.tools.lockupVisualizer) },
  ];

  const companyLinks = [
    { label: t('footer.companyLinks.about'), href: PATHS.about, isExternal: true },
    { label: t('footer.companyLinks.contact'), href: PATHS.contact, isExternal: true },
    { label: t('footer.companyLinks.disclaimer'), href: PATHS.legal.disclaimer, isExternal: true },
    { label: t('footer.companyLinks.terms'), href: PATHS.legal.terms, isExternal: true },
  ];
  const resourcesLinks = [
    { label: t('footer.resourcesLinks.blog'), href: PATHS.blog, isExternal: true },
    { label: t('footer.resourcesLinks.faq'), href: PATHS.faq, isExternal: true },
    { label: t('footer.resourcesLinks.help'), href: PATHS.help, isExternal: true },
  ];
  const socialLinks = [
    { label: "Twitter", href: SOCIALS.twitter, Icon: Twitter },
    { label: "StakingRewards", href: SOCIALS.stakingRewards, Icon: Award },
    { label: "YouTube", href: SOCIALS.youtube, Icon: Youtube },
    { label: "GitHub", href: SOCIALS.github, Icon: Github },
  ];

  const FooterLink = ({ href, isExternal, children }) => (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="text-zinc-400 hover:text-purple-400 transition-colors"
    >
      {children}
    </a>
  );
  
  return (
    <footer className="border-t border-zinc-800/50 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10 text-left sm:text-center">
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-200">{t('footer.product')}</h4>
            <ul className="space-y-2">
              {productLinks.map(link => (
                <li key={link.label}><FooterLink href={link.href}>{link.label}</FooterLink></li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-200">{t('footer.company')}</h4>
            <ul className="space-y-2">
              {companyLinks.map(link => (
                <li key={link.label}><FooterLink href={link.href} isExternal={link.isExternal}>{link.label}</FooterLink></li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-200">{t('footer.resources')}</h4>
            <ul className="space-y-2">
              {resourcesLinks.map(link => (
                <li key={link.label}><FooterLink href={link.href} isExternal={link.isExternal}>{link.label}</FooterLink></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800/50 pt-8 text-center text-zinc-500 text-sm">
          <div className="flex justify-center items-center space-x-6 mb-6">
            {socialLinks.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-zinc-400 hover:text-purple-400 transition-colors">
                <Icon size={20} />
              </a>
            ))}
          </div>
          <div className="mb-4 text-xs space-y-1 text-zinc-400">
            <p>{t('footer.tagline.line1')}</p>
            <p>{t('footer.tagline.line2')}</p>
          </div>
          <p>{t('footer.rights', { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;