import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  bgColor,
  textColor,
}) => {
  return (
    <div className={`rounded-xl shadow-sm p-6 ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${textColor} opacity-80`}>{title}</p>
          <h3 className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${textColor} bg-white/20`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;