import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error"; // added type
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = "success", duration = 2000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const bgColor = type === "error" ? "bg-red-500" : "bg-green-500";

  return (
    <div className={`fixed bottom-5 right-5 text-white px-4 py-2 rounded shadow-lg z-50 animate-slide-in ${bgColor}`}>
      {message}
    </div>
  );
};

export default Toast;
