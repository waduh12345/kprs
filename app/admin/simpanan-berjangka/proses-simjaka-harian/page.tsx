"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  Play,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Settings,
  List,
} from "lucide-react";
import Swal from "sweetalert2";

// --- DUMMY DATA & TYPES ---

interface LogEntry {
  timestamp: string;
  activity: string;
  status: "SUCCESS" | "ERROR" | "INFO";
}

const initialLog: LogEntry[] = [
  {
    timestamp: "2025-11-16 23:59:59",
    activity: "Proses Bunga Simjaka harian Selesai.",
    status: "SUCCESS",
  },
  {
    timestamp: "2025-11-16 00:00:05",
    activity: "Memulai pengecekan status jatuh tempo...",
    status: "INFO",
  },
  {
    timestamp: "2025-11-15 23:59:59",
    activity: "Proses Bunga Simjaka harian Selesai.",
    status: "SUCCESS",
  },
  {
    timestamp: "2025-11-15 10:30:00",
    activity: "Gagal memproses rekening 12345-004: Data bunga tidak valid.",
    status: "ERROR",
  },
];

// --- HELPER FUNCTIONS ---

const getStatusIcon = (status: LogEntry["status"]) => {
  if (status === "SUCCESS")
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === "ERROR")
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  return <List className="h-4 w-4 text-blue-500" />;
};

// --- KOMPONEN UTAMA ---

export default function ProsesSimjakaHarianPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastRun, setLastRun] = useState("2025-11-16 23:59:59");
  const [executionDate, setExecutionDate] = useState("2025-11-17"); // Tanggal eksekusi yang disimulasikan
  const [logData, setLogData] = useState<LogEntry[]>(initialLog);

  // --- HANDLER PROSES HARIAN ---
  const handleRunProcess = async () => {
    if (isProcessing) return;

    const confirm = await Swal.fire({
      title: "Konfirmasi Eksekusi Harian",
      html: `Anda akan menjalankan **Proses Simpanan Berjangka Harian** untuk tanggal **${executionDate}**.<br/><br/>Proses ini meliputi:
        <ul>
            <li>Pembukuan bunga harian/akumulasi.</li>
            <li>Pengecekan status jatuh tempo.</li>
        </ul>
        <p class='mt-2 font-semibold text-red-600'>Pastikan proses sebelumnya telah selesai!</p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Jalankan Proses",
      showLoaderOnConfirm: true,
      preConfirm: () => {
        // Simulasi pemanggilan API
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(true);
          }, 2000);
        });
      },
    });

    if (confirm.isConfirmed) {
      setIsProcessing(true);
      Swal.close();

      // Simulasi proses berjalan
      setTimeout(() => {
        const newTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const newLogEntry: LogEntry = {
          timestamp: newTimestamp,
          activity: `Proses Harian Simjaka untuk tanggal ${executionDate} berhasil diselesaikan.`,
          status: "SUCCESS",
        };

        setLogData((prev) => [newLogEntry, ...prev]);
        setLastRun(newTimestamp);
        setIsProcessing(false);
        setExecutionDate(
          new Date(new Date(executionDate).setDate(new Date(executionDate).getDate() + 1))
            .toISOString()
            .substring(0, 10)
        ); // Majukan tanggal simulasi
        
        Swal.fire({
          icon: "success",
          title: "Proses Selesai",
          text: `Proses harian untuk ${executionDate} berhasil dieksekusi.`,
        });
      }, 3000); // Waktu simulasi pemrosesan
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        Proses Simpanan Berjangka Harian
      </h2>

      {/* --- KARTU KONTROL EKSEKUSI --- */}
      <Card className="border-t-4 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5" />
            Kontrol Eksekusi Harian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tanggal Proses yang Akan Dijalankan</p>
                <div className="text-lg font-bold text-primary">{executionDate}</div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Terakhir Dijalankan</p>
                <div className="text-lg font-bold">{lastRun}</div>
              </div>
            </div>

            <Button
              onClick={handleRunProcess}
              disabled={isProcessing}
              className={`w-full text-lg ${isProcessing ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-primary hover:bg-indigo-700'}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sedang Memproses...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Jalankan Proses Harian
                </>
              )}
            </Button>
            <p className="text-xs text-red-500 mt-2">
              *Proses ini hanya boleh dijalankan sekali sehari setelah pergantian tanggal (00:00).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* --- LOG RIWAYAT PROSES --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <List className="h-5 w-5" />
            Riwayat Log Proses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3 w-1/4">Waktu</th>
                <th className="px-4 py-3 w-1/6">Status</th>
                <th className="px-4 py-3">Aktivitas</th>
              </tr>
            </thead>
            <tbody>
              {logData.map((log, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    {log.status}
                  </td>
                  <td className="px-4 py-3">{log.activity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}