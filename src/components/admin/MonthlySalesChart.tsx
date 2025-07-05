import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Order } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarIcon, TrendingUp } from 'lucide-react';

interface MonthlyData {
  name: string;
  revenue: number;
}

const MonthlySalesChart = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    const fetchMonthlyData = async () => {
      setLoading(true);
      
      try {
        // Initialize empty data for all months
        const initialData = months.map((month, index) => ({
          name: month,
          revenue: 0,
          monthIndex: index
        }));
        
        // Create date range for the selected year
        const startDate = new Date(selectedYear, 0, 1).toISOString();
        const endDate = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();
        
        console.log(`Fetching orders from ${startDate} to ${endDate}`);
        
        // Query orders collection for the selected year
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef,
          where('created_at', '>=', startDate),
          where('created_at', '<=', endDate)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          console.log('No orders found for the selected year');
          setChartData(initialData);
          setLoading(false);
          return;
        }
        
        console.log(`Found ${querySnapshot.size} orders for ${selectedYear}`);
        
        // Process orders and aggregate by month
        querySnapshot.forEach(doc => {
          const order = doc.data() as Order;
          const orderDate = new Date(order.created_at);
          const monthIndex = orderDate.getMonth();
          
          // Add order total to the corresponding month
          initialData[monthIndex].revenue += order.total_price || 0;
        });
        
        // Sort by month index to ensure correct order
        initialData.sort((a, b) => a.monthIndex - b.monthIndex);
        
        // Remove the monthIndex property before setting chart data
        setChartData(initialData.map(({ name, revenue }) => ({ name, revenue })));
      } catch (error) {
        console.error('Error fetching monthly data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMonthlyData();
  }, [selectedYear]);

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          <div className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
            Grafik Penjualan Bulanan {selectedYear}
          </div>
        </CardTitle>
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger className="w-[100px]">
            <CalendarIcon className="mr-2 h-4 w-4" />
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
                data={chartData}
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
                  name="Omzet" 
                  fill="#b91c1c" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlySalesChart;