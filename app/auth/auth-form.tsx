"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  useRegisterMutation,
  useResendVerificationMutation,
} from "@/services/auth.service";
import Swal from "sweetalert2";
import {
  FaLock,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaArrowRight,
  FaCoins,
  FaHandshake,
  FaChartLine,
  FaPiggyBank,
  FaUsers,
  FaBuilding,
  FaCalculator,
  FaShieldAlt,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { formatDateForInput } from "@/lib/format-utils";
import type { DocumentsAnggota } from "@/types/koperasi-types/anggota";

type AuthFormProps = {
  mode: "login" | "register";
};

type RegisterError = {
  status: number;
  data?: {
    message?: string;
    [key: string]: unknown;
  };
};

type MediaItem = DocumentsAnggota["media"][number];

const makeEmptyDoc = (anggota_id = 0): DocumentsAnggota => ({
  id: 0,
  anggota_id,
  key: "",
  document: null,
  created_at: "",
  updated_at: "",
  media: [] as DocumentsAnggota["media"],
});

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const carouselImages = [
  "/images/koperasi-1.jpg",
  "/images/koperasi-2.jpg",
  "/images/koperasi-3.jpg",
];

// === Interface 2: payload eksplisit untuk register ===
type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  gender?: "M" | "F";
  birth_place?: string;
  birth_date?: string; // yyyy-mm-dd
  nik?: string; // 16 digit
  npwp?: string; // 15 digit (ignore .-/spasi)
  nip?: string; // 8-20 digit (opsional)
  unit_kerja?: string;
  jabatan?: string;
  address?: string;
};

type FieldErrors = Partial<Record<keyof RegisterPayload, string>> & {
  password_confirmation?: string;
};

const digitsOnly = (s: string) => s.replace(/\D+/g, "");
const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isValidPassword = (s: string) =>
  s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s);
