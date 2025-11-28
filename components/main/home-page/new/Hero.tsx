"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-translation";
import en from "@/translations/home/en";
import id from "@/translations/home/id";
import { HandshakeIcon, LandmarkIcon, Pencil, Check, X, Link as LinkIcon, ImageIcon, Palette, Upload, Image as ThemedImage } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

// --- Tipe Data untuk Background ---
type BackgroundState = {
  type: 'color' | 'image';
  value: string; // Hex color atau URL gambar
};

// =========================================
// Helper: Fungsi Upload File Generik
// =========================================
const handleFileUpload = (event: ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Catatan: Di aplikasi nyata, Anda akan mengunggah file ini ke server (misal AWS S3)
  // dan mendapatkan URL publik. Untuk demo ini, kita gunakan FileReader untuk pratinjau lokal.
  const reader = new FileReader();
  reader.onloadend = () => {
    if (typeof reader.result === 'string') {
      callback(reader.result);
    }
  };
  reader.readAsDataURL(file);
};


// =========================================
// 1. Komponen Helper: EditableContent (Teks) - TIDAK BERUBAH
// =========================================
const EditableContent = ({
  text, onSave, isEditMode, tag: Tag = "div", className, multiline = false,
}: {
  text: string; onSave: (val: string) => void; isEditMode: boolean; tag?: any; className?: string; multiline?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(text);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => { onSave(tempValue); setIsEditing(false); };
  const handleCancel = () => { setTempValue(text); setIsEditing(false); };

  if (isEditMode && isEditing) {
    return (
      <div className="flex gap-2 items-start relative z-20 my-1 font-normal">
        {multiline ? (
          <textarea ref={inputRef as any} value={tempValue} onChange={(e) => setTempValue(e.target.value)} className={cn("w-full p-2 border-2 border-blue-500 rounded bg-white text-gray-900 shadow-lg min-h-[120px] text-base resize-y", className)} onKeyDown={(e) => { if(e.key === 'Escape') handleCancel(); }} />
        ) : (
          <input ref={inputRef as any} value={tempValue} onChange={(e) => setTempValue(e.target.value)} className={cn("w-full p-2 border-2 border-blue-500 rounded bg-white text-gray-900 shadow-lg", className)} onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }} />
        )}
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={handleSave} className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 shadow-sm"><Check size={18} /></button>
          <button onClick={handleCancel} className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 shadow-sm"><X size={18} /></button>
        </div>
      </div>
    );
  }

  return (
    <Tag onClick={() => isEditMode && setIsEditing(true)} className={cn(className, isEditMode ? "hover:outline-2 hover:outline-dashed hover:outline-blue-500 hover:bg-blue-50/50 rounded px-1 -mx-1 cursor-text transition-all relative group" : "")}>
     {text}
     {isEditMode && <span className="absolute -top-2.5 -right-2.5 hidden group-hover:flex h-5 w-5 bg-blue-500 text-white rounded-full items-center justify-center shadow-sm pointer-events-none"><Pencil size={10} /></span>}
    </Tag>
  );
};

