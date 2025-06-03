// pages/index/+Page.jsx
import React from 'react';
// Убедитесь, что путь к MainStakingPage корректен относительно этого файла
// или используйте alias, если он настроен в vite.config.js (например, @/pages/MainStakingPage/MainStakingPage)
import MainStakingPage from '../../src/pages/MainStakingPage/MainStakingPage';

export default function Page() { // Имя "Page" здесь - это соглашение Vike для экспорта по умолчанию
  return (
    <MainStakingPage />
  );
}