import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import KasirLayout from '@/components/admin/KasirLayout';
import KasirDashboard from '@/components/kasir/KasirDashboard';
import POS from '@/components/kasir/POS';
import TransactionsTable from '@/components/kasir/TransactionsTable';

const Kasir = () => {
  // Enhanced scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <KasirLayout>
      <Routes>
        <Route path="/" element={<KasirDashboard />} />
        <Route path="/penjualan" element={<POS />} />
        <Route path="/transaksi" element={<TransactionsTable />} />
        <Route path="/produk" element={<div className="p-6"><h1 className="text-2xl font-bold">Produk</h1><p className="text-gray-600">Halaman ini sedang dalam pengembangan</p></div>} />
        <Route path="/inventori" element={<div className="p-6"><h1 className="text-2xl font-bold">Stok/Inventori</h1><p className="text-gray-600">Halaman ini sedang dalam pengembangan</p></div>} />
        <Route path="/pelanggan" element={<div className="p-6"><h1 className="text-2xl font-bold">Pelanggan</h1><p className="text-gray-600">Halaman ini sedang dalam pengembangan</p></div>} />
        <Route path="/struk" element={<div className="p-6"><h1 className="text-2xl font-bold">Struk</h1><p className="text-gray-600">Halaman ini sedang dalam pengembangan</p></div>} />
        <Route path="/pengaturan" element={<div className="p-6"><h1 className="text-2xl font-bold">Pengaturan</h1><p className="text-gray-600">Halaman ini sedang dalam pengembangan</p></div>} />
        <Route path="*" element={<Navigate to="/kasir" replace />} />
      </Routes>
    </KasirLayout>
  );
};

export default Kasir;