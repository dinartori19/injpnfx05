import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  Calendar 
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Order } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
}

const KasirDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    averageOrderValue: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailySalesData, setDailySalesData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get current date range (today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayStart = today.toISOString();
        const todayEnd = tomorrow.toISOString();
        
        // Get current month range
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();
        
        // Fetch today's orders
        const todayOrdersRef = collection(db, 'orders');
        const todayOrdersQuery = query(
          todayOrdersRef,
          where('created_at', '>=', todayStart),
          where('created_at', '<', todayEnd)
        );
        const todayOrdersSnapshot = await getDocs(todayOrdersQuery);
        
        // Fetch month's orders
        const monthOrdersRef = collection(db, 'orders');
        const monthOrdersQuery = query(
          monthOrdersRef,
          where('created_at', '>=', monthStart),
          where('created_at', '<=', monthEnd)
        );
        const monthOrdersSnapshot = await getDocs(monthOrdersQuery);
        
        // Fetch products
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);
        
        // Fetch recent transactions
        const recentOrdersRef = collection(db, 'orders');
        const recentOrdersQuery = query(
          recentOrdersRef,
          orderBy('created_at', 'desc'),
          limit(5)
        );
        const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
        
        // Calculate stats
        const todaySales = todayOrdersSnapshot.size;
        const todayRevenue = todayOrdersSnapshot.docs.reduce(
          (sum, doc) => sum + ((doc.data() as Order).total_price || 0), 0
        );
        
        const monthSales = monthOrdersSnapshot.size;
        const monthRevenue = monthOrdersSnapshot.docs.reduce(
          (sum, doc) => sum + ((doc.data() as Order).total_price || 0), 0
        );
        
        // Get unique customers
        const customerSet = new Set();
        monthOrdersSnapshot.docs.forEach(doc => {
          const order = doc.data() as Order;
          if (order.user_id) {
            customerSet.add(order.user_id);
          } else if (order.customer_info?.email) {
            customerSet.add(order.customer_info.email);
          }
        });
        
        // Calculate average order value
        const averageOrderValue = monthSales > 0 ? Math.round(monthRevenue / monthSales) : 0;
        
        // Set stats
        setStats({
          totalSales: todaySales,
          totalRevenue: todayRevenue,
          totalCustomers: customerSet.size,
          totalProducts: productsSnapshot.size,
          averageOrderValue: averageOrderValue
        });
        
        // Process recent transactions
        const recentTransactions = recentOrdersSnapshot.docs.map(doc => {
          const order = doc.data() as Order;
          return {
            id: doc.id,
            customerName: order.customer_info?.name || 'Unknown',
            totalAmount: order.total_price || 0,
            date: order.created_at,
            status: order.status || 'pending'
          };
        });
        setRecentTransactions(recentTransactions);
        
        // Generate daily sales data for the last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date;
        }).reverse();
        
        const dailySalesPromises = last7Days.map(async (date) => {
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);
          
          const dayOrdersRef = collection(db, 'orders');
          const dayOrdersQuery = query(
            dayOrdersRef,
            where('created_at', '>=', dayStart.toISOString()),
            where('created_at', '<=', dayEnd.toISOString())
          );
          const dayOrdersSnapshot = await getDocs(dayOrdersQuery);
          
          const dayRevenue = dayOrdersSnapshot.docs.reduce(
            (sum, doc) => sum + ((doc.data() as Order).total_price || 0), 0
          );
          
          return {
            name: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
            revenue: dayRevenue
          };
        });
        
        const dailySalesData = await Promise.all(dailySalesPromises);
        setDailySalesData(dailySalesData);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

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
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Kasir</h1>
        <p className="text-gray-600">Ringkasan penjualan dan transaksi</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Penjualan Hari Ini
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales} transaksi</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSales > 0 
                ? `+${stats.totalSales} dari kemarin` 
                : 'Belum ada penjualan hari ini'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendapatan Hari Ini
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Rata-rata {formatCurrency(stats.averageOrderValue)} per transaksi
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pelanggan
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Bulan ini
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Produk
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produk aktif dalam sistem
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <TrendingUp className="mr-2 h-4 w-4" />
              Penjualan 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dailySalesData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis 
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('ja-JP', {
                          style: 'currency',
                          currency: 'JPY',
                          notation: 'compact',
                          compactDisplay: 'short',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(value)
                      }
                    />
                    <Tooltip 
                      formatter={(value) => 
                        new Intl.NumberFormat('ja-JP', {
                          style: 'currency',
                          currency: 'JPY',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(value as number)
                      }
                    />
                    <Bar 
                      dataKey="revenue" 
                      name="Pendapatan" 
                      fill="#b91c1c" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Transaksi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-center">
                <div>
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Belum ada transaksi</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">{transaction.customerName}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(transaction.totalAmount)}</p>
                      <Badge variant={
                        transaction.status === 'completed' ? 'default' :
                        transaction.status === 'confirmed' ? 'secondary' :
                        'outline'
                      }>
                        {transaction.status === 'pending' ? 'Menunggu' :
                         transaction.status === 'confirmed' ? 'Dikonfirmasi' :
                         transaction.status === 'completed' ? 'Selesai' : 
                         transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KasirDashboard;