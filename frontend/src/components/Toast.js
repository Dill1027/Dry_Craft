import { useEffect } from 'react';

function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeClasses = {
    success: "bg-gradient-to-r from-green-500 to-green-600",
    error: "bg-gradient-to-r from-red-500 to-red-600"
  };

  const iconClasses = "w-5 h-5 text-white";

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${typeClasses[type]} text-white px-6 py-4 rounded-lg shadow-xl flex items-center space-x-3 min-w-[300px]`}>
        {type === 'success' ? (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
}

export default Toast;
