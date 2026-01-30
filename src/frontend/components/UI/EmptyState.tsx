/**
 * EmptyState component
 */
import React from 'react';

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
}> = ({ title, description, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {description}
        </p>
      )}
    </div>
  );
};