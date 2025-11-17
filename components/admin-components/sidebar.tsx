"use client";
import React, { useState } from "react";
import Link from "next/link";
import { X, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { SidebarProps, MenuItem } from "@/types"; // Pastikan MenuItem mengizinkan 'sub_children'
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { Button } from "../ui/button";

// ⬇️ Import service logout
import { useLogoutMutation } from "@/services/auth.service";


const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, menuItems }) => {
  const shopLogo = "/favicon.ico";
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  // State untuk melacak menu level 2 yang terbuka (yang memiliki sub_children)
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]); 

  // ⬇️ Hook mutate logout
  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();

  const toggleMenu = (id: string, e: React.MouseEvent, level: 1 | 2) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (level === 1) {
      setOpenMenus((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else if (level === 2) {
      setOpenSubMenus((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    }
  };

  // ⬇️ Handler logout gabungan (API + next-auth)
  const handleLogout = async () => {
    try {
      // panggil API backend untuk invalidate token/session
      await logoutApi().unwrap();
    } catch {
      // abaikan error API agar user tetap bisa keluar
    } finally {
      try {
        // opsional: bersihkan keranjang
        if (typeof window !== "undefined") {
          localStorage.removeItem("cart-storage");
        }
      } catch {}
      // tutup sidebar di mobile
      onClose?.();
      // next-auth signOut + redirect
      await signOut({ callbackUrl: "/auth/login", redirect: true });
    }
  };

  // --- Fungsi Render Menu Level 2 ---
  const renderChildMenu = (child: any) => { // Menggunakan 'any' karena tipe MenuItem Anda kompleks
    const isChildActive = pathname === child.href;
    const hasSubChildren = child.sub_children && child.sub_children.length > 0;
    const isSubMenuOpen = openSubMenus.includes(child.id);

    // Jika memiliki sub_children, kita buat div untuk menampung link + toggle
    if (hasSubChildren) {
      return (
        <div key={child.id}>
          <div className="relative">
            <Link
              href={child.href}
              onClick={(e) => {
                // Jangan navigasi, hanya buka/tutup sub_children
                e.preventDefault(); 
                e.stopPropagation();
                toggleMenu(child.id, e, 2);
              }}
              className={`w-full group flex items-center justify-between px-2 py-1 rounded-md text-sm transition-colors duration-150 ${
                isChildActive
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {child.label}
            </Link>
            <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-200 focus:outline-none"
                aria-label={`Toggle ${child.label} submenu`}
                onClick={(e) => toggleMenu(child.id, e, 2)}
            >
              {isSubMenuOpen ? (
                <ChevronUp className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-500" />
              )}
            </button>
          </div>
          
          {/* Render Sub_Children (Level 3) */}
          {isSubMenuOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l border-gray-300 pl-2">
              {child.sub_children.map((subChild: any) => {
                const isSubChildActive = pathname === subChild.href;
                return (
                  <Link
                    key={subChild.id}
                    href={subChild.href}
                    className={`block px-2 py-1 rounded-md text-sm ${
                      isSubChildActive
                        ? "bg-gray-300 text-gray-900"
                        : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                    }`}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                  >
                    {subChild.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Jika tidak memiliki sub_children, render Link biasa (Level 2)
    return (
      <Link
        key={child.id}
        href={child.href}
        className={`block px-2 py-1 rounded-md text-sm ${
          isChildActive
            ? "bg-gray-200 text-gray-900"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
        onClick={() => window.innerWidth < 1024 && onClose()}
      >
        {child.label}
      </Link>
    );
  };
  // --- Akhir Fungsi Render Menu Level 2 ---


  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 transition-opacity z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed left-0 z-30 w-64 bg-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        top-36 h-[calc(100vh-8rem)] lg:top-0 lg:h-full lg:translate-x-0 lg:static`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Image
                src={shopLogo}
                alt="Logo"
                width={160}
                height={16}
                className="w-6 h-4"
              />
            </div>
            <div className="ml-2">
              <h2 className="text-gray-900 text-lg font-bold font-italic">
                Koperasi Merah Putih
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-900 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-5 px-2 space-y-1 overflow-y-auto h-[calc(100vh-12rem)] lg:h-[calc(100vh-11rem)]">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const hasChildren = item.children && item.children.length > 0;
            const isMenuOpen = openMenus.includes(item.id);
            const isSeparator = item.isSeparator;

            return (
              <div key={item.id}>
                {/* Level 1 Item / Separator */}
                <div 
                    className="relative" 
                    // Hanya toggle jika ada children DAN bukan separator
                    onClick={(e) => hasChildren && !isSeparator && toggleMenu(item.id, e, 1)}
                >
                  <Link
                    href={item.href}
                    onClick={() => {
                        // Tutup sidebar di mobile setelah klik Link, kecuali jika ada children
                        if (window.innerWidth < 1024 && !hasChildren) {
                            onClose();
                        }
                    }}
                    className={`w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                      isActive && !isSeparator
                        ? "bg-gray-200 text-gray-900"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    } ${isSeparator ? 'cursor-default' : ''}`}
                  >
                    <div
                      className={`flex items-center ${
                      isSeparator ? "mt-3" : ""
                      }`}
                    >
                      {!isSeparator && (
                      <div className="mr-3 flex-shrink-0 h-5 w-5">
                        {item.icon}
                      </div>
                      )}
                      <span className={isSeparator ? "font-bold text-gray-900 uppercase" : ""}>
                      {item.label}
                      </span>
                    </div>
                    
                    {/* Toggle Icon Level 1 */}
                    {hasChildren && !isSeparator && (
                      <button
                        className="p-1 rounded hover:bg-gray-200 focus:outline-none"
                        aria-label={`Toggle ${item.label} submenu`}
                        // Mencegah Link navigasi jika mengklik toggle
                        onClick={(e) => toggleMenu(item.id, e, 1)}
                      >
                        {isMenuOpen ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    )}
                  </Link>
                </div>

                {/* Children (Level 2) Container */}
                {hasChildren && isMenuOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-gray-300 pl-2">
                    {item.children?.map(renderChildMenu)}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-gray-100 rounded-lg p-3">
            <Button
              variant="destructive"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;