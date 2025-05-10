<<<<<<< HEAD
import React from 'react';

const PinIcon = ({ className = "", isPinned = false, animate = false }) => {
  return (
    <svg 
      className={`${className} ${animate && isPinned ? 'hover:rotate-12 transition-transform duration-200' : ''}`}
      fill={isPinned ? 'currentColor' : 'none'} 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
=======
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
>>>>>>> e128f51d54e9660bd5aafad18d20dc2eff436891
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );
};

export default PinIcon;
