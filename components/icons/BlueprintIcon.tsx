import React from 'react';

const BlueprintIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h12A2.25 2.25 0 0 0 20.25 14.25V3.75M3.75 14.25v4.5A2.25 2.25 0 0 0 6 21h12a2.25 2.25 0 0 0 2.25-2.25v-4.5m-16.5 0h16.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 6h9M7.5 9h9m-9 3h3.375" />
    </svg>
);

export default BlueprintIcon;
