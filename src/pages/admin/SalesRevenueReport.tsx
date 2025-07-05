import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Calendar, Search, RefreshCw, ArrowLeft, ArrowRight, Package } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Order } from '@/types';

interface Transaction {
  id: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingFee: number;
  totalPayment: number;
  transactionDate: string;
  status: string;
}

const SalesRevenueReport = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Fetch transactions from Firebase with real-time updates
  useEffect(() => {
    setLoading(true);
    
    // Create date range for filtering
    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
    
    const startDateIso = startDate.toISOString();
    const endDateIso = endDate.toISOString();
    
    console.log(`Fetching orders from ${startDateIso} to ${endDateIso}`);
    
    // Create query for orders collection
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('created_at', '>=', startDateIso),
      where('created_at', '<=', endDateIso)
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        console.log('No orders found for the selected period');
        setTransactions([]);
        setTotalSales(0);
        setTotalRevenue(0);
        setLoading(false);
        return;
      }
      
      console.log(`Found ${querySnapshot.size} orders`);
      
      // Map orders to transactions
      const transactionsList: Transaction[] = querySnapshot.docs.map(doc => {
        const data = doc.data() as Order;
        return {
          id: doc.id,
          customerName: data.customer_info?.name || 'Unknown',
          items: data.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          shippingFee: data.shipping_fee || 0,
          totalPayment: data.total_price || 0,
          transactionDate: data.created_at,
          status: data.status || 'pending'
        };
      });
      
      // Sort by date (newest first)
      transactionsList.sort((a, b) => 
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
      
      setTransactions(transactionsList);
      
      // Calculate totals
      const totalSales = transactionsList.length;
      const totalRevenue = transactionsList.reduce((sum, transaction) => 
        sum + transaction.totalPayment, 0
      );
      
      setTotalSales(totalSales);
      setTotalRevenue(totalRevenue);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      setLoading(false);
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [selectedMonth, selectedYear]);

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction => 
    transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle month navigation
  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Laporan Penjualan & Omzet</h1>
          <p className="text-gray-600">Data transaksi penjualan Injapan Food</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Pilih Bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Penjualan ({months[selectedMonth]} {selectedYear})
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales} pesanan</div>
              <p className="text-xs text-muted-foreground">
                {totalSales > 0 
                  ? `Rata-rata ${formatCurrency(Math.round(totalRevenue / totalSales))} per pesanan` 
                  : 'Belum ada penjualan'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Omzet ({months[selectedMonth]} {selectedYear})
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Termasuk ongkos kirim dan biaya tambahan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>
                Transaksi {months[selectedMonth]} {selectedYear}
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada data penjualan</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Belum ada transaksi pada bulan {months[selectedMonth]} {selectedYear}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Transaksi</TableHead>
                      <TableHead>Tanggal & Jam</TableHead>
                      <TableHead>Pembeli</TableHead>
                      <TableHead>Daftar Barang</TableHead>
                      <TableHead>Ongkir</TableHead>
                      <TableHead>Total Pembayaran</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {transaction.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {formatDate(transaction.transactionDate)}
                        </TableCell>
                        <TableCell>{transaction.customerName}</TableCell>
                        <TableCell>
                          <div className="max-h-24 overflow-y-auto text-sm">
                            {transaction.items.map((item, idx) => (
                              <div key={idx} className="mb-1">
                                {item.quantity}x {item.name} ({formatCurrency(item.price)})
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(transaction.shippingFee)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(transaction.totalPayment)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === 'completed' ? 'default' :
                              transaction.status === 'confirmed' ? 'secondary' :
                              'outline'
                            }
                          >
                            {transaction.status === 'pending' ? 'Menunggu' :
                             transaction.status === 'confirmed' ? 'Dikonfirmasi' :
                             transaction.status === 'completed' ? 'Selesai' : 
                             transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SalesRevenueReport;