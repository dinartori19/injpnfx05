import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  ClipboardList, 
  Users, 
  Receipt, 
  FileText, 
  Settings,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface KasirLayoutProps {
  children: React.ReactNode;
}

const KasirLayout = ({ children }: KasirLayoutProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdminStatus = () => {
      if (user) {
        const adminEmails = ['admin@gmail.com', 'ari4rich@gmail.com'];
        setIsAdmin(adminEmails.includes(user.email || ''));
      }
    };

    if (!authLoading) {
      checkAdminStatus();
      setLoading(false);
    }
  }, [user, authLoading]);

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/kasir',
      icon: LayoutDashboard,
    },
    {
      title: 'Penjualan',
      href: '/kasir/penjualan',
      icon: ShoppingCart,
    },
    {
      title: 'Produk',
      href: '/kasir/produk',
      icon: Package,
    },
    {
      title: 'Stok/Inventori',
      href: '/kasir/inventori',
      icon: ClipboardList,
    },
    {
      title: 'Pelanggan',
      href: '/kasir/pelanggan',
      icon: Users,
    },
    {
      title: 'Transaksi',
      href: '/kasir/transaksi',
      icon: Receipt,
    },
    {
      title: 'Struk',
      href: '/kasir/struk',
      icon: FileText,
    },
    {
      title: 'Pengaturan',
      href: '/kasir/pengaturan',
      icon: Settings,
    }
  ];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mt-2">
            {authLoading ? 'Memeriksa autentikasi...' : 'Memverifikasi akses admin...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Akses Terbatas</h2>
          <p className="text-gray-600 mb-4">
            Anda harus login untuk mengakses halaman ini.
          </p>
          <Link to="/auth">
            <Button className="bg-red-600 hover:bg-red-700">
              Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Akses Ditolak</h2>
          <p className="text-gray-600 mb-4">
            Anda tidak memiliki izin untuk mengakses panel kasir.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            User: {user.email}
          </p>
          <Link to="/">
            <Button className="bg-red-600 hover:bg-red-700">
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-64 flex-col bg-white shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">InJapan Kasir</h1>
          <p className="text-sm text-gray-600">Point of Sale System</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-red-50 text-red-700 border-r-2 border-red-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-red-100 text-red-800">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.displayName || user?.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-500">Kasir</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button and Header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden mr-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">InJapan Kasir</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-500" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-600 text-[10px]">
                3
              </Badge>
            </div>
            
            <div className="md:hidden">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="bg-red-100 text-red-800 text-xs">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-64 h-full bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b">
                <h1 className="text-xl font-bold text-gray-900">InJapan Kasir</h1>
                <p className="text-sm text-gray-600">Point of Sale System</p>
              </div>
              
              <nav className="p-4">
                <ul className="space-y-1">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive
                              ? "bg-red-50 text-red-700 border-r-2 border-red-700"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              
              <div className="p-4 border-t mt-auto">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-red-100 text-red-800">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user?.displayName || user?.email?.split('@')[0]}</p>
                    <p className="text-xs text-gray-500">Kasir</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default KasirLayout;