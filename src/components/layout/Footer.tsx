/**
 * SmartEducate Footer
 * Ultra-subtle, quiet footnote that does not compete with the role-selection experience.
 */

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 sm:py-6 mt-auto text-center pointer-events-none select-none">
      <p className="text-xs text-slate-400/80 dark:text-slate-500 font-medium tracking-wider">
        SmartEducate
      </p>
    </footer>
  );
};
