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
          size: [receiptWidth, 842], // 90mm width, fixed height
          margin: margin,
          autoFirstPage: true
        });
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);

        let yPos = margin;

        // Voyage Logo (centered at top) - Use larger size, maintain aspect ratio
        const logoPath = path.resolve(__dirname, '../assets/voyage-logo.png');
        
        if (fs.existsSync(logoPath)) {
          try {
            // Use smaller width for better proportion (90mm = ~255 points)
            const maxLogoWidth = receiptWidth - (margin * 2) - 80; // ~155 points (further reduced)
            // Logo is portrait (2480x3508), so height will be calculated to maintain aspect ratio
            // Aspect ratio: 3508/2480 ≈ 1.414 (height is 1.414x width)
            const logoWidth = maxLogoWidth; // Smaller size
            const logoHeight = logoWidth * 1.414; // Maintain aspect ratio (portrait)
            
            const logoX = (receiptWidth - logoWidth) / 2; // Center horizontally
            
            // Add logo at larger size maintaining aspect ratio
            doc.image(logoPath, logoX, yPos, { 
              width: logoWidth,
              height: logoHeight // Maintain actual aspect ratio
            });
            
            // Move yPos down by logo height with minimal spacing
            yPos += logoHeight - 5; // Overlap slightly or very tight spacing
          } catch (error) {
            console.error('❌ Error adding logo to receipt:', error.message);
            console.error('Logo path attempted:', logoPath);
            // Continue without logo if there's an error
          }
        } else {
          console.warn('⚠️ Logo file not found:', logoPath);
        }

        // Store Header
        doc.fontSize(14).font('Helvetica-Bold'); // Reduced from 18
        doc.text(store?.name || 'Voyage Eyewear', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 18; // Reduced from 25

        doc.fontSize(7).font('Helvetica'); // Reduced from 8
        if (store?.address) {
          if (store.address.street) {
            doc.text(store.address.street, margin, yPos, { width: contentWidth, align: 'center' });
            yPos += 8; // Reduced from 10
          }
          if (store.address.city && store.address.state) {
            doc.text(`${store.address.city}, ${store.address.state} ${store.address.zipCode || ''}`, margin, yPos, { width: contentWidth, align: 'center' });
            yPos += 8; // Reduced from 10
          }
        }
        if (store?.phone) {
          doc.text(`Phone: ${store.phone}`, margin, yPos, { width: contentWidth, align: 'center' });
          yPos += 8; // Reduced from 10
        }
        // Email - use default if not set or replace subhash email
        const storeEmail = store?.email && !store.email.includes('subhash-nagar') 
          ? store.email 
          : 'voyagekiosk@voyageeyewear.in';
        doc.text(`Email: ${storeEmail}`, margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 8; // Reduced from 10
        // Contact number
        doc.text(`Contact: +91 97167 85038`, margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 8; // Reduced from 10
        // GST Number (use store GST or default)
        const gstNumber = store?.gstNumber || '08AGFPK7804C1ZQ'; // Default GST from invoice
        doc.text(`GSTIN: ${gstNumber}`, margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 8; // Reduced from 10

        yPos += 3; // Reduced from 5
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 5; // Reduced from 10

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
          yPos += 8; // Reduced from 10
        });

        yPos += 2; // Further reduced
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 5; // Further reduced

        // Items - Clean table format
        doc.fontSize(7).font('Helvetica-Bold');
        doc.text('Item', margin, yPos);
        doc.text('Amount', receiptWidth - margin - 60, yPos, { width: 60, align: 'right' });
        yPos += 6;

        doc.font('Helvetica').fontSize(7);
        sale.items?.forEach((item) => {
          const unitPrice = parseFloat(item.discountedPrice || item.unitPrice || 0);
          const quantity = parseInt(item.quantity || 1);
          const itemTotal = (unitPrice * quantity).toFixed(2);
          const itemName = item.name || item.productName || 'Item';
          
          // Handle long item names - clean wrapping
          const lines = doc.heightOfString(itemName, { width: contentWidth - 70 });
          doc.text(itemName, margin, yPos, { width: contentWidth - 70 });
          doc.text(`Rs.${itemTotal}`, receiptWidth - margin - 60, yPos, { width: 60, align: 'right' });
          yPos += Math.max(lines, 6);
        });

        yPos += 3; // Reduced from 5
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 5; // Reduced from 10

        // Totals - use same aggressive single-line approach
        doc.fontSize(7); // Reduced from 8
        const totalsLabelWidth = 50;
        const totalsValueX = margin + totalsLabelWidth + 3;
        const totalsValueWidth = receiptWidth - totalsValueX - margin;
        
        doc.font('Helvetica-Bold').text('Subtotal:', margin, yPos, { width: totalsLabelWidth });
        doc.font('Helvetica').text(`Rs.${parseFloat(sale.subtotal || 0).toFixed(2)}`, totalsValueX, yPos, { width: totalsValueWidth });
        yPos += 6; // Reduced from 11

        if (parseFloat(sale.totalDiscount || 0) > 0) {
          doc.font('Helvetica-Bold').text('Discount:', margin, yPos, { width: totalsLabelWidth });
          doc.font('Helvetica').fillColor('green').text(`-Rs.${parseFloat(sale.totalDiscount || 0).toFixed(2)}`, totalsValueX, yPos, { width: totalsValueWidth });
          doc.fillColor('black');
          yPos += 6; // Reduced from 11
        }

        doc.font('Helvetica-Bold').text('Tax:', margin, yPos, { width: totalsLabelWidth });
        doc.font('Helvetica').text(`Rs.${parseFloat(sale.totalTax || 0).toFixed(2)}`, totalsValueX, yPos, { width: totalsValueWidth });
        yPos += 6;

        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 3; // Reduced from 5

        doc.fontSize(9).font('Helvetica-Bold'); // Further reduced from 10
        const totalLabel = 'Total:';
        const totalAmount = `Rs.${parseFloat(sale.totalAmount || 0).toFixed(2)}`;
        // Calculate positions to ensure single line - use more aggressive spacing
        const totalLabelWidth = 40;
        const totalValueX = margin + totalLabelWidth + 3; // Very close to label
        const totalValueWidth = receiptWidth - totalValueX - margin;
        doc.text(totalLabel, margin, yPos, { width: totalLabelWidth });
        doc.fontSize(8).text(totalAmount, totalValueX, yPos, { width: totalValueWidth }); // Further reduced from 9
        yPos += 7; // Reduced from 10

        // Payment Mode - Clean formatting
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).dash(5, { space: 2 }).stroke().undash();
        yPos += 5;

        doc.fontSize(7).font('Helvetica-Bold');
        let paymentText = `Payment Mode: ${sale.paymentMode || (sale.paymentMethod ? sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1) : 'Cash')}`;
        doc.text(paymentText, margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 6;

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
          doc.font('Helvetica').fontSize(7);
          // Align payment breakdown nicely
          const paymentLabelWidth = 50;
          const paymentValueX = margin + paymentLabelWidth + 5;
          
          if (paymentDetails.cash > 0) {
            doc.font('Helvetica-Bold').text('Cash:', margin, yPos, { width: paymentLabelWidth });
            doc.font('Helvetica').text(`Rs.${parseFloat(paymentDetails.cash).toFixed(2)}`, paymentValueX, yPos);
            yPos += 6;
          }
          if (paymentDetails.card > 0) {
            doc.font('Helvetica-Bold').text('Card:', margin, yPos, { width: paymentLabelWidth });
            doc.font('Helvetica').text(`Rs.${parseFloat(paymentDetails.card).toFixed(2)}`, paymentValueX, yPos);
            yPos += 6;
          }
          if (paymentDetails.upi > 0) {
            doc.font('Helvetica-Bold').text('UPI:', margin, yPos, { width: paymentLabelWidth });
            doc.font('Helvetica').text(`Rs.${parseFloat(paymentDetails.upi).toFixed(2)}`, paymentValueX, yPos);
            yPos += 6;
          }
        }

        yPos += 8; // Reduced from 15
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).dash(5, { space: 2 }).stroke().undash();
        yPos += 8; // Reduced from 15

        // Footer
        doc.fontSize(8).font('Helvetica'); // Reduced from 9
        doc.text('Thank you for your business!', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 7; // Reduced from 10
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
