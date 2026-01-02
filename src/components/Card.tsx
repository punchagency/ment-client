import React from "react";

interface CardProps {
  icon?: string;
  title: string;
  value?: string | number;
  buttonText: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ icon, title, value, buttonText, onClick }) => {
  return (
    <div className="bg-gradient-to-tr from-[#6b5bff] to-[#8b65ff] p-6 rounded-xl text-white shadow-lg w-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-xl">{icon}</div>}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {value !== undefined && (
        <div className="text-2xl font-bold mb-4">{value}</div>
      )}

      <button 
        onClick={onClick}
        className="mt-auto w-full bg-white/20 backdrop-blur-sm text-white py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors"
      >
        {buttonText} 
      </button>
    </div>
  );
};

export default Card;
