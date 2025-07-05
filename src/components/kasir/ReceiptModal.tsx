import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, X } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: {
    id: string;
    items: ReceiptItem[];
    totalAmount: number;
    cashier: string;
    timestamp: string;
    paymentMethod: string;
    storeName: string;
    storeAddress: string;
    storePhone: string;
  };
}

const ReceiptModal = ({ isOpen, onClose, receipt }: ReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);

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
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  };

  // Generate receipt number
  const receiptNumber = `#${receipt.id.slice(-6).toUpperCase()}`;

  // Handle print
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${receiptNumber}`,
  });

  // Handle download as PDF
  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // Receipt width: 80mm (standard receipt width)
      });
      
      // Calculate dimensions to fit the receipt in the PDF
      const imgWidth = 76; // Slightly less than PDF width to add margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 2, 2, imgWidth, imgHeight);
      pdf.save(`Receipt-${receiptNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const { date, time } = formatDate(receipt.timestamp);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Struk Pembayaran</DialogTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {/* Receipt Content */}
        <div className="bg-white p-4 rounded-lg border" ref={receiptRef}>
          <div className="font-mono text-sm" style={{ width: '300px', margin: '0 auto' }}>
            {/* Receipt Header */}
            <div className="text-center mb-4">
              <h2 className="font-bold text-base">{receipt.storeName} - RECEIPT</h2>
              <p className="text-xs">{receipt.storeAddress}</p>
              <p className="text-xs">Telp: {receipt.storePhone}</p>
              <div className="flex justify-between text-xs mt-2">
                <span>Tanggal: {date}</span>
                <span>Waktu: {time}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Kasir: {receipt.cashier}</span>
                <span>No: {receiptNumber}</span>
              </div>
            </div>
            
            {/* Divider */}
            <div className="border-t border-dashed my-2"></div>
            
            {/* Items Header */}
            <div className="flex text-xs font-bold">
              <div className="w-1/2">Nama Barang</div>
              <div className="w-1/6 text-center">Qty</div>
              <div className="w-1/6 text-right">Harga</div>
              <div className="w-1/6 text-right">Total</div>
            </div>
            
            {/* Divider */}
            <div className="border-t border-dashed my-2"></div>
            
            {/* Items */}
            {receipt.items.map((item, index) => (
              <div key={index} className="flex text-xs mb-1">
                <div className="w-1/2 truncate">{item.name}</div>
                <div className="w-1/6 text-center">{item.quantity}</div>
                <div className="w-1/6 text-right">{formatCurrency(item.price)}</div>
                <div className="w-1/6 text-right">{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))}
            
            {/* Divider */}
            <div className="border-t border-dashed my-2"></div>
            
            {/* Totals */}
            <div className="flex justify-between text-xs">
              <span>Subtotal:</span>
              <span>{formatCurrency(receipt.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Pajak (0%):</span>
              <span>{formatCurrency(0)}</span>
            </div>
            
            {/* Divider */}
            <div className="border-t border-dashed my-2"></div>
            
            {/* Final Total */}
            <div className="flex justify-between font-bold">
              <span>TOTAL:</span>
              <span>{formatCurrency(receipt.totalAmount)}</span>
            </div>
            
            {/* Payment Method */}
            <div className="flex justify-between text-xs mt-2">
              <span>Metode Pembayaran:</span>
              <span>{receipt.paymentMethod}</span>
            </div>
            
            {/* Divider */}
            <div className="border-t border-dashed my-2"></div>
            
            {/* Footer */}
            <div className="text-center text-xs mt-4">
              <p className="font-bold">TERIMA KASIH</p>
              <p>{receipt.storeName}</p>
            </div>
            
            {/* Divider */}
            <div className="border-t border-dashed my-2"></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptModal;