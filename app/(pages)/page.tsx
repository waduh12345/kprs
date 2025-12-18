import { Suspense } from "react";
import Hero from "@/components/main/home-page/new/Hero";
import Features from "@/components/main/home-page/new/Features";
import CTA from "@/components/main/home-page/new/CTA";
import Testimonials from "@/components/main/home-page/new/Testimonials";

/**
 * Loading Skeleton sederhana untuk Hero
 * Mencegah layout shift saat build statis
 */
const HeroSkeleton = () => (
  <div className="w-full h-[600px] bg-gray-50 animate-pulse flex items-center justify-center">
    <div className="container mx-auto px-6 grid md:grid-cols-2 gap-10">
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded-md w-3/4"></div>
        <div className="h-6 bg-gray-200 rounded-md w-full"></div>
        <div className="h-6 bg-gray-200 rounded-md w-5/6"></div>
        <div className="h-12 bg-gray-200 rounded-xl w-40 mt-6"></div>
      </div>
      <div className="h-[400px] bg-gray-200 rounded-2xl w-full"></div>
    </div>
  </div>
);

const HomePage = () => {
  return (
    <main className="min-h-screen bg-white">
      {/* PENTING: Hero menggunakan useSearchParams() untuk mode edit, 
          maka WAJIB dibungkus Suspense agar build prod tidak error.
      */}
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>

      {/* Menjelaskan Modul: Simpan Pinjam, Akuntansi, Manajemen Anggota */}
      <Features />

      {/* Ajakan untuk Demo Sistem atau Konsultasi Gratis */}
      <CTA />

      {/* Testimoni dari pengurus koperasi yang sudah beralih ke digital */}
      <Testimonials />
    </main>
  );
};

export default HomePage;