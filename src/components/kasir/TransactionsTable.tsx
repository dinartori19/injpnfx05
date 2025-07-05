import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  FileText, 
  Calendar, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { collection, query, getDocs, orderBy, limit, startAfter, endBefore, limitToLast, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import ReceiptModal from './ReceiptModal';

interface Transaction {
  id: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  cashier: string;
  cashierId: string;
  status: string;
  paymentMethod: string;
  created_at: string;
}

const TransactionsTable = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [firstVisible, setFirstVisible] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const pageSize = 10;

  // Fetch transactions from Firebase
  const fetchTransactions = async (direction: 'next' | 'prev' = 'next') => {
    setLoading(true);
    try {
      const transactionsRef = collection(db, 'transactions');
      let q;
      
      // Base query with date filters if provided
      let baseQuery: any[] = [orderBy('created_at', 'desc')];
      
      if (startDate && endDate) {
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        
        baseQuery = [
          where('created_at', '>=', startDateTime.toISOString()),
          where('created_at', '<=', endDateTime.toISOString()),
          orderBy('created_at', 'desc')
        ];
      }
      
      // Pagination
      if (direction === 'next' && lastVisible) {
        q = query(
          transactionsRef,
          ...baseQuery,
          startAfter(lastVisible),
          limit(pageSize)
        );
      } else if (direction === 'prev' && firstVisible) {
        q = query(
          transactionsRef,
          ...baseQuery,
          endBefore(firstVisible),
          limitToLast(pageSize)
        );
      } else {
        q = query(
          transactionsRef,
          ...baseQuery,
          limit(pageSize)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setTransactions([]);
        setLoading(false);
        setHasMore(false);
        return;
      }
      
      // Check if there are more pages
      const checkMoreRef = query(
        transactionsRef,
        ...baseQuery,
        startAfter(querySnapshot.docs[querySnapshot.docs.length - 1]),
        limit(1)
      );
      const checkMoreSnapshot = await getDocs(checkMoreRef);
      setHasMore(!checkMoreSnapshot.empty);
      
      // Update pagination cursors
      setFirstVisible(querySnapshot.docs[0]);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      
      // Update page number
      if (direction === 'next') {
        setCurrentPage(prev => prev + 1);
      } else if (direction === 'prev') {
        setCurrentPage(prev => Math.max(1, prev - 1));
      } else {
        setCurrentPage(1);
      }
      
      // Map transactions
      const transactionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));
      
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate]);

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction => 
    transaction.cashier.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // View receipt
  const viewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  // Prepare receipt data
  const prepareReceiptData = () => {
    if (!selectedTransaction) return null;
    
    return {
      id: selectedTransaction.id,
      items: selectedTransaction.items,
      totalAmount: selectedTransaction.totalAmount,
      cashier: selectedTransaction.cashier,
      timestamp: selectedTransaction.created_at,
      paymentMethod: selectedTransaction.paymentMethod,
      storeName: 'InJapan Food',
      storeAddress: 'Tokyo, Japan',
      storePhone: '0812-XXXX-XXXX'
    };
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
        <p className="text-gray-600">Daftar semua transaksi penjualan</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Transaksi</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full sm:w-auto"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="h-96 flex items-center justify-center text-center">
              <div>
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Tidak ada transaksi ditemukan</p>
                <p className="text-sm text-gray-400">Coba ubah filter pencarian</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Transaksi</TableHead>
                      <TableHead>Tanggal & Jam</TableHead>
                      <TableHead>Kasir</TableHead>
                      <TableHead>Metode Pembayaran</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          #{transaction.id.slice(-6).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {formatDate(transaction.created_at)}
                        </TableCell>
                        <TableCell>{transaction.cashier}</TableCell>
                        <TableCell>{transaction.paymentMethod}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(transaction.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === 'completed' ? 'default' :
                              transaction.status === 'pending' ? 'outline' :
                              'secondary'
                            }
                          >
                            {transaction.status === 'completed' ? 'Selesai' :
                             transaction.status === 'pending' ? 'Menunggu' :
                             transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewReceipt(transaction)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Struk
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTransactions('prev')}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Sebelumnya
                </Button>
                <span className="text-sm text-gray-500">
                  Halaman {currentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTransactions('next')}
                  disabled={!hasMore}
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          receipt={prepareReceiptData()!}
        />
      )}
    </div>
  );
};

export default TransactionsTable;