// =========================================
// 2. Komponen Helper: EditableButton (Tombol) - TIDAK BERUBAH
// =========================================
const EditableButton = ({
  label, url, onSave, isEditMode, icon: Icon, className,
}: {
  label: string; url: string; onSave: (newLabel: string, newUrl: string) => void; isEditMode: boolean; icon: any; className?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLabel, setTempLabel] = useState(label);
  const [tempUrl, setTempUrl] = useState(url);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isEditing && labelInputRef.current) { labelInputRef.current.focus(); labelInputRef.current.select(); } }, [isEditing]);
  const handleSave = () => { onSave(tempLabel, tempUrl); setIsEditing(false); };
  const handleCancel = () => { setTempLabel(label); setTempUrl(url); setIsEditing(false); }

  if (isEditMode && isEditing) {
    return (
      <div className="flex flex-col gap-2 p-3 border-2 border-blue-500 bg-white rounded-xl shadow-xl z-30 relative w-full md:w-auto min-w-[250px] font-normal text-left">
        <div className="space-y-2">
            <div><label className="text-xs text-gray-500 font-semibold flex items-center gap-1 mb-0.5"><Pencil size={12}/> Label Tombol</label><input ref={labelInputRef} value={tempLabel} onChange={e => setTempLabel(e.target.value)} className="w-full p-1.5 border rounded text-sm text-gray-800 font-medium" /></div>
            <div><label className="text-xs text-gray-500 font-semibold flex items-center gap-1 mb-0.5"><LinkIcon size={12}/> URL Tujuan</label><input value={tempUrl} onChange={e => setTempUrl(e.target.value)} className="w-full p-1.5 border rounded text-sm text-gray-600 bg-gray-50 font-mono" /></div>
        </div>
        <div className="flex gap-2 justify-end mt-1"><button onClick={handleCancel} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-1"><X size={14}/> Batal</button><button onClick={handleSave} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"><Check size={14}/> Simpan</button></div>
      </div>
    );
  }
  const ButtonWrapper = isEditMode ? 'div' : Link;
  const wrapperProps = isEditMode ? { onClick: () => setIsEditing(true), role: "button" } : { href: url };
  return (
    <ButtonWrapper {...wrapperProps as any} className={cn(className, "relative group transition flex items-center gap-x-1.5 cursor-pointer", isEditMode ? "hover:outline-2 hover:outline-dashed hover:outline-blue-500 hover:ring-4 hover:ring-blue-50/50" : "")}>
      <Icon className="size-5 shrink-0" /><span className="truncate">{label}</span>
       {isEditMode && <span className="absolute -top-2 -right-2 hidden group-hover:flex h-6 w-6 bg-blue-600 text-white rounded-full items-center justify-center shadow-md z-10 pointer-events-none"><Pencil size={12} /></span>}
    </ButtonWrapper>
  );
};


