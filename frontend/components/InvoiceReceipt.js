import { useRef } from 'react';
import { Printer, X, Download } from 'lucide-react';

export default function InvoiceReceipt({ isOpen, onClose, sale, store, customer }) {
  const receiptRef = useRef(null);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = receiptRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${sale.invoiceNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', sans-serif;
              padding: 0;
              margin: 0;
              background: white;
            }
            .receipt-container {
              width: 100%;
              max-width: 100%;
              margin: 0;
              background: white;
            }
            .receipt-header {
              text-align: center;
              border-bottom: 2px dashed #333;
              padding-bottom: 15px;
              margin-bottom: 15px;
            }
            .store-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .store-details {
              font-size: 12px;
              color: #666;
              line-height: 1.6;
            }
            .receipt-info {
              margin-bottom: 15px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 13px;
            }
            .info-label {
              font-weight: 600;
            }
            .items-section {
              border-top: 1px solid #ddd;
              border-bottom: 1px solid #ddd;
              padding: 10px 0;
              margin: 15px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 13px;
            }
            .item-name {
              flex: 1;
              margin-right: 10px;
            }
            .item-qty {
              margin-right: 10px;
              min-width: 30px;
            }
            .item-price {
              text-align: right;
              min-width: 80px;
            }
            .totals-section {
              margin-top: 15px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .total-label {
              font-weight: 600;
            }
            .grand-total {
              font-size: 18px;
              font-weight: bold;
              border-top: 2px solid #333;
              padding-top: 8px;
              margin-top: 8px;
            }
            .payment-section {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px dashed #333;
            }
            .payment-mode {
              font-weight: 600;
              margin-bottom: 5px;
            }
            .payment-breakdown {
              font-size: 12px;
              margin-left: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px dashed #333;
              font-size: 11px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              .receipt-container {
                width: 100%;
                max-width: 100%;
                margin: 0;
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    // Trigger print dialog which can also save as PDF
    handlePrint();
  };

  // Parse paymentDetails if it's a string
  let paymentDetails = sale.paymentDetails;
  if (typeof paymentDetails === 'string') {
    try {
      paymentDetails = JSON.parse(paymentDetails);
    } catch (e) {
      paymentDetails = null;
    }
  }

  const isSplitPayment = sale.paymentMode === 'Split' && paymentDetails;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h2 className="text-xl font-bold text-gray-800">Invoice Receipt</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Print Receipt"
            >
              <Printer size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="px-0 py-6">
          <div className="receipt-container" style={{ width: '100%', padding: '0 10px' }}>
            {/* Store Header */}
            <div className="receipt-header">
              <div className="store-name">{store?.name || 'Voyage Eyewear'}</div>
              <div className="store-details">
                {store?.address && (
                  <>
                    {store.address.street && <div>{store.address.street}</div>}
                    {store.address.city && store.address.state && (
                      <div>{store.address.city}, {store.address.state} {store.address.zipCode}</div>
                    )}
                  </>
                )}
                {store?.phone && <div>Phone: {store.phone}</div>}
                {store?.email && <div>Email: {store.email}</div>}
              </div>
            </div>

            {/* Receipt Info */}
            <div className="receipt-info">
              <div className="info-row">
                <span className="info-label">Invoice #:</span>
                <span>{sale.invoiceNumber}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Date:</span>
                <span>{new Date(sale.saleDate || sale.createdAt).toLocaleString()}</span>
              </div>
              {customer && (
                <>
                  <div className="info-row">
                    <span className="info-label">Customer:</span>
                    <span>{customer.name}</span>
                  </div>
                  {customer.phone && (
                    <div className="info-row">
                      <span className="info-label">Phone:</span>
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Items */}
            <div className="items-section">
              <div className="info-row" style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                <span>Item</span>
                <span style={{ textAlign: 'right' }}>Amount</span>
              </div>
              {sale.items?.map((item, index) => {
                // Calculate item total - handle both discountedPrice and unitPrice
                const unitPrice = parseFloat(item.discountedPrice || item.unitPrice || 0);
                const quantity = parseInt(item.quantity || 1);
                const itemTotal = (unitPrice * quantity).toFixed(2);
                return (
                  <div key={index} className="item-row">
                    <div className="item-name">
                      {item.name || item.productName || `Item ${index + 1}`}
                      {quantity > 1 && (
                        <span style={{ fontSize: '11px', color: '#666' }}>
                          {' '}× {quantity}
                        </span>
                      )}
                    </div>
                    <div className="item-price">₹{itemTotal}</div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="totals-section">
              <div className="total-row">
                <span className="total-label">Subtotal:</span>
                <span>₹{parseFloat(sale.subtotal || 0).toFixed(2)}</span>
              </div>
              {parseFloat(sale.totalDiscount || 0) > 0 && (
                <div className="total-row" style={{ color: '#059669' }}>
                  <span className="total-label">Discount:</span>
                  <span>-₹{parseFloat(sale.totalDiscount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="total-row">
                <span className="total-label">Tax:</span>
                <span>₹{parseFloat(sale.totalTax || 0).toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total:</span>
                <span>₹{parseFloat(sale.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="payment-section">
              <div className="payment-mode">
                Payment Mode: {sale.paymentMode || (sale.paymentMethod ? sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1) : 'Cash')}
              </div>
              {isSplitPayment && paymentDetails && (
                <div className="payment-breakdown">
                  {paymentDetails.cash > 0 && (
                    <div>Cash: ₹{parseFloat(paymentDetails.cash).toFixed(2)}</div>
                  )}
                  {paymentDetails.card > 0 && (
                    <div>Card: ₹{parseFloat(paymentDetails.card).toFixed(2)}</div>
                  )}
                  {paymentDetails.upi > 0 && (
                    <div>UPI: ₹{parseFloat(paymentDetails.upi).toFixed(2)}</div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="footer">
              <div>Thank you for your business!</div>
              <div style={{ marginTop: '5px' }}>Visit us again soon</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t flex gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Printer size={18} />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

