"use client";

import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AnggotaKoperasi,
  DocumentsAnggota,
} from "@/types/koperasi-types/anggota";
import { formatDateForInput } from "@/lib/format-utils";
import { 
  User, 
  Building2, 
  ShieldCheck, 
  FileText, 
  Trash2, 
  Plus, 
  AlertCircle 
} from "lucide-react"; // Pastikan install lucide-react jika belum

// --- Type Definition ---
export type AnggotaFormState = Partial<AnggotaKoperasi> & {
  password?: string;
  password_confirmation?: string;
  type: "individu" | "perusahaan";
  marital_status?: string;
  education?: string;
  occupation?: string;
  company_type?: string;
  registration_number?: string;
  established_at?: string;
};

// Helper document generator
const makeEmptyDoc = (anggota_id = 0): DocumentsAnggota => ({
  id: 0,
  anggota_id,
  key: "",
  document: null,
  created_at: "",
  updated_at: "",
  media: [] as DocumentsAnggota["media"],
});

interface AnggotaFormProps {
  form: AnggotaFormState;
  setForm: Dispatch<SetStateAction<AnggotaFormState>>;
  onCancel: () => void;
  onSubmit: () => void;
  readonly?: boolean;
  isLoading?: boolean;
}

type MediaItem = DocumentsAnggota["media"][number];

// ===== Helpers Validasi =====
const digitsOnly = (s: string) => s.replace(/\D+/g, "");
const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isValidPassword = (s: string) =>
  s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s);
const isValidPhoneID = (s: string) => {
  const d = digitsOnly(s);
  return d.startsWith("08") && d.length >= 10 && d.length <= 14;
};
const notFutureDate = (value?: string | null) => {
  if (!value) return true;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return d.getTime() <= today.getTime();
};

type FieldErrors = Partial<Record<keyof AnggotaFormState, string>>;

