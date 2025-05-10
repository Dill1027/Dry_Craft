import React from 'react';

const PinIcon = ({ className = "", isPinned = false, animate = false }) => {
  return (
    <svg
      className={`${className} ${animate ? 'animate-pin-wiggle' : ''} transition-colors duration-300`}
      fill={isPinned ? "currentColor" : "none"}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );
};

export default PinIcon;
