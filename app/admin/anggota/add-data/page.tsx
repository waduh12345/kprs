"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import {
  useGetAnggotaByIdQuery,
  useCreateAnggotaMutation,
  useUpdateAnggotaMutation,
} from "@/services/koperasi-service/anggota.service";
import type { DocumentsAnggota } from "@/types/koperasi-types/anggota";
import AnggotaForm, { AnggotaFormState } from "@/components/form-modal/koperasi-modal/anggota-form";

// Helper dokumen kosong
const makeEmptyDoc = (anggota_id = 0): DocumentsAnggota => ({
  id: 0,
  anggota_id,
  key: "",
  document: null,
  created_at: "",
  updated_at: "",
  media: [],
});

export default function AnggotaAddEditPage() {
  return (
    <Suspense fallback={<div className="p-6">Memuat formulir...</div>}>
      <AnggotaAddEditPageInner />
    </Suspense>
  );
}

function AnggotaAddEditPageInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const mode = sp.get("mode") || "add";
  const idParam = sp.get("id");
  const id = idParam ? Number(idParam) : undefined;
  const isEdit = mode === "edit";
  const isDetail = mode === "detail";

  // Fetch Data
  const { data: detailData, isFetching } = useGetAnggotaByIdQuery(id!, {
    skip: !id || mode === "add",
    refetchOnMountOrArgChange: true,
  });

  const [createAnggota, { isLoading: isCreating }] = useCreateAnggotaMutation();
  const [updateAnggota, { isLoading: isUpdating }] = useUpdateAnggotaMutation();

  const [form, setForm] = useState<AnggotaFormState>({
    type: "individu",
    status: 0,
    documents: [makeEmptyDoc()],
  });

  // --- LOGIC MAPPING DATA API KE FORM ---
  useEffect(() => {
    if ((isEdit || isDetail) && detailData) {
      // 1. Tentukan Tipe
      const type = (detailData.type as "individu" | "perusahaan") || "individu";
      
      // 2. Ambil data nested berdasarkan tipe
      // Tipe detailData bisa memiliki properti 'individu' atau 'perusahaan'
      type RawDataType = typeof detailData & {
        individu?: {
          name?: string;
          email?: string;
          phone?: string;
          address?: string;
          npwp?: string;
          nik?: string;
          gender?: string;
          birth_place?: string;
          birth_date?: string;
          marital_status?: string;
          education?: string;
          occupation?: string;
        };
        perusahaan?: {
          name?: string;
          email?: string;
          phone?: string;
          address?: string;
          npwp?: string;
          company_type?: string;
          registration_number?: string;
          established_at?: string;
        };
      };
      const rawData = detailData as RawDataType; 
      const specificData = type === "individu" ? rawData.individu : rawData.perusahaan;

      // 3. Siapkan Dokumen (Reset file object, pertahankan media untuk preview)
      const docs: DocumentsAnggota[] =
        detailData.documents && detailData.documents.length > 0
          ? detailData.documents.map((d: DocumentsAnggota) => ({
              ...d,
              document: null, // Reset input file
              // Pastikan media terhubung agar tombol "Lihat file" muncul
              media: d.media || [] 
            }))
          : [makeEmptyDoc(detailData.id)];

      // 4. Konstruksi Form State (Flattening Data)
      const formData: AnggotaFormState = {
        id: detailData.id,
        type: type,
        status: detailData.status, // Status ada di root
        documents: docs,
        
        // Data Umum (diambil dari specificData: individu/perusahaan)
        name: specificData?.name || "",
        email: specificData?.email || "",
        phone: specificData?.phone || "",
        address: specificData?.address || "",
        npwp: specificData?.npwp || "",
        
        // Data Spesifik Individu
        ...(type === "individu" && rawData.individu && {
          nik: rawData.individu.nik,
          gender: rawData.individu.gender,
          birth_place: rawData.individu.birth_place,
          birth_date: rawData.individu.birth_date, // Format ISO string akan dihandle oleh formatDateForInput di form
          marital_status: rawData.individu.marital_status,
          education: rawData.individu.education,
          occupation: rawData.individu.occupation,
        }),

        // Data Spesifik Perusahaan
        ...(type === "perusahaan" && specificData && {
          company_type: (specificData as RawDataType["perusahaan"])?.company_type,
          registration_number: (specificData as RawDataType["perusahaan"])?.registration_number,
          established_at: (specificData as RawDataType["perusahaan"])?.established_at,
        }),
      };

      setForm(formData);
    }
  }, [detailData, isEdit, isDetail]);

  const handleSubmit = async () => {
    try {
      // Validasi sederhana sebelum kirim
      if (!form.name || !form.email) throw new Error("Data wajib belum lengkap");

      const fd = new FormData();
      
      // -- Append Fields Umum --
      fd.append("type", form.type);
      fd.append("name", form.name ?? "");
      fd.append("email", form.email ?? "");
      fd.append("phone", form.phone ?? "");
      fd.append("address", form.address ?? "");
      fd.append("npwp", form.npwp ?? "");
      fd.append("status", String(form.status ?? 0));

      // Password (hanya kirim jika diisi)
      if (form.password && form.password_confirmation) {
        fd.append("password", form.password);
        fd.append("password_confirmation", form.password_confirmation);
      }

      // Append Spesifik Individu/Perusahaan
      if (form.type === "individu") {
        fd.append("nik", form.nik ?? "");
        fd.append("gender", form.gender ?? "");
        fd.append("birth_place", form.birth_place ?? "");
        fd.append("birth_date", form.birth_date ?? "");
        fd.append("marital_status", form.marital_status ?? "");
        fd.append("education", form.education ?? "");
        fd.append("occupation", form.occupation ?? "");
      } else {
        fd.append("company_type", form.company_type ?? "");
        fd.append("registration_number", form.registration_number ?? "");
        fd.append("established_at", form.established_at ?? "");
      }

      // -- Append Documents (PERBAIKAN DISINI) --
      const docs = (form.documents ?? []) as DocumentsAnggota[];
      
      // Kita gunakan index manual (docIndex) agar urutan array documents di FormData 
      // tetap rapi (0, 1, 2...) meskipun ada dokumen lama yang kita skip.
      let docIndex = 0;

      docs.forEach((d) => {
        // LOGIC: Hanya kirim ke backend jika 'document' adalah File baru.
        // Jika dokumen lama (d.document === null atau string), JANGAN kirim.
        // Cast ke unknown karena tipe DocumentsAnggota.document adalah string | null.
        const doc = d.document as unknown;
        if (doc instanceof File) {
          fd.append(`documents[${docIndex}][key]`, d.key);
          fd.append(`documents[${docIndex}][file]`, doc);
          
          // Jika ini adalah replace file untuk dokumen yang sudah ada (punya ID)
          // Kirim ID-nya agar backend tahu ini update, bukan create baru.
          if (d.id) {
             fd.append(`documents[${docIndex}][id]`, String(d.id));
          }
          
          // Increment index hanya jika kita benar-benar append data
          docIndex++;
        }
      });

      if (isEdit && id) {
        await updateAnggota({ id, payload: fd }).unwrap();
        Swal.fire("Sukses", "Data berhasil diperbarui", "success");
      } else {
        await createAnggota(fd).unwrap();
        Swal.fire("Sukses", "Data berhasil ditambahkan", "success");
      }

      router.push("/admin/anggota");
    } catch (err: unknown) {
      // Menampilkan pesan error detail dari backend jika ada
      let msg = "Gagal menyimpan data";
      if (typeof err === "object" && err !== null) {
        const errorObj = err as { data?: { message?: string; errors?: unknown }; message?: string };
        msg = errorObj.data?.message || errorObj.message || msg;
        // Jika ada error spesifik per field (seperti documents.0.file), tampilkan di console
        if (errorObj.data?.errors) console.error("Validation Errors:", errorObj.data.errors);
      }
      Swal.fire("Gagal", msg, "error");
    }
  };

  return (
    <div className="p-6 w-full">
      <AnggotaForm
        form={form}
        setForm={setForm}
        onCancel={() => router.back()}
        onSubmit={handleSubmit}
        readonly={isDetail}
        isLoading={isCreating || isUpdating || isFetching}
      />
    </div>
  );
}