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
          size: [receiptWidth, 842],
          margin: 0,
          autoFirstPage: true
        });
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);

        let yPos = 8;

        // Header - Logo and Title
        const logoPath = path.resolve(__dirname, '../assets/voyage-logo.png');
        let logoHeight = 0;
        
        if (fs.existsSync(logoPath)) {
          try {
            const logoWidth = 50;
            logoHeight = logoWidth * 1.414;
            doc.image(logoPath, margin, yPos, { 
              width: logoWidth,
              height: logoHeight
            });
          } catch (error) {
            console.error('❌ Error adding logo:', error.message);
          }
        }

        // Tax Invoice Title
        doc.fontSize(13).font('Helvetica-Bold');
        doc.text('Tax Invoice', receiptWidth - margin - 70, yPos + 8, { width: 70, align: 'right' });
        doc.fontSize(7).font('Helvetica');
        doc.text('(Original for Recipient)', receiptWidth - margin - 70, yPos + 18, { width: 70, align: 'right' });
        
        yPos += Math.max(logoHeight, 30) + 8;

        // Store Name - Add more top padding for neat spacing
        yPos += 12;
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(store?.name || 'Voyage Eyewear', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 10;

        // Store Details - Better spacing between lines
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
        doc.text('voyagekiosk@voyageeyewear.in', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 7;
        doc.text('+91 97167 85038', margin, yPos, { width: contentWidth, align: 'center' });
        yPos += 7;
        const gstNumber = store?.gstNumber || '08AGFPK7804C1ZQ';
        doc.text(`GSTIN: ${gstNumber}`, margin, yPos, { width: contentWidth, align: 'center' });
        // Add more bottom padding for neat spacing
        yPos += 12;

        // Divider
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 8;

        // Order Information
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Order Information', margin, yPos);
        yPos += 7;
        doc.fontSize(7).font('Helvetica');
        
        const saleDate = new Date(sale.saleDate || sale.createdAt);
        const day = String(saleDate.getDate()).padStart(2, '0');
        const month = String(saleDate.getMonth() + 1).padStart(2, '0');
        const year = saleDate.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;
        
        doc.text(`Invoice No.: ${sale.invoiceNumber}`, margin, yPos);
        yPos += 6;
        doc.text(`Date: ${formattedDate}`, margin, yPos);
        yPos += 6;
        if (customer?.name) {
          doc.text(`Customer: ${customer.name}`, margin, yPos);
          yPos += 6;
        }
        if (customer?.phone) {
          doc.text(`Phone: ${customer.phone}`, margin, yPos);
          yPos += 6;
        }
        yPos += 5;

        // Divider
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 8;

        // Items Table Header - Adjusted column widths to prevent overlap
        doc.fontSize(7).font('Helvetica-Bold');
        const colWidths = {
          sl: 18,
          product: 90,
          hsn: 32,
          qty: 18,
          price: 32,
          total: 35
        };
        
        // Ensure total width fits within contentWidth
        const totalColWidth = colWidths.sl + colWidths.product + colWidths.hsn + colWidths.qty + colWidths.price + colWidths.total;
        if (totalColWidth > contentWidth) {
          // Adjust product column to fit
          colWidths.product = contentWidth - (colWidths.sl + colWidths.hsn + colWidths.qty + colWidths.price + colWidths.total);
        }
        
        let colX = margin;
        doc.text('Sl.', colX, yPos, { width: colWidths.sl, align: 'center' });
        colX += colWidths.sl + 2; // Add small gap
        doc.text('Product Name', colX, yPos, { width: colWidths.product });
        colX += colWidths.product + 2;
        doc.text('HSN', colX, yPos, { width: colWidths.hsn, align: 'center' });
        colX += colWidths.hsn + 2;
        doc.text('Qty', colX, yPos, { width: colWidths.qty, align: 'center' });
        colX += colWidths.qty + 2;
        doc.text('Price', colX, yPos, { width: colWidths.price, align: 'right' });
        colX += colWidths.price + 2;
        doc.text('Total', colX, yPos, { width: colWidths.total, align: 'right' });
        
        yPos += 8;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 5;

        // Items - Handle text wrapping properly
        doc.fontSize(7).font('Helvetica');
        let subtotalBeforeTax = 0;
        let totalTax = 0;
        
        sale.items?.forEach((item, index) => {
          const unitPrice = parseFloat(item.discountedPrice || item.unitPrice || 0);
          const quantity = parseInt(item.quantity || 1);
          const taxRate = parseFloat(item.taxRate || 18);
          
          // Calculate tax
          const netPrice = unitPrice / (1 + taxRate / 100);
          const itemTax = unitPrice - netPrice;
          const itemTotal = unitPrice * quantity;
          const itemNetTotal = netPrice * quantity;
          const itemTaxTotal = itemTax * quantity;
          
          subtotalBeforeTax += itemNetTotal;
          totalTax += itemTaxTotal;
          
          // Determine HSN code
          const itemName = (item.name || item.productName || 'Product').toLowerCase();
          let hsnCode = '90031900';
          if (itemName.includes('sunglass')) {
            hsnCode = '90041000';
          }
          
          const productName = (item.name || item.productName || 'Product');
          
          // Calculate how many lines the product name will take
          const productNameHeight = doc.heightOfString(productName, { width: colWidths.product });
          const rowHeight = Math.max(productNameHeight, 8);
          
          // Sl. No.
          colX = margin;
          doc.text((index + 1).toString(), colX, yPos + (rowHeight - 6) / 2, { width: colWidths.sl, align: 'center' });
          colX += colWidths.sl + 2;
          
          // Product Name (with wrapping)
          doc.text(productName, colX, yPos, { width: colWidths.product });
          colX += colWidths.product + 2;
          
          // HSN
          doc.text(hsnCode, colX, yPos + (rowHeight - 6) / 2, { width: colWidths.hsn, align: 'center' });
          colX += colWidths.hsn + 2;
          
          // Qty
          doc.text(quantity.toString(), colX, yPos + (rowHeight - 6) / 2, { width: colWidths.qty, align: 'center' });
          colX += colWidths.qty + 2;
          
          // Price - Use Rs. instead of ₹ for proper rendering
          doc.text(`Rs.${unitPrice.toFixed(2)}`, colX, yPos + (rowHeight - 6) / 2, { width: colWidths.price, align: 'right' });
          colX += colWidths.price + 2;
          
          // Total
          doc.text(`Rs.${itemTotal.toFixed(2)}`, colX, yPos + (rowHeight - 6) / 2, { width: colWidths.total, align: 'right' });
          
          yPos += rowHeight + 2; // Add spacing between rows
        });

        yPos += 5;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 8;

        // Summary Section - Fixed alignment to prevent overlap
        doc.fontSize(7).font('Helvetica');
        const labelWidth = 130;
        const valueX = receiptWidth - margin - 55;
        const valueWidth = 55;
        
        // Subtotal before Tax
        doc.text('Subtotal before Tax', margin, yPos, { width: labelWidth });
        doc.text(`Rs.${subtotalBeforeTax.toFixed(2)}`, valueX, yPos, { width: valueWidth, align: 'right' });
        yPos += 7;

        // Discount (if applicable)
        if (parseFloat(sale.totalDiscount || 0) > 0) {
          doc.text('Discount', margin, yPos, { width: labelWidth });
          doc.text(`-Rs.${parseFloat(sale.totalDiscount || 0).toFixed(2)}`, valueX, yPos, { width: valueWidth, align: 'right' });
          yPos += 7;
        }

        // Total Tax
        doc.text('Total Tax', margin, yPos, { width: labelWidth });
        doc.text(`Rs.${totalTax.toFixed(2)}`, valueX, yPos, { width: valueWidth, align: 'right' });
        yPos += 8;

        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 6;

        // Total Invoice Amount
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Total Invoice Amount', margin, yPos, { width: labelWidth });
        doc.text(`Rs.${parseFloat(sale.totalAmount || 0).toFixed(2)}`, valueX, yPos, { width: valueWidth, align: 'right' });
        doc.fontSize(7);
        yPos += 12;

        // Payment Section
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 6;
        
        doc.fontSize(7).font('Helvetica');
        const paymentMode = sale.paymentMode || (sale.paymentMethod ? sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1) : 'Cash');
        doc.text(`Payment Mode: ${paymentMode}`, margin, yPos);
        yPos += 7;

        // Parse paymentDetails
        let paymentDetails = sale.paymentDetails;
        if (typeof paymentDetails === 'string') {
          try {
            paymentDetails = JSON.parse(paymentDetails);
          } catch (e) {
            paymentDetails = null;
          }
        }

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

        yPos += 8;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 8;

        // Footer
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 6;
        doc.fontSize(6).font('Helvetica');
        doc.text('Whether Tax is payable under reverse charge: No', margin, yPos);
        yPos += 6;
        if (store?.address) {
          const storeAddress = `${store.address.street || ''}, ${store.address.city || ''}, ${store.address.state || ''}, ${store.address.zipCode || ''}`.replace(/^,\s*|,\s*$/g, '');
          doc.text(storeAddress, margin, yPos, { width: contentWidth });
          yPos += 6;
        }
        doc.text(`GST No.: ${gstNumber}`, margin, yPos);

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
