import React from 'react';

/**
 * Komponen SeparatorMenu digunakan untuk memisahkan grup item dalam daftar menu atau sidebar.
 * Ini menampilkan label tebal di atas garis tipis.
 * * @param label Teks yang akan ditampilkan sebagai judul grup.
 */
interface SeparatorProps {
  label: string;
}

export const Separator: React.FC<SeparatorProps> = ({ label }) => {
  return (
    <div className="relative flex items-center py-4 px-2">
      <div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
      <span className="flex-shrink mx-4 text-sm font-semibold uppercase text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
    </div>
  );
};

// Anda juga bisa membuat versi yang lebih sederhana jika hanya butuh garis
// tanpa teks di tengah (namun label lebih informatif di sidebar).

// export const SeparatorMenu: React.FC<SeparatorMenuProps> = ({ label }) => {
//   return (
//     <div className="px-2 py-3">
//       <span className="text-xs font-bold uppercase text-gray-500">
//         {label}
//       </span>
//     </div>
//   );
// };