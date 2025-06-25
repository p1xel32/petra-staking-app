// src/components/StructuredData.jsx

import React from 'react';
import { Helmet } from 'react-helmet-async';

const StructuredData = ({ data }) => {
  if (!data) {
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