// =========================================
// 3. Komponen Utama Hero
// =========================================
export default function Hero() {
  const t = useTranslation({ id, en });
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  // Refs untuk input file tersembunyi
  const heroImageInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  // State Gabungan
  const [heroContent, setHeroContent] = useState({
    titleHighlight: "Koperasi Merah Putih:",
    titleMain: "Mandiri, Sejahtera, dan Berdaya",
    description: "Wujudkan impian finansial Anda bersama kami. Nikmati layanan simpan pinjam yang mudah dan cepat, serta jelajahi beragam produk unggulan dari UMKM lokal di marketplace kami.",
    btn1Text: "Layanan Koperasi", btn1Url: "/service",
    btn2Text: "Marketplace", btn2Url: "/product",
    heroImageSrc: "/hero-koperasi.webp",
    // State Background Baru
    background: { type: 'color', value: '#ffffff' } as BackgroundState
  });

  // State untuk Modal Background Editor
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  // State sementara saat di dalam modal sebelum disimpan
  const [tempBgState, setTempBgState] = useState<BackgroundState>(heroContent.background);


  // Handler: Klik Ganti Gambar Hero
  const handleHeroImageClick = () => {
    heroImageInputRef.current?.click();
  };

  // Handler: File Gambar Hero Berubah
  const onHeroImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (url) => {
        setHeroContent(prev => ({ ...prev, heroImageSrc: url }));
    });
  };
  
   // Handler: File Gambar Background Berubah (di dalam modal)
   const onBgImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (url) => {
        setTempBgState({ type: 'image', value: url });
    });
  };

  // Handler: Simpan Background dari Modal
  const saveBackgroundSettings = () => {
      setHeroContent(prev => ({...prev, background: tempBgState}));
      setIsBgModalOpen(false);
  }


  // Menentukan style background dinamis untuk section
  const sectionStyle = heroContent.background.type === 'color' 
    ? { backgroundColor: heroContent.background.value }
    : { backgroundImage: `url(${heroContent.background.value})`, backgroundSize: 'cover', backgroundPosition: 'center' };


  return (
    <>
    {/* Input File Tersembunyi untuk Hero Image */}
    <input type="file" ref={heroImageInputRef} onChange={onHeroImageFileChange} accept="image/*" className="hidden" />
    
    {/* Section Utama dengan Background Dinamis */}
    <section className={cn("relative py-16 transition-all group/section", isEditMode ? "hover:ring-4 hover:ring-blue-400/30" : "")} style={sectionStyle}>

      {/* Tombol Trigger Edit Background (Muncul saat section di-hover di mode edit) */}
      {isEditMode && (
        <button 
            onClick={() => { setTempBgState(heroContent.background); setIsBgModalOpen(true); }}
            className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-md z-30 text-sm font-bold flex items-center gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity hover:bg-blue-700"
        >
          <Palette size={16} /> Ubah Background
        </button>
      )}

      {/* Indikator Mode Edit Fixed */}
      {isEditMode && !isBgModalOpen && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm font-bold flex items-center gap-2 animate-bounce pointer-events-none">
          <Pencil size={16} /> Mode Editor Aktif
        </div>
      )}

      <div className="container mx-auto grid md:grid-cols-2 gap-10 items-center px-6 overflow-visible relative z-10">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 z-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight drop-shadow-sm">
            <EditableContent isEditMode={isEditMode} tag="span" text={heroContent.titleHighlight} className="text-[#E53935] block md:inline" onSave={(val) => setHeroContent({ ...heroContent, titleHighlight: val })} />
            {" "} <br className="hidden md:block" />
            <EditableContent isEditMode={isEditMode} tag="span" text={heroContent.titleMain} className="" onSave={(val) => setHeroContent({ ...heroContent, titleMain: val })} />
          </h1>

          <EditableContent isEditMode={isEditMode} tag="p" multiline={true} text={heroContent.description} className="text-gray-700 text-lg font-medium drop-shadow-sm" onSave={(val) => setHeroContent({ ...heroContent, description: val })} />

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 pt-2 items-start">
            <EditableButton isEditMode={isEditMode} label={heroContent.btn1Text} url={heroContent.btn1Url} icon={LandmarkIcon} className="px-6 py-3 bg-[#E53935] text-white font-medium rounded-xl shadow-md hover:bg-red-600" onSave={(newLabel, newUrl) => setHeroContent({...heroContent, btn1Text: newLabel, btn1Url: newUrl})} />
            <EditableButton isEditMode={isEditMode} label={heroContent.btn2Text} url={heroContent.btn2Url} icon={HandshakeIcon} className="px-6 py-3 bg-gray-100 text-gray-800 font-medium rounded-xl shadow-md hover:bg-gray-200 border border-gray-200" onSave={(newLabel, newUrl) => setHeroContent({...heroContent, btn2Text: newLabel, btn2Url: newUrl})} />
          </div>
        </motion.div>

        {/* Image Content yang Bisa Diedit */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center relative group rounded-2xl"
        >
           {/* Overlay Edit Gambar Hero */}
           {isEditMode && (
            <div 
                onClick={handleHeroImageClick}
                className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl cursor-pointer z-10 flex flex-col items-center justify-center text-white backdrop-blur-sm border-4 border-transparent group-hover:border-blue-400 hover:!border-dashed"
            >
               <ImageIcon size={48} className="mb-2 opacity-80" />
               <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 shadow-lg transition-transform group-hover:scale-105">
                 <Upload size={18} /> Upload Gambar Baru
               </button>
            </div>
           )}

          <Image src={heroContent.heroImageSrc} alt="Hero Image" width={500} height={500} className={cn("rounded-2xl shadow-lg object-cover transition-all", isEditMode ? "group-hover:blur-sm group-hover:scale-[0.99]" : "")} />
        </motion.div>
      </div>
      
      {/* Overlay Gelap untuk Background Image agar teks tetap terbaca (opsional) */}
      {heroContent.background.type === 'image' && (
         <div className="absolute inset-0 bg-white/70 pointer-events-none z-0"></div>
      )}

    </section>


    {/* =========================================
        MODAL EDIT BACKGROUND
        ========================================= */}
    {isEditMode && isBgModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <motion.div initial={{opacity:0, scale: 0.9}} animate={{opacity:1, scale: 1}} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden font-sans">
                {/* Header Modal */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Palette size={20} className="text-blue-600"/> Atur Latar Belakang</h3>
                    <button onClick={() => setIsBgModalOpen(false)} className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full p-1 transition"><X size={24} /></button>
                </div>
                
                {/* Body Modal */}
                <div className="p-6 space-y-6">
                    {/* Pilihan Tipe Background (Tabs Sederhana) */}
                    <div className="flex p-1 bg-gray-100 rounded-lg gap-1">
                        <button 
                            onClick={() => setTempBgState({ type: 'color', value: '#ffffff' })}
                            className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all", tempBgState.type === 'color' ? "bg-white shadow text-blue-600" : "text-gray-600 hover:bg-gray-200")}
                        >
                            <Palette size={16}/> Warna Solid
                        </button>
                        <button 
                             onClick={() => setTempBgState({ type: 'image', value: '' })}
                             className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all", tempBgState.type === 'image' ? "bg-white shadow text-blue-600" : "text-gray-600 hover:bg-gray-200")}
                        >
                            <ThemedImage size={16}/> Gambar
                        </button>
                    </div>

                    {/* Konten Tab: Warna */}
                    {tempBgState.type === 'color' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                            <label className="block text-sm font-semibold text-gray-700">Pilih Warna:</label>
                            <div className="flex items-center gap-3 p-2 border rounded-lg hover:border-blue-400 transition">
                                <input type="color" value={tempBgState.value} onChange={(e) => setTempBgState({ type: 'color', value: e.target.value })} className="h-12 w-12 rounded cursor-pointer border-none p-0" />
                                <input type="text" value={tempBgState.value} onChange={(e) => setTempBgState({ type: 'color', value: e.target.value })} className="flex-1 border-none outline-none text-gray-700 font-mono uppercase" placeholder="#RRGGBB"/>
                            </div>
                        </div>
                    )}

                    {/* Konten Tab: Gambar */}
                    {tempBgState.type === 'image' && (
                         <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                            <label className="block text-sm font-semibold text-gray-700">Upload Gambar:</label>
                            <input type="file" ref={bgImageInputRef} onChange={onBgImageFileChange} accept="image/*" className="hidden" />
                            <div 
                                onClick={() => bgImageInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center gap-2 group"
                            >
                                <Upload size={32} className="text-gray-400 group-hover:text-blue-500"/>
                                <p className="text-sm text-gray-600 font-medium">Klik untuk memilih file gambar</p>
                                <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 5MB</p>
                            </div>

                            {/* Preview Gambar yang Dipilih di Modal */}
                            {tempBgState.value && (
                                <div className="mt-4">
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Preview:</p>
                                    <div className="relative h-32 w-full rounded-lg overflow-hidden border">
                                        <Image src={tempBgState.value} alt="Background Preview" fill className="object-cover" />
                                    </div>
                                </div>
                            )}
                         </div>
                    )}
                </div>

                {/* Footer Modal (Action Buttons) */}
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button onClick={() => setIsBgModalOpen(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition">Batal</button>
                    <button onClick={saveBackgroundSettings} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium shadow-md transition flex items-center gap-2"><Check size={18}/> Terapkan Background</button>
                </div>
            </motion.div>
        </div>
    )}
    </>
  );
}