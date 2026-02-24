import React from 'react';

const BuilderIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2.5a4.493 4.493 0 0 0-4.43 3.65c-2.34.7-4.14 2.89-4.14 5.35v1.21a.5.5 0 0 0 .5.5h16.14a.5.5 0 0 0 .5-.5v-1.21c0-2.46-1.8-4.65-4.14-5.35A4.493 4.493 0 0 0 12 2.5zM12 4a2.5 2.5 0 0 1 2.45 2.12a.5.5 0 0 0 .49.38h.06c2.11.08 3.73 1.95 3.73 4.21v.29H5.27v-.29c0-2.26 1.62-4.13 3.73-4.21h.06a.5.5 0 0 0 .49-.38A2.5 2.5 0 0 1 12 4z"/>
        <path d="M6 14.5c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2V19c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4.5zM8 21.5h8a.5.5 0 0 1 0 1H8a.5.5 0 0 1 0-1z"/>
    </svg>
);

export default BuilderIcon;
