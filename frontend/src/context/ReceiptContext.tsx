import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Receipt {
  id: string;
  transactionId: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  payments: Array<{
    type: string;
    amount: number;
  }>;
  change: number;
  timestamp: Date;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  cashierName?: string;
  notes?: string;
}

interface ReceiptContextType {
  receipts: Receipt[];
  createReceipt: (receipt: Omit<Receipt, 'id'>) => Receipt;
  getReceiptById: (id: string) => Receipt | undefined;
  generateReceiptHTML: (receipt: Receipt) => string;
  printReceipt: (receipt: Receipt) => void;
  downloadReceiptPDF: (receipt: Receipt) => void;
  getReceiptsByDateRange: (startDate: Date, endDate: Date) => Receipt[];
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export const ReceiptProvider = ({ children }: { children: ReactNode }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const createReceipt = useCallback((receipt: Omit<Receipt, 'id'>): Receipt => {
    const newReceipt: Receipt = {
      ...receipt,
      id: `RCP-${Date.now()}`,
    };

    setReceipts(prev => [newReceipt, ...prev]);
    return newReceipt;
  }, []);

  const getReceiptById = useCallback((id: string) => {
    return receipts.find(r => r.id === id);
  }, [receipts]);

  const generateReceiptHTML = useCallback((receipt: Receipt): string => {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const itemsHTML = receipt.items
      .map(
        item => `
        <tr>
          <td>${item.name}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">XAF${item.unitPrice.toFixed(2)}</td>
          <td style="text-align: right;">XAF${(item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100)).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; width: 80mm; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 10px; }
          .store-info { text-align: center; font-size: 10px; margin-bottom: 15px; }
          table { width: 100%; margin-bottom: 10px; border-collapse: collapse; }
          th, td { padding: 4px 2px; text-align: left; border-bottom: 1px solid #999; }
          th { font-weight: bold; border-bottom: 2px solid #000; }
          .total-row { font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; }
          .footer { text-align: center; font-size: 10px; margin-top: 15px; }
          .payment-section { margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 0;">${receipt.storeName}</h2>
        </div>
        
        <div class="store-info">
          ${receipt.storeAddress ? `<p style="margin: 2px 0;">${receipt.storeAddress}</p>` : ''}
          ${receipt.storePhone ? `<p style="margin: 2px 0;">Tél: ${receipt.storePhone}</p>` : ''}
        </div>

        <div style="text-align: center; font-size: 10px; margin-bottom: 10px;">
          Reçu #${receipt.id}<br>
          ${formatDate(receipt.timestamp)}<br>
          ${receipt.cashierName ? `Vendeur: ${receipt.cashierName}` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th style="text-align: center;">Qté</th>
              <th style="text-align: right;">Prix</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
            <tr class="total-row">
              <td colspan="3">Sous-total</td>
              <td style="text-align: right;">XAF${receipt.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3">TVA (20%)</td>
              <td style="text-align: right;">XAF${receipt.tax.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3">Total</td>
              <td style="text-align: right;">XAF${receipt.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="payment-section">
          <strong>Paiement:</strong><br>
          ${receipt.payments
            .map(p => `${p.type.charAt(0).toUpperCase() + p.type.slice(1)}: XAF${p.amount.toFixed(2)}<br>`)
            .join('')}
          ${receipt.change > 0 ? `<strong style="color: green;">Monnaie: XAF${receipt.change.toFixed(2)}</strong>` : ''}
        </div>

        ${receipt.notes ? `<div style="margin-top: 10px; font-size: 10px; border-top: 1px solid #999; padding-top: 10px;">Notes: ${receipt.notes}</div>` : ''}

        <div class="footer">
          <p style="margin: 10px 0;">Merci de votre achat!</p>
          <p style="margin: 2px 0;">www.rtwater.com</p>
        </div>
      </body>
      </html>
    `;
  }, []);

  const printReceipt = useCallback((receipt: Receipt) => {
    const html = generateReceiptHTML(receipt);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  }, [generateReceiptHTML]);

  const downloadReceiptPDF = useCallback((receipt: Receipt) => {
    // TODO: Intégrer une librairie PDF comme jsPDF
    const html = generateReceiptHTML(receipt);
    const element = document.createElement('div');
    element.innerHTML = html;
    console.log('PDF download for receipt:', receipt.id);
    console.log('In production, use a library like jsPDF or PDFKit');
  }, [generateReceiptHTML]);

  const getReceiptsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return receipts.filter(r => {
      const rDate = new Date(r.timestamp);
      return rDate >= startDate && rDate <= endDate;
    });
  }, [receipts]);

  return (
    <ReceiptContext.Provider
      value={{
        receipts,
        createReceipt,
        getReceiptById,
        generateReceiptHTML,
        printReceipt,
        downloadReceiptPDF,
        getReceiptsByDateRange,
      }}
    >
      {children}
    </ReceiptContext.Provider>
  );
};

export const useReceipt = () => {
  const context = useContext(ReceiptContext);
  if (context === undefined) {
    throw new Error('useReceipt must be used within ReceiptProvider');
  }
  return context;
};
