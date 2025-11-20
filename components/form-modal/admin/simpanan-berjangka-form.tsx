// src/components/simpanan-berjangka/SimpananBerjangkaModalForm.tsx (Contoh lokasi)

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from 'sweetalert2';

interface SimpananBerjangkaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SimpananBerjangkaFormData) => void;
}

interface SimpananBerjangkaFormData {
  anggota_name: string;
  produk: string;
  jangka_waktu: number;
  nominal_awal: number;
  tanggal_mulai: string;
}

// Data Dummy untuk pilihan di form
const DUMMY_PRODUCTS = [
    { id: 'Emas', name: 'Simjaka Emas', tenors: [12, 24, 36] },
    { id: 'Prioritas', name: 'Simjaka Prioritas', tenors: [6, 12, 18, 24] },
    { id: 'Reguler', name: 'Simjaka Reguler', tenors: [3, 6, 9, 12] },
];

const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(number);
};
const parseNominal = (value: string) => parseFloat(value.replace(/[^0-9]/g, '')) || 0;


const SimpananBerjangkaModalForm: React.FC<SimpananBerjangkaModalProps> = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  const today = new Date().toISOString().substring(0, 10);

  const [formData, setFormData] = useState<Omit<SimpananBerjangkaFormData, 'jangka_waktu' | 'nominal_awal'> & { jangka_waktu: string, nominal_awal: string }>({
    anggota_name: '',
    produk: DUMMY_PRODUCTS[0].id,
    jangka_waktu: DUMMY_PRODUCTS[0].tenors[0].toString(),
    nominal_awal: '',
    tanggal_mulai: today,
  });

  const selectedProduct = useMemo(() => DUMMY_PRODUCTS.find(p => p.id === formData.produk), [formData.produk]);
  const nominalValue = useMemo(() => parseNominal(formData.nominal_awal), [formData.nominal_awal]);
  
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numberValue = parseFloat(rawValue);
    setFormData(prev => ({ 
        ...prev, 
        nominal_awal: isNaN(numberValue) ? '' : formatRupiah(numberValue) 
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.anggota_name.trim() || nominalValue <= 0) {
        return Swal.fire('Gagal', 'Nama anggota dan nominal awal wajib diisi.', 'error');
    }
    
    const dataToSubmit: SimpananBerjangkaFormData = {
        anggota_name: formData.anggota_name.trim(),
        produk: formData.produk,
        jangka_waktu: parseInt(formData.jangka_waktu),
        nominal_awal: nominalValue,
        tanggal_mulai: formData.tanggal_mulai,
    };
    
    onSubmit(dataToSubmit);
    onClose();
    
    // Reset form setelah submit
    setFormData({
        anggota_name: '',
        produk: DUMMY_PRODUCTS[0].id,
        jangka_waktu: DUMMY_PRODUCTS[0].tenors[0].toString(),
        nominal_awal: '',
        tanggal_mulai: today,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
            <DollarSign className="h-5 w-5" /> Tambah Simpanan Berjangka Baru
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            
            {/* Input Nama Anggota */}
            <div className="space-y-2">
              <Label htmlFor="anggota_name">Nama Anggota</Label>
              <Input
                id="anggota_name"
                value={formData.anggota_name}
                onChange={(e) => setFormData(prev => ({ ...prev, anggota_name: e.target.value }))}
                placeholder="Masukkan Nama Anggota"
                required
              />
            </div>
            
            {/* Pilihan Produk dan Tenor */}
            <div className='grid grid-cols-2 gap-4'>
                <div className="space-y-2">
                    <Label htmlFor="produk">Produk Simpanan</Label>
                    <Select onValueChange={(v) => {
                        setFormData(prev => ({ 
                            ...prev, 
                            produk: v, 
                            // Set tenor default berdasarkan produk baru
                            jangka_waktu: DUMMY_PRODUCTS.find(p => p.id === v)?.tenors[0].toString() || '3' 
                        }))
                    }} value={formData.produk}>
                        <SelectTrigger id="produk">
                            <SelectValue placeholder="Pilih Produk" />
                        </SelectTrigger>
                        <SelectContent>
                            {DUMMY_PRODUCTS.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tenor">Jangka Waktu (Bulan)</Label>
                    <Select onValueChange={(v) => setFormData(prev => ({ ...prev, jangka_waktu: v }))} value={formData.jangka_waktu}>
                        <SelectTrigger id="tenor">
                            <SelectValue placeholder="Pilih Tenor" />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedProduct?.tenors.map(t => (
                                <SelectItem key={t} value={t.toString()}>
                                    {t} Bulan
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {/* Nominal dan Tanggal */}
            <div className='grid grid-cols-2 gap-4'>
                <div className="space-y-2">
                    <Label htmlFor="nominal">Nominal Awal Setoran</Label>
                    <Input
                        id="nominal"
                        value={formData.nominal_awal}
                        onChange={handleNominalChange}
                        placeholder="Contoh: 5.000.000"
                        className="font-semibold text-right"
                        required
                    />
                    {nominalValue > 0 && <p className="text-xs text-gray-500">Nominal: {formatRupiah(nominalValue)}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="tanggal_mulai">Tanggal Mulai Simpanan</Label>
                    <Input
                        id="tanggal_mulai"
                        type="date"
                        value={formData.tanggal_mulai}
                        onChange={(e) => setFormData(prev => ({ ...prev, tanggal_mulai: e.target.value }))}
                        required
                    />
                </div>
            </div>

          </div>
          <div className="p-4 bg-gray-50 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" /> Simpan Data
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpananBerjangkaModalForm;