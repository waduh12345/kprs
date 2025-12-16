"use client";

import React, { useState, useEffect } from "react";
import {
  BookDashed,
  Users,
  Landmark,
  FileText,
  Settings,
  GitBranch,
  Clock,
  Users2,
} from "lucide-react";
import Header from "@/components/admin-components/header";
import Sidebar from "@/components/admin-components/sidebar";
import { AdminLayoutProps, MenuItem } from "@/types";
import { FaMoneyBillWave, FaCoins } from "react-icons/fa";
import { useSession } from "next-auth/react";
import type { User } from "@/types/user";
import ClientAuthGuard from "@/components/client-guards";

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user as User | undefined;

  // Close sidebar when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", handleResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  // ============
  // SOURCE OF TRUTH: Menu Koperasi (Superadmin)
  // ============
  const superadminMenuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <BookDashed className="h-5 w-5" />,
      href: "/admin/dashboard",
    },
    {
      id: "anggota",
      label: "Anggota",
      icon: <Users className="h-5 w-5" />,
      href: "#",
      children: [
        {
          id: "anggota-data",
          label: "Data Anggota",
          href: "/admin/anggota",
        },
        {
          id: "anggota-laporan",
          label: "Laporan Data Anggota",
          href: "/admin/anggota/laporan",
        },
        {
          id: "anggota-laporan-perubahan-status",
          label: "Laporan Perubahan Status",
          href: "/admin/anggota/laporan-perubahan-status",
        },
        {
          id: "anggota-meninggal",
          label: "Data Anggota Meninggal",
          href: "/admin/anggota-meninggal",
        },
      ],
    },
    {
      id: "simpanan",
      label: "Simpanan",
      icon: <FaCoins className="h-5 w-5" />,
      href: "#",
      children: [
        {
          id: "simpanan/simpanan-anggota",
          label: "Simpanan Anggota",
          href: "/admin/simpanan/anggota",
        },
        {
          id: "simpanan/simpanan-transaksi",
          label: "Transaksi Simpanan",
          href: "/admin/simpanan/transaksi",
        },
        {
          id: "simpanan/auto-debet",
          label: "Auto Debet Simpanan",
          href: "#",
          sub_children: [
            {
              id: "simpanan/auto-debet/upload-simpanan",
              label: "Upload Data Simpanan",
              href: "/admin/simpanan/auto-debet/upload-simpanan",
            },
            {
              id: "simpanan/auto-debet/upload-tagihan",
              label: "Upload Data Tagihan",
              href: "/admin/simpanan/auto-debet/upload-tagihan",
            },
            {
              id: "simpanan/auto-debet/proses",
              label: "Proses Auto Debet",
              href: "/admin/simpanan/auto-debet/proses",
            },
          ]
        },
        {
          id: "simpanan/laporan-simpanan",
          label: "Laporan Simpanan",
          href: "#",
          sub_children: [
            {
              id: "simpanan/laporan/mutasi-simpanan",
              label: "Mutasi Simpanan",
              href: "/admin/simpanan/laporan/mutasi-simpanan",
            },
            {
              id: "simpanan/laporan/nominatif-simpanan",
              label: "Nominatif Simpanan",
              href: "/admin/simpanan/laporan/nominatif-simpanan",
            },
          ]
        },
      ],
    },
    {
      id: "simpanan-berjangka",
      label: "Simpanan Berjangka",
      icon: <GitBranch className="h-5 w-5" />,
      href: "#",
      children: [
        {
          id: "simpanan-berjangka/data-simjaka",
          label: "Data Simjaka",
          href: "/admin/simpanan-berjangka/data",
        },
        {
          id: "simpanan-berjangka/transaksi-simjaka",
          label: "Transaksi Simjaka",
          href: "/admin/simpanan-berjangka/transaksi",
        },
        {
          id: "simpanan-berjangka/laporan-simjaka",
          label: "Laporan Simjaka",
          href: "/admin/simpanan-berjangka/laporan",
        },
        {
          id: "simpanan-berjangka/simpanan-berjangka/proses-simjaka-harian",
          label: "Proses Simjaka Harian",
          href: "/admin/simpanan-berjangka/proses-simjaka-harian",
        },
      ],
    },
    {
      id: "pembiayaan",
      label: "Pembiayaan",
      icon: <FaMoneyBillWave className="h-5 w-5" />,
      href: "#",
      children: [
        {
          id: "pembiayaan/simulasi",
          label: "Simulasi",
          href: "/admin/pembiayaan/simulasi",
        },
        {
          id: "pembiayaan/data-pembiayaan",
          label: "Data Pembiayaan",
          href: "/admin/pembiayaan/data",
        },
        {
          id: "pembiayaan/transaksi",
          label: "Transaksi Pembiayaan",
          href: "#",
          sub_children: [
            {
              id: "pembiayaan/transaksi/realisasi",
              label: "Realisasi Pembiayaan",
              href: "/admin/pembiayaan/transaksi/realisasi",
            },
            {
              id: "pembiayaan/transaksi/angsuran",
              label: "Angsuran Pembiayaan",
              href: "/admin/pembiayaan/transaksi/angsuran",
            },
            {
              id: "pembiayaan/transaksi/pelunasan",
              label: "Pelunasan Pembiayaan",
              href: "/admin/pembiayaan/transaksi/pelunasan",
            },
          ]
        },
        {
          id: "pembiayaan/proses-auto-debet",
          label: "Proses Auto Debet",
          href: "/admin/pembiayaan/proses-auto-debet",
        },
        {
          id: "pembiayaan/laporan-pembiayaan",
          label: "Laporan Pembiayaan",
          href: "#",
          sub_children: [
            {
              id: "pembiayaan/laporan/mutasi",
              label: "Mutasi Pembiayaan",
              href: "/admin/pembiayaan/laporan/mutasi",
            },
            {
              id: "pembiayaan/laporan/nominatif",
              label: "Nominatif Pembiayaan",
              href: "/admin/pembiayaan/laporan/nominatif",
            },
            {
              id: "pembiayaan/laporan/realisasi",
              label: "Realisasi Pembiayaan",
              href: "/admin/pembiayaan/laporan/realisasi",
            },
            {
              id: "pembiayaan/laporan/performance",
              label: "Performance",
              href: "/admin/pembiayaan/laporan/performance",
            },
          ]
        },
      ],
    },
    {
      id: "sales",
      label: "Sales",
      icon: <Users2 className="h-5 w-5" />,
      href: "#",
      children: [
        {
          id: "sales-category",
          label: "Kategori Sales",
          href: "/admin/sales/kategori",
        },
        {
          id: "sales-data",
          label: "Data Sales",
          href: "/admin/sales/data",
        },
      ],
    },
    {
      id: "tagihan-bank-payroll",
      label: "Tagihan ke Bank Payroll",
      icon: <Landmark className="h-5 w-5" />, // Landmark (Bank)
      href: "/admin/tagihan-bank-payroll",
    },
    {
      id: "akuntansi",
      label: "Akuntansi",
      icon: <FileText className="h-5 w-5" />, // FileText (Dokumen/Akuntansi)
      href: "#",
      children: [
        {
          id: "akuntansi/transaksi",
          label: "Transaksi Akuntansi",
          href: "/admin/akuntansi/transaksi",
        },
        {
          id: "akuntansi/transaksi-jurnal-eliminasi",
          label: "Transaksi Jurnal Eliminasi",
          href: "/admin/akuntansi/transaksi-jurnal-eliminasi",
        },
        {
          id: "akuntansi/pembatalan-jurnal",
          label: "Pembatalan Jurnal",
          href: "/admin/akuntansi/pembatalan-jurnal",
        },
        {
          id: "akuntansi/pembatalan-jurnal-eliminasi",
          label: "Pembatalan Jurnal Eliminasi",
          href: "/admin/akuntansi/pembatalan-jurnal-eliminasi",
        },
        {
          id: "akuntansi/revisi-jurnal",
          label: "Revisi Jurnal",
          href: "/admin/akuntansi/revisi-jurnal",
        },
        {
          id: "akuntansi/laporan-akuntansi",
          label: "Laporan Akuntansi",
          href: "#",
          sub_children: [
            {
              id: "akuntansi/laporan-akuntansi/neraca",
              label: "Neraca",
              href: "/admin/akuntansi/laporan/neraca",
            },
            {
              id: "akuntansi/laporan-akuntansi/neraca-konsolidasi",
              label: "Neraca Konsolidasi",
              href: "/admin/akuntansi/laporan/neraca-konsolidasi",
            },
            {
              id: "akuntansi/laporan/laba-rugi",
              label: "Laba Rugi",
              href: "/admin/akuntansi/laporan/laba-rugi",
            },
            {
              id: "akuntansi/laporan/laporan-jurnal-transaksi",
              label: "Laporan Jurnal Transaksi",
              href: "/admin/akuntansi/laporan/jurnal-transaksi",
            },
            {
              id: "akuntansi/laporan/buku-besar",
              label: "Laporan Buku Besar",
              href: "/admin/akuntansi/laporan/buku-besar",
            },
            {
              id: "akuntansi/laporan/laporan-rekonsiliasi-antar-rekening",
              label: "Laporan Rekonsiliasi Antar Rekening",
              href: "/admin/akuntansi/laporan/rekonsiliasi-antar-rekening",
            },
          ]
        },
      ],
    },
    {
      id: "akhir-bulan-akhir-tahun",
      label: "Akhir Bulan/Akhir Tahun",
      icon: <Clock className="h-5 w-5" />, // Clock (Waktu/Periode)
      href: "#",
      children: [
        {
          id: "akhir-bulan-akhir-tahun/proses-bunga-simpanan",
          label: "Proses Bunga Simpanan",
          href: "/admin/akhir-bulan-akhir-tahun/proses-bunga-simpanan",
        },
        {
          id: "akhir-bulan-akhir-tahun/proses-eom",
          label: "Proses End of Month",
          href: "/admin/akhir-bulan-akhir-tahun/proses-eom",
        },
        {
          id: "akhir-bulan-akhir-tahun/proses-eoy",
          label: "Proses End of Year",
          href: "/admin/akhir-bulan-akhir-tahun/proses-eoy",
        },
        {
          id: "akhir-bulan-akhir-tahun/proses-shu",
          label: "Proses Sisa Hasil Usaha",
          href: "#",
          sub_children: [
            {
              id: "akhir-bulan-akhir-tahun/proses-shu/perhitungan-shu",
              label: "Perhitungan SHU",
              href: "/admin/akhir-bulan-akhir-tahun/proses-shu/perhitungan-shu",
            },
            {
              id: "akhir-bulan-akhir-tahun/proses-shu/pembagian-shu",
              label: "Pembagian SHU",
              href: "/admin/akhir-bulan-akhir-tahun/proses-shu/pembagian-shu",
            },
            {
              id: "akhir-bulan-akhir-tahun/proses-shu/laporan-shu",
              label: "Laporan SHU",
              href: "/admin/akhir-bulan-akhir-tahun/proses-shu/laporan-shu",
            },
          ]
        },
      ],
    },
    {
      id: "konfigurasi",
      label: "Konfigurasi",
      icon: <Settings className="h-5 w-5" />,
      href: "#",
      children: [
        {
          id: "konfigurasi/coa",
          label: "Chart of Accounts",
          href: "/admin/master/coas",
        },
        {
          id: "konfigurasi/kode-transaksi",
          label: "Kode Transaksi",
          href: "/admin/master/kode-transaksi",
        },
        {
          id: "konfigurasi/produk-simpanan",
          label: "Produk Simpanan",
          href: "/admin/konfigurasi/simpanan",
        },
        {
          id: "konfigurasi/produk-simpanan-berjangka",
          label: "Produk Simpanan Berjangka",
          href: "/admin/konfigurasi/simpanan-berjangka",
        },
        {
          id: "konfigurasi/produk-pembiayaan",
          label: "Produk Pembiayaan",
          href: "/admin/konfigurasi/pembiayaan",
        },
        {
          id: "konfigurasi/pengelola",
          label: "Pengelola",
          href: "/admin/pengelola",
        },
        {
          id: "konfigurasi/role",
          label: "Role",
          href: "/admin/role",
        },
      ],
    },
  ];

  // ============
  // Helpers filtering
  // ============

  // Hapus Helper-Helper yang tidak digunakan: byId, cloneWithFilteredChildren, pickByInclude, MASTERISH_CHILD_IDS
  // Sisakan filterByExclude yang masih digunakan

  const filterByExclude = (
    baseItems: MenuItem[],
    excludeRootIds: Set<string>
  ): MenuItem[] => {
    return baseItems
      .filter((it) => !excludeRootIds.has(it.id));
      // Menghapus pemanggilan cloneWithFilteredChildren karena MASTERISH_CHILD_IDS tidak ada lagi
  };

  // ============
  // Role resolving
  // ============
  const roleNames =
    (user?.roles ?? []).map((r) => r.name?.toLowerCase?.()) ?? [];
  const hasRole = (name: string) => roleNames.includes(name);

  let effectiveRole:
    | "superadmin"
    | "ketua"
    | "sekretaris"
    | "bendahara"
    | "staff"
    | "none" = "none";

  if (hasRole("superadmin")) effectiveRole = "superadmin";
  else if (hasRole("ketua")) effectiveRole = "ketua";
  else if (hasRole("sekretaris")) effectiveRole = "sekretaris";
  else if (hasRole("bendahara")) effectiveRole = "bendahara";
  else if (hasRole("staff")) effectiveRole = "staff"; // Admin Input
  else effectiveRole = user ? "staff" : "none"; // Default user yang login adalah staff jika bukan role lain

  // ============
  // Build menu per role
  // ============
  let menuItems: MenuItem[] = [];

  switch (effectiveRole) {
    case "superadmin": {
      menuItems = superadminMenuItems;
      break;
    }

    // Ketua / Sekretaris / Bendahara: semua akses kecuali konfigurasi (master tetap terlihat karena itu child di konfigurasi)
    case "ketua":
    case "sekretaris":
    case "bendahara": {
      const excludeRoot = new Set<string>([
        "konfigurasi",
        // Menghapus exclude Marketplace dan Master yang sudah dibuang dari daftar superadminMenuItems
      ]);
      menuItems = filterByExclude(superadminMenuItems, excludeRoot);
      break;
    }

    // Admin Input (staff): semua akses kecuali konfigurasi, akuntansi, dan akhir-bulan
    case "staff": {
      const excludeRoot = new Set<string>([
        "konfigurasi",
        "akuntansi",
        "akhir-bulan-akhir-tahun",
        // Laporan tetap terlihat sesuai menu superadmin
      ]);
      menuItems = filterByExclude(superadminMenuItems, excludeRoot);
      break;
    }

    // Tidak ada user: kosongin menu
    case "none":
    default: {
      menuItems = [];
      break;
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        menuItems={menuItems}
      />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-2">
            <div className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-2">
              <ClientAuthGuard
                // Menjaga agar ClientAuthGuard tetap ada, namun memastikan rute yang benar
                excludedRoutes={["/auth", "/auth/login", "/public", "/"]}
                excludedFetchPrefixes={["/api/auth/", "/auth/"]}
                loginPath="/auth/login"
              />
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;