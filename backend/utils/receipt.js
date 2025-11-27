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

        yPos += 5;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 10;

        // Invoice Info
        doc.fontSize(9);
        const infoLabels = ['Invoice #:', 'Date:', 'Customer:', 'Phone:'];
        const infoValues = [
          sale.invoiceNumber,
          new Date(sale.saleDate || sale.createdAt).toLocaleString(),
          customer?.name || 'N/A',
          customer?.phone || 'N/A'
        ];

        infoLabels.forEach((label, i) => {
          doc.font('Helvetica-Bold').text(label, margin, yPos);
          doc.font('Helvetica').text(infoValues[i], receiptWidth - margin - 100, yPos, { width: 100, align: 'right' });
          yPos += 12;
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
          doc.text(`₹${itemTotal}`, receiptWidth - margin - 60, yPos, { width: 60, align: 'right' });
          yPos += Math.max(lines, 12);
        });

        yPos += 5;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 10;

        // Totals
        doc.fontSize(9);
        doc.font('Helvetica-Bold').text('Subtotal:', margin, yPos);
        doc.font('Helvetica').text(`₹${parseFloat(sale.subtotal || 0).toFixed(2)}`, receiptWidth - margin - 60, yPos, { width: 60, align: 'right' });
        yPos += 12;

        if (parseFloat(sale.totalDiscount || 0) > 0) {
          doc.font('Helvetica-Bold').text('Discount:', margin, yPos);
          doc.font('Helvetica').fillColor('green').text(`-₹${parseFloat(sale.totalDiscount || 0).toFixed(2)}`, receiptWidth - margin - 60, yPos, { width: 60, align: 'right' });
          doc.fillColor('black');
          yPos += 12;
        }

        doc.font('Helvetica-Bold').text('Tax:', margin, yPos);
        doc.font('Helvetica').text(`₹${parseFloat(sale.totalTax || 0).toFixed(2)}`, receiptWidth - margin - 60, yPos, { width: 60, align: 'right' });
        yPos += 12;

        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 5;

        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Total:', margin, yPos);
        doc.text(`₹${parseFloat(sale.totalAmount || 0).toFixed(2)}`, receiptWidth - margin - 60, yPos, { width: 60, align: 'right' });
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
            doc.text(`Cash: ₹${parseFloat(paymentDetails.cash).toFixed(2)}`, margin + 10, yPos);
            yPos += 10;
          }
          if (paymentDetails.card > 0) {
            doc.text(`Card: ₹${parseFloat(paymentDetails.card).toFixed(2)}`, margin + 10, yPos);
            yPos += 10;
          }
          if (paymentDetails.upi > 0) {
            doc.text(`UPI: ₹${parseFloat(paymentDetails.upi).toFixed(2)}`, margin + 10, yPos);
            yPos += 10;
          }
        }

        yPos += 15;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).dash(5, { space: 2 }).stroke().undash();
        yPos += 15;

        // HSN/SAC Table
        if (sale.items && sale.items.length > 0) {
          doc.fontSize(7).font('Helvetica-Bold');
          const hsnHeaderY = yPos;
          doc.text('HSN/SAC', margin, hsnHeaderY);
          doc.text('Description', margin + 25, hsnHeaderY);
          doc.text('Qty', margin + 100, hsnHeaderY);
          doc.text('Rate', margin + 115, hsnHeaderY);
          doc.text('Taxable', margin + 145, hsnHeaderY);
          doc.text('Tax%', margin + 180, hsnHeaderY);
          doc.text('Tax', margin + 200, hsnHeaderY);
          yPos += 10;

          doc.font('Helvetica').fontSize(6);
          sale.items.forEach((item) => {
            const unitPrice = parseFloat(item.discountedPrice || item.unitPrice || 0);
            const quantity = parseInt(item.quantity || 1);
            const taxableValue = (unitPrice * quantity).toFixed(2);
            const taxRate = item.taxRate || 0;
            const taxAmount = parseFloat(item.taxAmount || (unitPrice * quantity * taxRate / 100)).toFixed(2);
            const hsnCode = item.product?.hsnCode || item.hsnCode || (item.category === 'sunglass' ? '9004' : item.category === 'frame' ? '9003' : '9004');
            const itemName = (item.name || item.productName || 'Item').substring(0, 20); // Truncate for space

            doc.text(hsnCode, margin, yPos);
            doc.text(itemName, margin + 25, yPos, { width: 70 });
            doc.text(quantity.toString(), margin + 100, yPos);
            doc.text(unitPrice.toFixed(2), margin + 115, yPos);
            doc.text(taxableValue, margin + 145, yPos);
            doc.text(`${taxRate}%`, margin + 180, yPos);
            doc.text(taxAmount, margin + 200, yPos);
            yPos += 8;
          });
          yPos += 5;
        }

        // Footer
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).dash(5, { space: 2 }).stroke().undash();
        yPos += 15;

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

