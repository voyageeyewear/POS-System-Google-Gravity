const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReceiptGenerator {
  // Helper to draw dotted line
  drawDottedLine(doc, x1, y, x2) {
    doc.moveTo(x1, y);
    let currentX = x1;
    const dashLength = 2;
    const gapLength = 2;
    while (currentX < x2) {
      doc.lineTo(Math.min(currentX + dashLength, x2), y);
      currentX += dashLength + gapLength;
      if (currentX < x2) {
        doc.moveTo(currentX, y);
      }
    }
    doc.stroke();
  }

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
        const margin = 10;
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
            
            yPos += logoHeight + 8;
          } catch (error) {
            console.error('❌ Error adding logo to receipt:', error.message);
          }
        }

        // Store Header - Centered
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text(store?.name || 'Voyage Eyewear', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 10;

        // Store Details - Centered, minimal
        doc.fontSize(7).font('Helvetica');
        if (store?.address) {
          if (store.address.street) {
            doc.text(store.address.street, margin, yPos, { width: contentWidth, align: 'center' });
            yPos += 6;
          }
          if (store.address.city && store.address.state) {
            doc.text(`${store.address.city}, ${store.address.state} ${store.address.zipCode || ''}`, margin, yPos, { width: contentWidth, align: 'center' });
            yPos += 6;
          }
        }
        
        const storeEmail = store?.email && !store.email.includes('subhash-nagar') 
          ? store.email 
          : 'voyagekiosk@voyageeyewear.in';
        doc.text(storeEmail, margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 6;
        doc.text('+91 97167 85038', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 6;
        
        const gstNumber = store?.gstNumber || '08AGFPK7804C1ZQ';
        doc.text(`GSTIN: ${gstNumber}`, margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 10;

        // Dotted line separator
        this.drawDottedLine(doc, margin, yPos, receiptWidth - margin);
        yPos += 8;

        // SALES RECEIPT Title with dotted lines above and below
        this.drawDottedLine(doc, margin, yPos, receiptWidth - margin);
        yPos += 6;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('SALES RECEIPT', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 8;
        this.drawDottedLine(doc, margin, yPos, receiptWidth - margin);
        yPos += 8;

        // Invoice and Date Info
        doc.fontSize(7).font('Helvetica');
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
        const formattedDate = `${day}/${month}/${year}`;
        const formattedTime = `${hoursStr}:${minutes}${ampm}`;
        
        doc.text(`Invoice #: ${sale.invoiceNumber}`, margin, yPos);
        yPos += 6;
        doc.text(`Date: ${formattedDate}  Time: ${formattedTime}`, margin, yPos);
        yPos += 6;
        if (customer?.name) {
          doc.text(`Customer: ${customer.name}`, margin, yPos);
          yPos += 6;
        }
        if (customer?.phone) {
          doc.text(`Phone: ${customer.phone}`, margin, yPos);
          yPos += 6;
        }
        yPos += 4;

        // Dotted line separator
        this.drawDottedLine(doc, margin, yPos, receiptWidth - margin);
        yPos += 6;

        // Items Section - Column Headers
        doc.fontSize(7).font('Helvetica-Bold');
        const qtyWidth = 30;
        const itemWidth = contentWidth - qtyWidth - 60;
        const priceWidth = 60;
        
        doc.text('Qty', margin, yPos);
        doc.text('Item Description', margin + qtyWidth + 3, yPos);
        doc.text('Price', receiptWidth - margin - priceWidth, yPos, { width: priceWidth, align: 'right' });
        yPos += 8;

        // Dotted line under headers
        this.drawDottedLine(doc, margin, yPos, receiptWidth - margin);
        yPos += 6;

        // Items List
        doc.fontSize(7).font('Helvetica');
        let totalItems = 0;
        sale.items?.forEach((item) => {
          const unitPrice = parseFloat(item.discountedPrice || item.unitPrice || 0);
          const quantity = parseInt(item.quantity || 1);
          const itemTotal = (unitPrice * quantity).toFixed(2);
          const itemName = item.name || item.productName || 'Item';
          totalItems += quantity;
          
          // Quantity
          doc.text(`${quantity}x`, margin, yPos);
          
          // Item name (handle wrapping)
          const itemNameLines = doc.heightOfString(itemName, { width: itemWidth });
          doc.text(itemName, margin + qtyWidth + 3, yPos, { width: itemWidth });
          
          // Price (right aligned)
          doc.text(`Rs.${itemTotal}`, receiptWidth - margin - priceWidth, yPos, { width: priceWidth, align: 'right' });
          
          yPos += Math.max(itemNameLines * 6, 8);
        });

        yPos += 4;
        // Item count
        doc.font('Helvetica-Bold');
        doc.text(`${totalItems}x Items Sold`, margin, yPos);
        yPos += 8;

        // Dotted line separator
        this.drawDottedLine(doc, margin, yPos, receiptWidth - margin);
        yPos += 6;

        // Totals Section
        doc.fontSize(7).font('Helvetica');
        const labelWidth = contentWidth - 70;
        const valueX = receiptWidth - margin - 70;
        
        // Sub Total
        doc.text('Sub Total', margin, yPos);
        doc.text(`Rs.${parseFloat(sale.subtotal || 0).toFixed(2)}`, valueX, yPos, { width: 70, align: 'right' });
        yPos += 7;

        // Discount (if applicable)
        if (parseFloat(sale.totalDiscount || 0) > 0) {
          doc.text('Discount', margin, yPos);
          doc.text(`-Rs.${parseFloat(sale.totalDiscount || 0).toFixed(2)}`, valueX, yPos, { width: 70, align: 'right' });
          yPos += 7;
        }

        // Tax
        doc.text('Tax', margin, yPos);
        doc.text(`Rs.${parseFloat(sale.totalTax || 0).toFixed(2)}`, valueX, yPos, { width: 70, align: 'right' });
        yPos += 7;

        // Dotted line before total
        this.drawDottedLine(doc, margin, yPos, receiptWidth - margin);
        yPos += 6;

        // Total - Bold
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Total', margin, yPos);
        doc.text(`Rs.${parseFloat(sale.totalAmount || 0).toFixed(2)}`, valueX, yPos, { width: 70, align: 'right' });
        doc.fontSize(7);
        yPos += 10;

        // Dotted line separator
        this.drawDottedLine(doc, margin, yPos, receiptWidth - margin);
        yPos += 6;

        // Payment Section
        doc.fontSize(7).font('Helvetica');
        
        // Parse paymentDetails if it's a string
        let paymentDetails = sale.paymentDetails;
        if (typeof paymentDetails === 'string') {
          try {
            paymentDetails = JSON.parse(paymentDetails);
          } catch (e) {
            paymentDetails = null;
          }
        }

        const paymentMode = sale.paymentMode || (sale.paymentMethod ? sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1) : 'Cash');
        
        if (sale.paymentMode === 'Split' && paymentDetails) {
          // Split payment breakdown
          if (paymentDetails.cash > 0) {
            doc.text('Cash', margin, yPos);
            doc.text(`Rs.${parseFloat(paymentDetails.cash).toFixed(2)}`, valueX, yPos, { width: 70, align: 'right' });
            yPos += 7;
          }
          if (paymentDetails.card > 0) {
            doc.text('Card', margin, yPos);
            doc.text(`Rs.${parseFloat(paymentDetails.card).toFixed(2)}`, valueX, yPos, { width: 70, align: 'right' });
            yPos += 7;
          }
          if (paymentDetails.upi > 0) {
            doc.text('UPI', margin, yPos);
            doc.text(`Rs.${parseFloat(paymentDetails.upi).toFixed(2)}`, valueX, yPos, { width: 70, align: 'right' });
            yPos += 7;
          }
          
          // Tendered Total (sum of all payments)
          const tenderedTotal = parseFloat(paymentDetails.cash || 0) + 
                               parseFloat(paymentDetails.card || 0) + 
                               parseFloat(paymentDetails.upi || 0);
          doc.font('Helvetica-Bold');
          doc.text('Tendered Total', margin, yPos);
          doc.text(`Rs.${tenderedTotal.toFixed(2)}`, valueX, yPos, { width: 70, align: 'right' });
          doc.font('Helvetica');
          yPos += 7;
        } else {
          // Single payment mode
          doc.text(paymentMode, margin, yPos);
          doc.text(`Rs.${parseFloat(sale.totalAmount || 0).toFixed(2)}`, valueX, yPos, { width: 70, align: 'right' });
          yPos += 7;
        }

        yPos += 8;

        // Dotted line separator
        this.drawDottedLine(doc, margin, yPos, receiptWidth - margin);
        yPos += 8;

        // Footer - THANK YOU
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('THANK YOU', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 10;

        // Transaction metadata at bottom
        doc.fontSize(6).font('Helvetica');
        const transactionId = sale.invoiceNumber;
        doc.text(`${transactionId}  ${formattedDate}  ${formattedTime}`, margin, yPos);

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
