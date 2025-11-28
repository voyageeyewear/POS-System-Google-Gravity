const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReceiptGenerator {
  // Helper function to draw a table row with borders
  drawTableRow(doc, x, y, width, height, label, value, isHeader = false, isBold = false) {
    const cellPadding = 3;
    const labelWidth = width * 0.5;
    const valueWidth = width * 0.5;
    
    // Draw borders
    doc.moveTo(x, y).lineTo(x + width, y).stroke(); // Top border
    doc.moveTo(x, y + height).lineTo(x + width, y + height).stroke(); // Bottom border
    doc.moveTo(x, y).lineTo(x, y + height).stroke(); // Left border
    doc.moveTo(x + labelWidth, y).lineTo(x + labelWidth, y + height).stroke(); // Middle border
    doc.moveTo(x + width, y).lineTo(x + width, y + height).stroke(); // Right border
    
    // Draw text
    if (isHeader) {
      doc.font('Helvetica-Bold').fontSize(7);
    } else {
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7);
    }
    
    doc.text(label || '', x + cellPadding, y + (height - 7) / 2, { width: labelWidth - cellPadding * 2 });
    doc.text(value || '', x + labelWidth + cellPadding, y + (height - 7) / 2, { 
      width: valueWidth - cellPadding * 2,
      align: 'right'
    });
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
          margin: margin,
          autoFirstPage: true
        });
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);

        let yPos = margin;

        // Voyage Logo (centered at top) - Use larger size, maintain aspect ratio
        const logoPath = path.resolve(__dirname, '../assets/voyage-logo.png');
        
        // Add 10px (10 points) margin-top for logo
        const logoTopMargin = 10;
        yPos += logoTopMargin;
        
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

        // Invoice Info - Table format with borders
        const infoRowHeight = 7;
        const infoTableWidth = contentWidth;
        
        infoLabels.forEach((label, i) => {
          this.drawTableRow(doc, margin, yPos, infoTableWidth, infoRowHeight, label, infoValues[i], false, false);
          yPos += infoRowHeight;
        });

        yPos += 3;

        // Items - Table format with borders
        const rowHeight = 8;
        const tableWidth = contentWidth;
        
        // Header row
        this.drawTableRow(doc, margin, yPos, tableWidth, rowHeight, 'Item', 'Amount', true);
        yPos += rowHeight;

        // Item rows
        doc.font('Helvetica').fontSize(7);
        sale.items?.forEach((item) => {
          const unitPrice = parseFloat(item.discountedPrice || item.unitPrice || 0);
          const quantity = parseInt(item.quantity || 1);
          const itemTotal = (unitPrice * quantity).toFixed(2);
          const itemName = item.name || item.productName || 'Item';
          
          // Calculate if item name needs multiple lines
          const itemNameWidth = tableWidth * 0.5 - 6;
          const lines = doc.heightOfString(itemName, { width: itemNameWidth });
          const actualRowHeight = Math.max(rowHeight, lines * 6 + 4);
          
          // Draw row with borders
          this.drawTableRow(doc, margin, yPos, tableWidth, actualRowHeight, itemName, `Rs.${itemTotal}`, false, false);
          yPos += actualRowHeight;
        });

        yPos += 3;

        // Totals - Table format with borders
        const totalsRowHeight = 7;
        
        // Subtotal row
        this.drawTableRow(doc, margin, yPos, tableWidth, totalsRowHeight, 'Subtotal:', `Rs.${parseFloat(sale.subtotal || 0).toFixed(2)}`, false, true);
        yPos += totalsRowHeight;

        // Discount row (if applicable)
        if (parseFloat(sale.totalDiscount || 0) > 0) {
          doc.fillColor('green');
          this.drawTableRow(doc, margin, yPos, tableWidth, totalsRowHeight, 'Discount:', `-Rs.${parseFloat(sale.totalDiscount || 0).toFixed(2)}`, false, true);
          doc.fillColor('black');
          yPos += totalsRowHeight;
        }

        // Tax row
        this.drawTableRow(doc, margin, yPos, tableWidth, totalsRowHeight, 'Tax:', `Rs.${parseFloat(sale.totalTax || 0).toFixed(2)}`, false, true);
        yPos += totalsRowHeight;

        // Total row (bold and slightly taller)
        const totalRowHeight = 9;
        doc.fontSize(8);
        this.drawTableRow(doc, margin, yPos, tableWidth, totalRowHeight, 'Total:', `Rs.${parseFloat(sale.totalAmount || 0).toFixed(2)}`, false, true);
        doc.fontSize(7);
        yPos += totalRowHeight;

        // Payment Mode - Table format with borders
        yPos += 3;
        const paymentRowHeight = 7;
        
        // Payment Mode header row
        const paymentMode = sale.paymentMode || (sale.paymentMethod ? sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1) : 'Cash');
        this.drawTableRow(doc, margin, yPos, tableWidth, paymentRowHeight, 'Payment Mode:', paymentMode, false, true);
        yPos += paymentRowHeight;

        // Parse paymentDetails if it's a string
        let paymentDetails = sale.paymentDetails;
        if (typeof paymentDetails === 'string') {
          try {
            paymentDetails = JSON.parse(paymentDetails);
          } catch (e) {
            paymentDetails = null;
          }
        }

        // Payment breakdown rows (if split payment)
        if (sale.paymentMode === 'Split' && paymentDetails) {
          if (paymentDetails.cash > 0) {
            this.drawTableRow(doc, margin, yPos, tableWidth, paymentRowHeight, 'Cash:', `Rs.${parseFloat(paymentDetails.cash).toFixed(2)}`, false, false);
            yPos += paymentRowHeight;
          }
          if (paymentDetails.card > 0) {
            this.drawTableRow(doc, margin, yPos, tableWidth, paymentRowHeight, 'Card:', `Rs.${parseFloat(paymentDetails.card).toFixed(2)}`, false, false);
            yPos += paymentRowHeight;
          }
          if (paymentDetails.upi > 0) {
            this.drawTableRow(doc, margin, yPos, tableWidth, paymentRowHeight, 'UPI:', `Rs.${parseFloat(paymentDetails.upi).toFixed(2)}`, false, false);
            yPos += paymentRowHeight;
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
