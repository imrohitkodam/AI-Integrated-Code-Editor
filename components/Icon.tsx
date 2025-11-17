
import React from 'react';

interface IconProps {
  children: React.ReactNode;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ children, className }) => {
  return <div className={`inline-block ${className}`}>{children}</div>;
};

export default Icon;
