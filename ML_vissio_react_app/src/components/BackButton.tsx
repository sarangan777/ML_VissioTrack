import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
    >
      <ArrowLeft className="w-5 h-5 mr-1" />
      Back
    </button>
  );
};

export default BackButton;