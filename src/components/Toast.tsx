import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = "success", onClose }) => {
  const bgColor = type === "error" ? "bg-red-500" : "bg-green-600";

  useEffect(() => {
    // Set timer for 15 seconds
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 5000);

    // Cleanup timer if the user clicks the 'X' before 15s is up
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      onClick={onClose}
      className={`fixed bottom-5 right-5 cursor-pointer w-80 text-white px-4 py-3 rounded-lg shadow-2xl z-[9999] animate-slide-in flex justify-between items-center border border-white/10 group ${bgColor}`}
    >
      <span className="text-sm font-medium pr-2">{message}</span>
      
      <div className="flex items-center justify-center min-w-[24px] h-6 w-6 rounded-full bg-black/10 group-hover:bg-black/20 transition-colors">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={2.5} 
          stroke="currentColor" 
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    </div>
  );
};

export default Toast;