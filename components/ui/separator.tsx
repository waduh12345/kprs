import React from "react";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export const Separator: React.FC<SeparatorProps> = ({
  label,
  className,
  children, // tidak dipakai tapi tetap diterima jika ada
  ...rest
}) => {
  // gabungkan class default dengan className yang diteruskan
  const rootClass = `${className ?? ""} relative flex items-center py-2 px-2`;

  return (
    <div className={rootClass} {...rest}>
      <div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
      {label !== undefined && label !== "" && (
        <span className="flex-shrink mx-4 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
          {label}
        </span>
      )}
      <div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
    </div>
  );
};

export default Separator;