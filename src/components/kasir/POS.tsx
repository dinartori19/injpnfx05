import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Receipt, 
  CheckCircle 
} from 'lucide-react';
import { collection, query, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Product } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useFirebaseAuth';
import ReceiptModal from './ReceiptModal';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const POS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);
  const { user } = useAuth();

  // Fetch products from Firebase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);
        
        if (productsSnapshot.empty) {
          console.log('No products found');
          setLoading(false);
          return;
        }
        
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(productsData.map(product => product.category)));
        
        setProducts(productsData);
        setFilteredProducts(productsData);
        setCategories(uniqueCategories);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Filter products based on search term and category
  useEffect(() => {
    let filtered = products;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // Update quantity if item already in cart
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Add new item to cart
        return [...prevCart, {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1
        }];
      }
    });
    
    toast({
      title: "Produk ditambahkan",
      description: `${product.name} ditambahkan ke keranjang`,
    });
  };

  // Update cart item quantity
  const updateQuantity = (id: string, change: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Process checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Keranjang kosong",
        description: "Tambahkan produk ke keranjang terlebih dahulu",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create transaction in Firebase
      const transaction = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: cartTotal,
        cashier: user?.displayName || user?.email || 'Unknown',
        cashierId: user?.uid,
        status: 'completed',
        paymentMethod: 'Cash',
        created_at: new Date().toISOString()
      };
      
      const transactionsRef = collection(db, 'transactions');
      const docRef = await addDoc(transactionsRef, transaction);
      
      // Create receipt data
      const receiptData = {
        id: docRef.id,
        items: cart,
        totalAmount: cartTotal,
        cashier: user?.displayName || user?.email || 'Unknown',
        timestamp: new Date().toISOString(),
        paymentMethod: 'Cash',
        storeName: 'InJapan Food',
        storeAddress: 'Tokyo, Japan',
        storePhone: '0812-XXXX-XXXX'
      };
      
      // Show receipt modal
      setCurrentReceipt(receiptData);
      setShowReceiptModal(true);
      
      // Clear cart
      setCart([]);
      
      toast({
        title: "Transaksi berhasil",
        description: "Struk telah dibuat dan siap dicetak",
      });
    } catch (error) {
      console.error('Error processing checkout:', error);
      toast({
        title: "Transaksi gagal",
        description: "Terjadi kesalahan saat memproses transaksi",
        variant: "destructive"
      });
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Penjualan</h1>
        <p className="text-gray-600">Proses transaksi penjualan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>Produk</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Categories */}
              <div className="mb-4 overflow-x-auto pb-2">
                <div className="flex space-x-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    Semua
                  </Button>
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="h-96 flex items-center justify-center text-center">
                  <div>
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Tidak ada produk ditemukan</p>
                    <p className="text-sm text-gray-400">Coba ubah kata kunci pencarian</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[calc(100vh-20rem)] overflow-y-auto p-1">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className="bg-white border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addToCart(product)}
                    >
                      <div className="aspect-square rounded-md bg-gray-100 mb-2 overflow-hidden">
                        <img
                          src={product.image_url || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2 h-10">{product.name}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-primary font-bold">{formatCurrency(product.price)}</span>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Keranjang
                </CardTitle>
                <Badge variant="outline">
                  {cart.length} item
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto mb-4">
                {cart.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Keranjang kosong</p>
                      <p className="text-sm text-gray-400">Tambahkan produk ke keranjang</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between border-b pb-3">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(item.price)} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Pajak (0%)</span>
                  <span className="font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mb-6">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(cartTotal)}</span>
                </div>

                {/* Payment Methods */}
                <Tabs defaultValue="cash">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="cash">Tunai</TabsTrigger>
                    <TabsTrigger value="card">Kartu/QRIS</TabsTrigger>
                  </TabsList>
                  <TabsContent value="cash" className="space-y-4">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Proses Pembayaran
                    </Button>
                  </TabsContent>
                  <TabsContent value="card" className="space-y-4">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Proses Pembayaran
                    </Button>
                  </TabsContent>
                </Tabs>

                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => setCart([])}
                  disabled={cart.length === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Kosongkan Keranjang
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && currentReceipt && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          receipt={currentReceipt}
        />
      )}
    </div>
  );
};

export default POS;