const isValidPhoneID = (s: string) => {
  const d = digitsOnly(s);
  return d.startsWith("08") && d.length >= 10 && d.length <= 14;
};
const normalizeNPWP = (s: string) => digitsOnly(s);
const notFutureDate = (value?: string) => {
  if (!value) return true;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return d.getTime() <= today.getTime();
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isLogin = mode === "login";
  const isRegister = !isLogin;

  // ===== Umum (Akun) =====
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  // ===== Field tambahan (seperti AnggotaForm) =====
  const [gender, setGender] = useState<"" | "M" | "F">("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [nik, setNik] = useState("");
  const [npwp, setNpwp] = useState("");
  const [nip, setNip] = useState("");
  const [unitKerja, setUnitKerja] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [address, setAddress] = useState("");

  // ===== Dokumen dinamis =====
  const [documents, setDocuments] = useState<DocumentsAnggota[]>([
    makeEmptyDoc(0),
  ]);

  // Tabs
  const [activeTab, setActiveTab] = useState<"data" | "dokumen">("data");

  // UI state
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const [register] = useRegisterMutation();
  const [resendVerification] = useResendVerificationMutation();

  // Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000 }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  // Pastikan minimal 1 baris dokumen pada register
  useEffect(() => {
    if (isRegister && (!documents || documents.length === 0)) {
      setDocuments([makeEmptyDoc(0)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegister]);

  // Dokumen handlers
  const addDocRow = () => setDocuments((prev) => [...prev, makeEmptyDoc(0)]);
  const removeDocRow = (idx: number) =>
    setDocuments((prev) => {
      const cp = prev.slice();
      cp.splice(idx, 1);
      return cp.length ? cp : [makeEmptyDoc(0)];
    });
  const updateDocKey = (idx: number, key: string) =>
    setDocuments((prev) => {
      const cp = prev.slice();
      cp[idx] = { ...cp[idx], key };
      return cp;
    });
  const updateDocFile = (idx: number, file: File | null) =>
    setDocuments((prev) => {
      const cp = prev.slice();
      cp[idx] = { ...cp[idx], document: file };
      return cp;
    });

  // ===== Validasi Register =====
  const validateRegister = (): FieldErrors => {
    const errs: FieldErrors = {};

    if (!name.trim()) errs.name = "Nama wajib diisi.";
    else if (name.trim().length < 3) errs.name = "Nama minimal 3 karakter.";

    if (!email.trim()) errs.email = "Email wajib diisi.";
    else if (!isValidEmail(email.trim()))
      errs.email = "Format email tidak valid.";

    if (!phone.trim()) errs.phone = "Nomor telepon wajib diisi.";
    else if (!isValidPhoneID(phone))
      errs.phone = "Nomor telepon harus 10–14 digit, diawali 08.";

    if (!password) errs.password = "Password wajib diisi.";
    else if (!isValidPassword(password))
      errs.password = "Minimal 8 karakter dan mengandung huruf serta angka.";

    if (!passwordConfirmation) {
      errs.password_confirmation = "Konfirmasi password wajib diisi.";
    } else if (passwordConfirmation !== password) {
      errs.password_confirmation = "Konfirmasi password tidak cocok.";
    }

    if (gender && gender !== "M" && gender !== "F") {
      errs.gender = "Gender tidak valid.";
    }

    if (birthPlace && birthPlace.trim().length < 2) {
      errs.birth_place = "Tempat lahir minimal 2 karakter.";
    }

    if (birthDate && !notFutureDate(birthDate)) {
      errs.birth_date = "Tanggal lahir tidak boleh di masa depan.";
    }

    const nikDigits = digitsOnly(nik);
    if (nik && nikDigits.length !== 16) {
      errs.nik = "NIK (KTP) harus 16 digit.";
    }

    const npwpDigits = normalizeNPWP(npwp);
    if (npwp && npwpDigits.length !== 15) {
      errs.npwp = "NPWP harus 15 digit (tanpa tanda baca).";
    }

    const nipDigits = digitsOnly(nip);
    if (nip && (nipDigits.length < 8 || nipDigits.length > 20)) {
      errs.nip = "NIP harus 8–20 digit.";
    }

    if (unitKerja && unitKerja.trim().length < 2) {
      errs.unit_kerja = "Unit kerja minimal 2 karakter.";
    }
    if (jabatan && jabatan.trim().length < 2) {
      errs.jabatan = "Jabatan minimal 2 karakter.";
    }

    if (address && address.trim().length < 10) {
      errs.address = "Alamat minimal 10 karakter.";
    }

    // Dokumen: jika ada file maka nama file wajib
    for (let i = 0; i < documents.length; i++) {
      const d = documents[i];
      if (d.document && !d.key) {
        // tidak ada field error spesifik; pesan ini bisa ditampilkan di UI bagian dokumen kalau mau
        errs.address = errs.address ?? ""; // no-op untuk menandai ada error tambahan
      }
    }

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setFieldErrors({});

    if (isLogin) {
      try {
        const signInRes = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (signInRes?.ok) {
          router.push("/admin/dashboard");
        } else {
          setError("Gagal masuk. Email atau password salah.");
        }
      } catch (err: unknown) {
        console.error("Login error:", err);
        setError("Login gagal. Cek kembali email dan password.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const errs = validateRegister();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setIsLoading(false);
      setActiveTab("data");
      return;
    }

    try {
      const payload: RegisterPayload = {
        name: name.trim(),
        email: email.trim(),
        phone: digitsOnly(phone),
        password,
        password_confirmation: passwordConfirmation,
        gender: gender || undefined,
        birth_place: birthPlace ? birthPlace.trim() : undefined,
        birth_date: birthDate || undefined,
        nik: nik ? digitsOnly(nik) : undefined,
        npwp: npwp ? normalizeNPWP(npwp) : undefined,
        nip: nip ? digitsOnly(nip) : undefined,
        unit_kerja: unitKerja ? unitKerja.trim() : undefined,
        jabatan: jabatan ? jabatan.trim() : undefined,
        address: address ? address.trim() : undefined,
      };

      await register(payload).unwrap();

      await Swal.fire({
        title: "Pendaftaran berhasil",
        text: "Silakan cek email kamu untuk verifikasi sebelum login.",
        icon: "success",
      });

      router.push("/auth/login");
    } catch (err) {
      const error = err as RegisterError;
      console.error("Register error:", error);
      const message =
        error?.data?.message || "Pendaftaran gagal. Cek kembali data Anda.";

      const showResend = message.toLowerCase().includes("belum verifikasi");
      if (showResend) {
        const result = await Swal.fire({
          title: "Email belum diverifikasi",
          text: "Apakah kamu ingin mengirim ulang email verifikasi?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Kirim Ulang",
          cancelButtonText: "Batal",
        });

        if (result.isConfirmed) {
          try {
            await resendVerification({ email }).unwrap();
            await Swal.fire({
              title: "Terkirim!",
              text: "Email verifikasi berhasil dikirim ulang.",
              icon: "success",
            });
          } catch {
            await Swal.fire({
              title: "Gagal",
              text: "Gagal mengirim ulang email verifikasi.",
              icon: "error",
            });
          }
        }
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gradient-to-br from-red-50 to-white">
      {/* Left Pane - Koperasi Merah Putih Theme with Carousel */}
      <div className="relative hidden lg:flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0" ref={emblaRef}>
          <div className="embla__container flex h-full">
            {carouselImages.map((src, index) => (
              <div
                key={index}
                className="embla__slide relative flex-none w-full h-full"
              >
                <Image
                  src={src}
                  alt={`Koperasi Merah Putih ${index + 1}`}
                  fill
                  style={{ objectFit: "cover" }}
                  quality={100}
                  className="select-none pointer-events-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 z-10 bg-black/40 flex flex-col items-center justify-center p-8 text-white text-center">
          {/* Floating Icons */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-16 text-red-300/60"
            >
              <FaCoins size={32} />
            </motion.div>
            <motion.div
              animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute top-32 left-8 text-red-200/50"
            >
              <FaPiggyBank size={24} />
            </motion.div>
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, -5, 0] }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
              className="absolute top-24 right-20 text-red-300/60"
            >
              <FaHandshake size={28} />
            </motion.div>
            <motion.div
              animate={{ y: [0, 20, 0], rotate: [0, 3, 0] }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute top-40 right-12 text-red-200/50"
            >
              <FaChartLine size={26} />
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }}
              transition={{
                duration: 6.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5,
              }}
              className="absolute bottom-32 left-12 text-red-300/60"
            >
              <FaUsers size={30} />
            </motion.div>
            <motion.div
              animate={{ y: [0, 18, 0], rotate: [0, -2, 0] }}
              transition={{
                duration: 8.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 3,
              }}
              className="absolute bottom-20 left-24 text-red-200/50"
            >
              <FaBuilding size={22} />
            </motion.div>
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, -4, 0] }}
              transition={{
                duration: 7.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.5,
              }}
              className="absolute bottom-28 right-16 text-red-300/60"
            >
              <FaCalculator size={28} />
            </motion.div>
            <motion.div
              animate={{ y: [0, 16, 0], rotate: [0, 2, 0] }}
              transition={{
                duration: 9.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute bottom-16 right-8 text-red-200/50"
            >
              <FaShieldAlt size={24} />
            </motion.div>
          </div>

          {/* Branding */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="z-20 p-8 rounded-2xl backdrop-blur-sm bg-white/95 border-2 border-red-600 shadow-2xl"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center gap-1">
                <Image
                  src="/logo-koperasi-merah-putih-online.webp"
                  alt="Koperasi Merah Putih Logo"
                  width={50}
                  height={50}
                  className="flex-shrink-0 object-contain"
                />
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Koperasi Merah Putih
                  </h2>
                  <p className="text-xs text-gray-600 mt-[-5px]">
                    Simpan Pinjam & Marketplace
                  </p>
                </div>
              </div>
            </div>

            <div className="w-16 h-1 bg-gradient-to-r from-red-600 to-red-400 mx-auto mb-4"></div>

            <p className="text-base font-medium text-gray-700 max-w-sm mx-auto leading-relaxed">
              Sistem Manajemen Koperasi Terintegrasi untuk Simpan Pinjam,
              Pengelolaan Anggota, dan Operasional Keuangan
            </p>

            <div className="mt-6 flex justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                Simpan Pinjam
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                Manajemen Anggota
              </div>
            </div>
          </motion.div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 z-20 flex gap-2">
          {carouselImages.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? "w-8 bg-white shadow-lg"
                  : "w-2 bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="relative flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-white to-red-50 transition-colors duration-500 overflow-hidden">
        {/* Static Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-2/12 right-4 text-red-300/50 z-0">
            <FaPiggyBank size={120} />
          </div>
          <div className="absolute bottom-0 -translate-y-1/2 -left-4 text-red-300/50 z-0">
            <FaHandshake size={110} />
          </div>
        </div>

        <motion.div
          className="w-full max-w-2xl space-y-8 relative z-10"
          initial="hidden"
          animate="visible"
          variants={variants}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          {/* Header */}
          <motion.div variants={variants} className="text-center">
            <div className="flex items-center justify-center mb-4 gap-1">
              <Image
                src="/logo-koperasi-merah-putih-online.webp"
                alt="Koperasi Merah Putih Logo"
                width={50}
                height={50}
                className="flex-shrink-0 object-contain"
              />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Koperasi Merah Putih
                </h2>
                <p className="text-xs text-gray-600 mt-[-5px]">
                  Simpan Pinjam & Marketplace
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {isLogin
                ? "Akses dashboard admin untuk mengelola operasional koperasi"
                : "Bergabunglah sebagai anggota koperasi untuk memulai"}
            </p>
          </motion.div>

          {/* FORM: max-h + overflow, tabs & submit sticky */}
          <motion.form
            variants={variants}
            onSubmit={handleSubmit}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-red-100 flex flex-col max-h-[60vh] overflow-y-auto"
          >
            {/* Sticky Tabs (Register only) */}
            {isRegister && (
              <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-red-100">
                <div className="px-8 pt-6">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("data")}
                      className={`px-4 py-2 text-sm font-semibold ${
                        activeTab === "data"
                          ? "text-red-700 border-b-2 border-red-600"
                          : "text-gray-500 hover:text-red-600"
                      }`}
                    >
                      Data Diri
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("dokumen")}
                      className={`px-4 py-2 text-sm font-semibold ${
                        activeTab === "dokumen"
                          ? "text-red-700 border-b-2 border-red-600"
                          : "text-gray-500 hover:text-red-600"
                      }`}
                    >
                      Dokumen
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 px-8 py-6 space-y-6">
              {/* ======= LOGIN VIEW ======= */}
              {isLogin && (
                <>
                  <motion.div variants={variants} className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Email
                    </Label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 pr-4 py-3 border-red-200 focus:border-red-500 focus:ring-red-500/20 rounded-lg transition-all duration-200"
                        aria-invalid={!!fieldErrors.email}
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={variants} className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-4 py-3 border-red-200 focus:border-red-500 focus:ring-red-500/20 rounded-lg transition-all duration-200"
                        placeholder="Masukkan password"
                        aria-invalid={!!fieldErrors.password}
                      />
                    </div>
                  </motion.div>
                </>
              )}

            </div>

            {/* Sticky Footer (Submit) */}
            <div className="sticky bottom-0 z-20 bg-white/90 backdrop-blur-md border-t border-red-100">
              <div className="px-8 pt-4">
              {error && (
                <motion.div
                variants={variants}
                className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3"
                >
                <p className="text-sm text-red-600 text-center font-medium">
                  {error}
                </p>
                </motion.div>
              )}
              </div>
              <div className="px-8 pb-8">
              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl py-3 rounded-lg font-semibold"
                disabled={isLoading}
                style={{
                transitionProperty:
                  "background, box-shadow, color, border-color",
                transitionTimingFunction: "ease",
                }}
              >
                {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Memproses...
                </div>
                ) : (
                <>
                  {isLogin
                  ? "Masuk ke Dashboard"
                  : "Daftar sebagai Anggota"}
                  <FaArrowRight className="text-sm" />
                </>
                )}
              </Button>
              </div>
            </div>
          </motion.form>

        </motion.div>
      </div>
    </div>
  );
}