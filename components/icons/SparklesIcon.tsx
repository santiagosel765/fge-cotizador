
import React from 'react';

const SparklesIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m1-15l1.06 1.06M18 9l1.06-1.06M18 15l1.06 1.06M9 6l-1.06-1.06M12 2v2m0 16v2m6-12h2M4 12H2m15.364 6.364l-1.414-1.414M6.05 6.05l-1.414-1.414m12.728 12.728l-1.414-1.414M6.05 17.95l-1.414 1.414" />
  </svg>
);

export default SparklesIcon;