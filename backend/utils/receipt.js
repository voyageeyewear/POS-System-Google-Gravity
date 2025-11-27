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
        const margin = 10;
        const contentWidth = receiptWidth - (margin * 2);
        
        const doc = new PDFDocument({ 
          size: [receiptWidth, 842], // 90mm width, auto height
          margin: margin
        });
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);

        let yPos = margin;

        // Voyage Logo (centered at top)
        const logoPath = path.resolve(__dirname, '../assets/voyage-logo.png');
        
        if (fs.existsSync(logoPath)) {
          try {
            const logoWidth = 70; // Increased size for better visibility on 90mm receipt
            const logoX = (receiptWidth - logoWidth) / 2; // Center horizontally
            
            // Add logo - PDFKit handles images synchronously
            doc.image(logoPath, logoX, yPos, { 
              width: logoWidth,
              height: logoWidth // Make it square to ensure it displays
            });
            
            // Move yPos down by logo height plus spacing
            yPos += logoWidth + 12;
          } catch (error) {
            console.error('❌ Error adding logo to receipt:', error.message);
            console.error('Logo path attempted:', logoPath);
            // Continue without logo if there's an error
          }
        } else {
          console.warn('⚠️ Logo file not found:', logoPath);
        }

        // Store Header
        doc.fontSize(18).font('Helvetica-Bold');
        doc.text(store?.name || 'Voyage Eyewear', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 25;

        doc.fontSize(8).font('Helvetica');
        if (store?.address) {
          if (store.address.street) {
            doc.text(store.address.street, margin, yPos, { width: contentWidth, align: 'center' });
            yPos += 10;
          }
          if (store.address.city && store.address.state) {
            doc.text(`${store.address.city}, ${store.address.state} ${store.address.zipCode || ''}`, margin, yPos, { width: contentWidth, align: 'center' });
            yPos += 10;
          }
        }
        if (store?.phone) {
          doc.text(`Phone: ${store.phone}`, margin, yPos, { width: contentWidth, align: 'center' });
          yPos += 10;
        }
        if (store?.email) {
          doc.text(`Email: ${store.email}`, margin, yPos, { width: contentWidth, align: 'center' });
          yPos += 10;
        }
        // GST Number (use store GST or default)
        const gstNumber = store?.gstNumber || '08AGFPK7804C1ZQ'; // Default GST from invoice
        doc.text(`GSTIN: ${gstNumber}`, margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 10;

        yPos += 5;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 10;

        // Invoice Info - Aggressive single-line approach
        doc.fontSize(7); // Very small font
        const infoLabels = ['Invoice #:', 'Date:', 'Customer:', 'Phone:'];
        
        // Format date - ultra compact format
        const saleDate = new Date(sale.saleDate || sale.createdAt);
        const day = String(saleDate.getDate()).padStart(2, '0');
        const month = String(saleDate.getMonth() + 1).padStart(2, '0');
        const year = String(saleDate.getFullYear()).slice(-2); // Use 2-digit year
        let hours = saleDate.getHours();
        const minutes = String(saleDate.getMinutes()).padStart(2, '0');
        const seconds = String(saleDate.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hoursStr = String(hours).padStart(2, '0');
        // Ultra compact: DD/MM/YY HH:MM:SSAM (no space before AM/PM, 2-digit year)
        const formattedDate = `${day}/${month}/${year} ${hoursStr}:${minutes}:${seconds}${ampm}`;
        
        const infoValues = [
          sale.invoiceNumber,
          formattedDate,
          customer?.name || 'N/A',
          customer?.phone || 'N/A'
        ];

        // Aggressive approach: Calculate exact positions to fit on one line
        const labelWidth = 60; // Fixed width for labels
        const valueStartX = margin + labelWidth + 5; // Start values right after labels with minimal gap
        const valueWidth = receiptWidth - valueStartX - margin; // Use remaining space

        infoLabels.forEach((label, i) => {
          doc.font('Helvetica-Bold').fontSize(7);
          doc.text(label, margin, yPos, { width: labelWidth });
          doc.font('Helvetica').fontSize(7);
          // Use left alignment starting right after label to ensure single line
          doc.text(infoValues[i], valueStartX, yPos, { width: valueWidth });
          yPos += 10; // Reduced spacing
        });

        yPos += 5;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 10;

        // Items
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Item', margin, yPos);
        doc.text('Amount', receiptWidth - margin - 60, yPos, { width: 60, align: 'right' });
        yPos += 12;

        doc.font('Helvetica').fontSize(8);
        sale.items?.forEach((item) => {
          const unitPrice = parseFloat(item.discountedPrice || item.unitPrice || 0);
          const quantity = parseInt(item.quantity || 1);
          const itemTotal = (unitPrice * quantity).toFixed(2);
          const itemName = item.name || item.productName || 'Item';
          
          // Handle long item names
          const lines = doc.heightOfString(itemName, { width: contentWidth - 70 });
          doc.text(itemName, margin, yPos, { width: contentWidth - 70 });
          doc.text(`Rs.${itemTotal}`, receiptWidth - margin - 60, yPos, { width: 60, align: 'right' });
          yPos += Math.max(lines, 12);
        });

        yPos += 5;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 10;

        // Totals - use same aggressive single-line approach
        doc.fontSize(8);
        const totalsLabelWidth = 50;
        const totalsValueX = margin + totalsLabelWidth + 3;
        const totalsValueWidth = receiptWidth - totalsValueX - margin;
        
        doc.font('Helvetica-Bold').text('Subtotal:', margin, yPos, { width: totalsLabelWidth });
        doc.font('Helvetica').text(`Rs.${parseFloat(sale.subtotal || 0).toFixed(2)}`, totalsValueX, yPos, { width: totalsValueWidth });
        yPos += 11;

        if (parseFloat(sale.totalDiscount || 0) > 0) {
          doc.font('Helvetica-Bold').text('Discount:', margin, yPos, { width: totalsLabelWidth });
          doc.font('Helvetica').fillColor('green').text(`-Rs.${parseFloat(sale.totalDiscount || 0).toFixed(2)}`, totalsValueX, yPos, { width: totalsValueWidth });
          doc.fillColor('black');
          yPos += 11;
        }

        doc.font('Helvetica-Bold').text('Tax:', margin, yPos, { width: totalsLabelWidth });
        doc.font('Helvetica').text(`Rs.${parseFloat(sale.totalTax || 0).toFixed(2)}`, totalsValueX, yPos, { width: totalsValueWidth });
        yPos += 12;

        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 5;

        doc.fontSize(12).font('Helvetica-Bold');
        const totalLabel = 'Total:';
        const totalAmount = `Rs.${parseFloat(sale.totalAmount || 0).toFixed(2)}`;
        // Calculate positions to ensure single line - use more aggressive spacing
        const totalLabelWidth = 40;
        const totalValueX = margin + totalLabelWidth + 3; // Very close to label
        const totalValueWidth = receiptWidth - totalValueX - margin;
        doc.text(totalLabel, margin, yPos, { width: totalLabelWidth });
        doc.fontSize(11).text(totalAmount, totalValueX, yPos, { width: totalValueWidth }); // Slightly smaller font for amount
        yPos += 15;

        // Payment Mode
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).dash(5, { space: 2 }).stroke().undash();
        yPos += 10;

        doc.fontSize(9).font('Helvetica-Bold');
        let paymentText = `Payment Mode: ${sale.paymentMode || (sale.paymentMethod ? sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1) : 'Cash')}`;
        doc.text(paymentText, margin, yPos);

        // Parse paymentDetails if it's a string
        let paymentDetails = sale.paymentDetails;
        if (typeof paymentDetails === 'string') {
          try {
            paymentDetails = JSON.parse(paymentDetails);
          } catch (e) {
            paymentDetails = null;
          }
        }

        if (sale.paymentMode === 'Split' && paymentDetails) {
          yPos += 12;
          doc.font('Helvetica').fontSize(8);
          if (paymentDetails.cash > 0) {
            doc.text(`Cash: Rs.${parseFloat(paymentDetails.cash).toFixed(2)}`, margin + 10, yPos);
            yPos += 10;
          }
          if (paymentDetails.card > 0) {
            doc.text(`Card: Rs.${parseFloat(paymentDetails.card).toFixed(2)}`, margin + 10, yPos);
            yPos += 10;
          }
          if (paymentDetails.upi > 0) {
            doc.text(`UPI: Rs.${parseFloat(paymentDetails.upi).toFixed(2)}`, margin + 10, yPos);
            yPos += 10;
          }
        }

        yPos += 15;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).dash(5, { space: 2 }).stroke().undash();
        yPos += 15;

        // Footer
        doc.fontSize(9).font('Helvetica');
        doc.text('Thank you for your business!', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 10;
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
