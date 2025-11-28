const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReceiptGenerator {
  async generateReceipt(sale, store, customer) {
    return new Promise((resolve, reject) => {
      try {
        // Create receipts directory
        const receiptsDir = path.join(__dirname, '../receipts');
        if (!fs.existsSync(receiptsDir)) {
          fs.mkdirSync(receiptsDir, { recursive: true });
        }

        const fileName = `${sale.invoiceNumber}-receipt.pdf`;
        const filePath = path.join(receiptsDir, fileName);
        
        // 90mm width in points (1mm = 2.83465 points)
        const receiptWidth = 90 * 2.83465; // ~255 points
        const margin = 12;
        const contentWidth = receiptWidth - (margin * 2);
        
        const doc = new PDFDocument({ 
          size: [receiptWidth, 842], // 90mm width, fixed height
          margin: 0,
          autoFirstPage: true
        });
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);

        let yPos = 10;

        // Voyage Logo (centered at top)
        const logoPath = path.resolve(__dirname, '../assets/voyage-logo.png');
        
        if (fs.existsSync(logoPath)) {
          try {
            const maxLogoWidth = receiptWidth - (margin * 2) - 60;
            const logoWidth = maxLogoWidth;
            const logoHeight = logoWidth * 1.414;
            const logoX = (receiptWidth - logoWidth) / 2;
            
            doc.image(logoPath, logoX, yPos, { 
              width: logoWidth,
              height: logoHeight
            });
            
            yPos += logoHeight + 5;
          } catch (error) {
            console.error('❌ Error adding logo to receipt:', error.message);
          }
        }

        // Store Header - Clean and centered
        yPos += 5;
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text(store?.name || 'Voyage Eyewear', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 12;

        // Store Details - Clean, minimal
        doc.fontSize(7).font('Helvetica');
        if (store?.address) {
          if (store.address.street) {
            doc.text(store.address.street, margin, yPos, { width: contentWidth, align: 'center' });
            yPos += 7;
          }
          if (store.address.city && store.address.state) {
            doc.text(`${store.address.city}, ${store.address.state} ${store.address.zipCode || ''}`, margin, yPos, { width: contentWidth, align: 'center' });
            yPos += 7;
          }
        }
        
        const storeEmail = store?.email && !store.email.includes('subhash-nagar') 
          ? store.email 
          : 'voyagekiosk@voyageeyewear.in';
        doc.text(storeEmail, margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 7;
        doc.text('+91 97167 85038', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 7;
        
        const gstNumber = store?.gstNumber || '08AGFPK7804C1ZQ';
        doc.text(`GSTIN: ${gstNumber}`, margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 10;

        // Subtle divider line
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).strokeColor('#cccccc').stroke();
        yPos += 8;

        // Invoice Info - Clean two-column layout
        doc.fontSize(7);
        const saleDate = new Date(sale.saleDate || sale.createdAt);
        const day = String(saleDate.getDate()).padStart(2, '0');
        const month = String(saleDate.getMonth() + 1).padStart(2, '0');
        const year = String(saleDate.getFullYear()).slice(-2);
        let hours = saleDate.getHours();
        const minutes = String(saleDate.getMinutes()).padStart(2, '0');
        const seconds = String(saleDate.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hoursStr = String(hours).padStart(2, '0');
        const formattedDate = `${day}/${month}/${year} ${hoursStr}:${minutes}:${seconds}${ampm}`;
        
        // Invoice info in clean format
        doc.font('Helvetica').text(`Invoice #: ${sale.invoiceNumber}`, margin, yPos);
        yPos += 7;
        doc.text(`Date: ${formattedDate}`, margin, yPos);
        yPos += 7;
        doc.text(`Customer: ${customer?.name || 'N/A'}`, margin, yPos);
        yPos += 7;
        if (customer?.phone) {
          doc.text(`Phone: ${customer.phone}`, margin, yPos);
          yPos += 7;
        }

        yPos += 5;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).strokeColor('#cccccc').stroke();
        yPos += 8;

        // Items Section - Clean list format
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('ITEMS', margin, yPos);
        yPos += 10;

        doc.fontSize(7).font('Helvetica');
        sale.items?.forEach((item) => {
          const unitPrice = parseFloat(item.discountedPrice || item.unitPrice || 0);
          const quantity = parseInt(item.quantity || 1);
          const itemTotal = (unitPrice * quantity).toFixed(2);
          const itemName = item.name || item.productName || 'Item';
          
          // Item name
          doc.font('Helvetica-Bold').text(itemName, margin, yPos);
          yPos += 7;
          
          // Quantity and price on same line
          doc.font('Helvetica');
          const qtyText = `Qty: ${quantity}`;
          const priceText = `Rs.${itemTotal}`;
          doc.text(qtyText, margin, yPos);
          doc.text(priceText, receiptWidth - margin, yPos, { align: 'right' });
          yPos += 8;
        });

        yPos += 3;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).strokeColor('#cccccc').stroke();
        yPos += 8;

        // Totals Section - Clean and professional
        doc.fontSize(7);
        const labelWidth = 120;
        const valueX = receiptWidth - margin - 80;
        
        doc.font('Helvetica').text('Subtotal', margin, yPos);
        doc.font('Helvetica').text(`Rs.${parseFloat(sale.subtotal || 0).toFixed(2)}`, valueX, yPos, { width: 80, align: 'right' });
        yPos += 7;

        if (parseFloat(sale.totalDiscount || 0) > 0) {
          doc.font('Helvetica').fillColor('#28a745').text('Discount', margin, yPos);
          doc.font('Helvetica').fillColor('#28a745').text(`-Rs.${parseFloat(sale.totalDiscount || 0).toFixed(2)}`, valueX, yPos, { width: 80, align: 'right' });
          doc.fillColor('black');
          yPos += 7;
        }

        doc.font('Helvetica').text('Tax', margin, yPos);
        doc.font('Helvetica').text(`Rs.${parseFloat(sale.totalTax || 0).toFixed(2)}`, valueX, yPos, { width: 80, align: 'right' });
        yPos += 8;

        // Total - Emphasized
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).strokeColor('#000000').lineWidth(0.5).stroke();
        yPos += 6;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('TOTAL', margin, yPos);
        doc.text(`Rs.${parseFloat(sale.totalAmount || 0).toFixed(2)}`, valueX, yPos, { width: 80, align: 'right' });
        doc.fontSize(7);
        yPos += 10;

        // Payment Section - Clean format
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).strokeColor('#cccccc').stroke();
        yPos += 8;

        doc.fontSize(7).font('Helvetica-Bold');
        const paymentMode = sale.paymentMode || (sale.paymentMethod ? sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1) : 'Cash');
        doc.text('PAYMENT', margin, yPos);
        yPos += 8;

        doc.fontSize(7).font('Helvetica');
        doc.text(`Mode: ${paymentMode}`, margin, yPos);
        yPos += 7;

        // Parse paymentDetails if it's a string
        let paymentDetails = sale.paymentDetails;
        if (typeof paymentDetails === 'string') {
          try {
            paymentDetails = JSON.parse(paymentDetails);
          } catch (e) {
            paymentDetails = null;
          }
        }

        // Payment breakdown (if split payment)
        if (sale.paymentMode === 'Split' && paymentDetails) {
          if (paymentDetails.cash > 0) {
            doc.text(`  Cash: Rs.${parseFloat(paymentDetails.cash).toFixed(2)}`, margin, yPos);
            yPos += 6;
          }
          if (paymentDetails.card > 0) {
            doc.text(`  Card: Rs.${parseFloat(paymentDetails.card).toFixed(2)}`, margin, yPos);
            yPos += 6;
          }
          if (paymentDetails.upi > 0) {
            doc.text(`  UPI: Rs.${parseFloat(paymentDetails.upi).toFixed(2)}`, margin, yPos);
            yPos += 6;
          }
        }

        yPos += 10;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).strokeColor('#cccccc').stroke();
        yPos += 10;

        // Footer - Professional and clean
        doc.fontSize(7).font('Helvetica');
        doc.text('Thank you for your business!', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 7;
        doc.text('Visit us again soon', margin, yPos, { width: contentWidth, align: 'center' });

        doc.end();

        stream.on('finish', () => {
          resolve(filePath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new ReceiptGenerator();