export default function AnggotaForm({
  form,
  setForm,
  onCancel,
  onSubmit,
  readonly = false,
  isLoading = false,
}: AnggotaFormProps) {
  const [mounted, setMounted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [docErrors, setDocErrors] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      type: prev.type || "individu",
      documents:
        prev.documents && prev.documents.length > 0
          ? prev.documents
          : [makeEmptyDoc(Number(prev.id) || 0)],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusOptions = [
    { value: 0, label: "Pengajuan", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
    { value: 1, label: "Aktif", color: "text-green-600 bg-green-50 border-green-200" },
    { value: 2, label: "Tidak Aktif", color: "text-red-600 bg-red-50 border-red-200" },
  ];

  const educationOptions = [
    "SD", "SMP", "SMA/SMK", "D3", "S1", "S2", "S3", "Lainnya"
  ];

  // --- Handlers ---
  const addDocRow = () => {
    setForm((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), makeEmptyDoc(Number(prev.id) || 0)],
    }));
  };

  const removeDocRow = (idx: number) => {
    setForm((prev) => {
      const docs = [...(prev.documents || [])];
      docs.splice(idx, 1);
      return {
        ...prev,
        documents: docs.length ? docs : [makeEmptyDoc(Number(prev.id) || 0)],
      };
    });
    setDocErrors((prev) => {
      const cp = [...prev];
      cp.splice(idx, 1);
      return cp;
    });
  };

  const updateDoc = (idx: number, field: keyof DocumentsAnggota, value: any) => {
    setForm((prev) => {
      const docs = [...(prev.documents || [])] as DocumentsAnggota[];
      docs[idx] = { ...docs[idx], [field]: value };
      return { ...prev, documents: docs };
    });
  };

  const handleInputChange = (field: keyof AnggotaFormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ===== VALIDASI =====
  const validate = (): { fields: FieldErrors; docs: string[] } => {
    const errs: FieldErrors = {};
    const docErrs: string[] = [];
    const isAddMode = !form.id;

    if (!form.name?.trim()) errs.name = "Nama wajib diisi.";
    if (!form.email || !isValidEmail(form.email.trim()))
      errs.email = "Format email tidak valid.";
    if (!form.phone || !isValidPhoneID(String(form.phone)))
      errs.phone = "No. Telepon harus valid (08..).";
    if (!form.address || form.address.trim().length < 5)
      errs.address = "Alamat wajib diisi lengkap.";

    if (isAddMode) {
      if (!form.password || !isValidPassword(form.password))
        errs.password = "Min 8 karakter, huruf & angka.";
      if (form.password !== form.password_confirmation)
        errs.password_confirmation = "Konfirmasi password tidak cocok.";
    }

    if (form.type === "individu") {
      if (!form.nik || digitsOnly(String(form.nik)).length !== 16)
        errs.nik = "NIK harus 16 digit angka.";
      if (!form.gender) errs.gender = "Pilih jenis kelamin.";
      if (!form.birth_place) errs.birth_place = "Tempat lahir wajib diisi.";
      if (!form.birth_date || !notFutureDate(form.birth_date))
        errs.birth_date = "Tanggal lahir tidak valid.";
    } else {
      if (!form.company_type) errs.company_type = "Pilih jenis badan usaha.";
      if (!form.registration_number)
        errs.registration_number = "Nomor Registrasi/SIUP wajib diisi.";
    }

    const docs = (form.documents ?? []) as DocumentsAnggota[];
    docs.forEach((d, i) => {
      if (d.document && !d.key) {
        docErrs[i] = "Nama dokumen wajib diisi jika ada file.";
      } else {
        docErrs[i] = "";
      }
    });

    return { fields: errs, docs: docErrs };
  };

  const handleSave = () => {
    const { fields, docs } = validate();
    setFieldErrors(fields);
    setDocErrors(docs);

    if (Object.keys(fields).length === 0 && !docs.some(Boolean)) {
      onSubmit();
    }
  };

  if (!mounted) return <div className="p-8 flex justify-center text-gray-500">Memuat Formulir...</div>;

  return (
    <div className="bg-white dark:bg-zinc-950 w-full max-w-5xl mx-auto flex flex-col h-full md:h-auto">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950 z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {readonly ? "Detail Anggota" : form.id ? "Edit Anggota" : "Registrasi Anggota"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {readonly ? "Informasi lengkap data anggota." : "Lengkapi formulir di bawah ini dengan data yang valid."}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-gray-400 hover:text-gray-700">
          ✕
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
        <form onSubmit={(e) => e.preventDefault()}>
          
          {/* Tipe Keanggotaan */}
          <section>
            <Label className="text-base font-semibold mb-3 block text-gray-800 dark:text-gray-200">Tipe Keanggotaan</Label>
            <RadioGroup
              disabled={readonly || !!form.id}
              value={form.type}
              onValueChange={(val) => handleInputChange("type", val as "individu" | "perusahaan")}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {[
                { id: "individu", label: "Individu / Perorangan", icon: User, desc: "Untuk anggota pribadi." },
                { id: "perusahaan", label: "Badan Usaha", icon: Building2, desc: "Untuk PT, CV, atau Koperasi." }
              ].map((item) => (
                <div key={item.id}>
                  <RadioGroupItem value={item.id} id={item.id} className="peer sr-only" />
                  <Label
                    htmlFor={item.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-zinc-900
                      ${form.type === item.id 
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-500 ring-1 ring-blue-600" 
                        : "border-gray-200 dark:border-zinc-800"
                      }
                      ${readonly || !!form.id ? "opacity-70 cursor-not-allowed" : ""}
                    `}
                  >
                    <div className={`p-2 rounded-lg ${form.type === item.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                      <item.icon size={20} />
                    </div>
                    <div>
                      <span className="font-semibold block text-base">{item.label}</span>
                      <span className="text-sm text-gray-500 font-normal">{item.desc}</span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </section>

          <div className="border-t border-gray-100 dark:border-zinc-800 my-6"></div>

          {/* Informasi Dasar */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded-full inline-block"></span>
              Informasi Kontak & Alamat
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>
                  {form.type === "perusahaan" ? "Nama Perusahaan" : "Nama Lengkap"} <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.name ?? ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  readOnly={readonly}
                  className={fieldErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                  placeholder="Masukkan nama lengkap"
                />
                {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  readOnly={readonly}
                  className={fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                  placeholder="contoh@email.com"
                />
                {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label>No. Telepon / WhatsApp <span className="text-red-500">*</span></Label>
                <Input
                  value={form.phone ?? ""}
                  onChange={(e) => handleInputChange("phone", digitsOnly(e.target.value))}
                  readOnly={readonly}
                  placeholder="08..."
                  className={fieldErrors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label>NPWP</Label>
                <Input
                  value={form.npwp ?? ""}
                  onChange={(e) => handleInputChange("npwp", e.target.value)}
                  readOnly={readonly}
                  placeholder="Nomor Pokok Wajib Pajak"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>Alamat Lengkap <span className="text-red-500">*</span></Label>
                <Textarea
                  value={form.address ?? ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  readOnly={readonly}
                  className={`min-h-[80px] resize-none ${fieldErrors.address ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  placeholder="Jalan, RT/RW, Kelurahan, Kecamatan..."
                />
                {fieldErrors.address && <p className="text-xs text-red-500 mt-1">{fieldErrors.address}</p>}
              </div>
            </div>
          </section>

          <div className="border-t border-gray-100 dark:border-zinc-800 my-8"></div>

          {/* Kondisional: Data Spesifik */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-600 rounded-full inline-block"></span>
              {form.type === "individu" ? "Data Pribadi" : "Legalitas Perusahaan"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {form.type === "individu" ? (
                <>
                  <div className="space-y-2">
                    <Label>NIK (KTP) <span className="text-red-500">*</span></Label>
                    <Input
                      value={form.nik ?? ""}
                      onChange={(e) => handleInputChange("nik", digitsOnly(e.target.value))}
                      readOnly={readonly}
                      maxLength={16}
                      className={fieldErrors.nik ? "border-red-500" : ""}
                      placeholder="16 Digit Angka"
                    />
                    {fieldErrors.nik && <p className="text-xs text-red-500 mt-1">{fieldErrors.nik}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Jenis Kelamin <span className="text-red-500">*</span></Label>
                    <Select disabled={readonly} value={form.gender ?? ""} onValueChange={(val) => handleInputChange("gender", val)}>
                      <SelectTrigger className={`w-full ${fieldErrors.gender ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Pilih Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Laki-laki</SelectItem>
                        <SelectItem value="F">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.gender && <p className="text-xs text-red-500 mt-1">{fieldErrors.gender}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Tempat Lahir <span className="text-red-500">*</span></Label>
                    <Input
                      value={form.birth_place ?? ""}
                      onChange={(e) => handleInputChange("birth_place", e.target.value)}
                      readOnly={readonly}
                      className={fieldErrors.birth_place ? "border-red-500" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Lahir <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      value={formatDateForInput(form.birth_date) ?? ""}
                      onChange={(e) => handleInputChange("birth_date", e.target.value)}
                      readOnly={readonly}
                      className={fieldErrors.birth_date ? "border-red-500" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status Pernikahan</Label>
                    <Select disabled={readonly} value={form.marital_status ?? ""} onValueChange={(val) => handleInputChange("marital_status", val)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Belum Menikah</SelectItem>
                        <SelectItem value="married">Menikah</SelectItem>
                        <SelectItem value="divorced">Cerai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Pendidikan Terakhir</Label>
                    <Select disabled={readonly} value={form.education ?? ""} onValueChange={(val) => handleInputChange("education", val)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Pendidikan" />
                      </SelectTrigger>
                      <SelectContent>
                        {educationOptions.map((edu) => (
                          <SelectItem key={edu} value={edu}>{edu}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Pekerjaan Saat Ini</Label>
                    <Input
                      value={form.occupation ?? ""}
                      onChange={(e) => handleInputChange("occupation", e.target.value)}
                      readOnly={readonly}
                      placeholder="Contoh: Karyawan Swasta, Wiraswasta, PNS"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Bentuk Usaha <span className="text-red-500">*</span></Label>
                    <Select disabled={readonly} value={form.company_type ?? ""} onValueChange={(val) => handleInputChange("company_type", val)}>
                      <SelectTrigger className={`w-full ${fieldErrors.company_type ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Pilih Bentuk Usaha" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PT">PT (Perseroan Terbatas)</SelectItem>
                        <SelectItem value="CV">CV (Komanditer)</SelectItem>
                        <SelectItem value="UD">UD (Usaha Dagang)</SelectItem>
                        <SelectItem value="Yayasan">Yayasan</SelectItem>
                        <SelectItem value="Koperasi">Koperasi</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldErrors.company_type && <p className="text-xs text-red-500 mt-1">{fieldErrors.company_type}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>No. Registrasi / SIUP <span className="text-red-500">*</span></Label>
                    <Input
                      value={form.registration_number ?? ""}
                      onChange={(e) => handleInputChange("registration_number", e.target.value)}
                      readOnly={readonly}
                      className={fieldErrors.registration_number ? "border-red-500" : ""}
                      placeholder="Nomor Izin Usaha / NIB"
                    />
                    {fieldErrors.registration_number && <p className="text-xs text-red-500 mt-1">{fieldErrors.registration_number}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Berdiri</Label>
                    <Input
                      type="date"
                      value={formatDateForInput(form.established_at) ?? ""}
                      onChange={(e) => handleInputChange("established_at", e.target.value)}
                      readOnly={readonly}
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Keamanan & Status (Jika tidak readonly & mode Add, atau edit status) */}
          <div className="border-t border-gray-100 dark:border-zinc-800 my-8"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Password Section */}
            {!readonly && !form.id && (
              <section className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-1 h-6 bg-red-500 rounded-full inline-block"></span>
                  Keamanan Akun
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Password <span className="text-red-500">*</span></Label>
                    <Input
                      type="password"
                      value={form.password ?? ""}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={fieldErrors.password ? "border-red-500" : ""}
                    />
                    {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Konfirmasi Password <span className="text-red-500">*</span></Label>
                    <Input
                      type="password"
                      value={form.password_confirmation ?? ""}
                      onChange={(e) => handleInputChange("password_confirmation", e.target.value)}
                      className={fieldErrors.password_confirmation ? "border-red-500" : ""}
                    />
                    {fieldErrors.password_confirmation && <p className="text-xs text-red-500 mt-1">{fieldErrors.password_confirmation}</p>}
                  </div>
                </div>
              </section>
            )}

            {/* Status Section */}
            <section className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-6 bg-orange-500 rounded-full inline-block"></span>
                Status Keanggotaan
              </h3>
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:bg-zinc-900 space-y-3">
                 <Label>Pilih Status:</Label>
                 <Select
                    disabled={readonly}
                    value={String(form.status ?? 0)}
                    onValueChange={(val) => handleInputChange("status", Number(val) as 0 | 1 | 2)}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${opt.value === 1 ? "bg-green-500" : opt.value === 2 ? "bg-red-500" : "bg-yellow-500"}`}></span>
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">
                    Status menentukan akses anggota ke layanan koperasi.
                  </p>
              </div>
            </section>
          </div>

          <div className="border-t border-gray-100 dark:border-zinc-800 my-8"></div>

          {/* Dokumen Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-6 bg-teal-500 rounded-full inline-block"></span>
                Dokumen Pendukung
              </h3>
              {!readonly && (
                <Button type="button" size="sm" onClick={addDocRow} className="gap-2">
                  <Plus size={16} /> Tambah File
                </Button>
              )}
            </div>
            
            <div className="grid gap-4">
              {(form.documents as DocumentsAnggota[] | undefined)?.map((doc, idx) => {
                  const firstMedia = doc.media?.[0];
                  const existingUrl = firstMedia?.original_url ?? "";
                  const docErrMsg = docErrors[idx];

                  return (
                    <div key={idx} className="relative group border rounded-xl p-4 transition-all hover:shadow-md bg-white dark:bg-zinc-900">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-5 space-y-2">
                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Dokumen</Label>
                          <div className="relative">
                            <FileText size={16} className="absolute left-3 top-3 text-gray-400" />
                            <Input
                              value={doc.key ?? ""}
                              readOnly={readonly}
                              onChange={(e) => updateDoc(idx, "key", e.target.value)}
                              className={`pl-9 ${docErrMsg ? "border-red-500" : ""}`}
                              placeholder="Contoh: KTP, KK, SIUP"
                            />
                          </div>
                          {docErrMsg && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {docErrMsg}</p>}
                        </div>

                        <div className="md:col-span-6 space-y-2">
                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">File Upload</Label>
                          <Input
                            type="file"
                            disabled={readonly}
                            onChange={(e) => updateDoc(idx, "document", e.target.files?.[0] || null)}
                            className="file:bg-blue-50 file:text-blue-600 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:text-sm hover:file:bg-blue-100 transition-colors"
                          />
                          {existingUrl && (
                            <a href={existingUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                              <FileText size={12} /> Lihat file tersimpan
                            </a>
                          )}
                        </div>

                        {!readonly && (
                          <div className="md:col-span-1 flex justify-end pt-6">
                             <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDocRow(idx)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
              })}
            </div>
            {(form.documents?.length === 0) && (
              <div className="text-center py-8 border-2 border-dashed rounded-xl text-gray-400 bg-gray-50/50">
                 Belum ada dokumen yang dilampirkan.
              </div>
            )}
          </section>

        </form>
      </div>

      {/* Footer / Sticky Action Bar */}
      <div className="p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 flex justify-end items-center gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isLoading} className="px-6">
          Batal
        </Button>
        {!readonly && (
          <Button onClick={handleSave} disabled={isLoading} className="px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200 dark:shadow-none">
            {isLoading ? "Menyimpan..." : (form.id ? "Simpan Perubahan" : "Simpan Data")}
          </Button>
        )}
      </div>
    </div>
  );
}