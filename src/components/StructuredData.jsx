// src/components/StructuredData.jsx
import React from 'react';

// Используем импорт всего пространства имен для react-helmet-async
import { Helmet, HelmetProvider } from '@/lib/helmet';

const StructuredData = ({ data }) => {
  if (!data) {
    return null;
  }

  // Убедимся, что Helmet действительно является компонентом перед использованием
  if (!Helmet || typeof Helmet !== 'function') {
    console.error("StructuredData.jsx: ReactHelmetAsync.Helmet is not a function or undefined. Imported module:", ReactHelmetAsync);
    // Можно вернуть null или заглушку, чтобы избежать падения рендера
    return null;
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
};

export default StructuredData;
