// src/components/Layout/AppFooter.jsx

import React from 'react';
import { Twitter, Youtube, Github, Award } from 'lucide-react';
import { PATHS, SOCIALS } from '@/config/consts.ts'; 

const AppFooter = () => {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { label: "Stake", href: PATHS.home },
    { label: "APY Calculator", href: PATHS.tools.apyCalculator },
    { label: "Lockup Visualizer", href: PATHS.tools.lockupVisualizer },
  ];
  const companyLinks = [
    { label: "About Us", href: PATHS.about },
    { label: "Contact", href: PATHS.contact },
    { label: "Disclaimer", href: PATHS.legal.disclaimer },
    { label: "Terms", href: PATHS.legal.terms },
  ];
  const resourcesLinks = [
    { label: "Blog", href: PATHS.blog },
    { label: "FAQ", href: PATHS.faq },
    { label: "Help Center", href: PATHS.help },
  ];
  const socialLinks = [
    { label: "Twitter", href: SOCIALS.twitter, Icon: Twitter },
    { label: "StakingRewards", href: SOCIALS.stakingRewards, Icon: Award },
    { label: "YouTube", href: SOCIALS.youtube, Icon: Youtube },
    { label: "GitHub", href: SOCIALS.github, Icon: Github },
  ];

  return (
    <footer className="border-t border-zinc-800/50 mt-16">
      <div className="container mx-auto px-4 py-12">

        {/* ✅ ИЗМЕНЕНИЕ ЗДЕСЬ: Заменяем сложную сетку на простую и центрированную */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10 text-left sm:text-center">
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-200">Product</h4>
            <ul className="space-y-2">
              {productLinks.map(link => (
                <li key={link.label}><a href={link.href} className="text-zinc-400 hover:text-purple-400 transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-200">Company</h4>
            <ul className="space-y-2">
              {companyLinks.map(link => (
                <li key={link.label}><a href={link.href} className="text-zinc-400 hover:text-purple-400 transition-colors">{link.label}</a></li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-200">Resources</h4>
            <ul className="space-y-2">
              {resourcesLinks.map(link => (
                <li key={link.label}><a href={link.href} className="text-zinc-400 hover:text-purple-400 transition-colors">{link.label}</a></li>
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
            <p>Secure staking infrastructure by core Aptos contributors — no slashing since day one.</p>
            <p>Verifiable On-chain</p>
          </div>
          <p>© {currentYear} aptcore.one</p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;