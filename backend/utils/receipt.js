const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReceiptGenerator {
  // Helper to draw table borders
  drawTableBorder(doc, x, y, width, height) {
    doc.moveTo(x, y).lineTo(x + width, y).stroke(); // Top
    doc.moveTo(x, y + height).lineTo(x + width, y + height).stroke(); // Bottom
    doc.moveTo(x, y).lineTo(x, y + height).stroke(); // Left
    doc.moveTo(x + width, y).lineTo(x + width, y + height).stroke(); // Right
  }

  // Helper to draw cell border
  drawCellBorder(doc, x, y, width, height) {
    doc.moveTo(x, y).lineTo(x, y + height).stroke(); // Left border
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
        const margin = 8;
        const contentWidth = receiptWidth - (margin * 2);
        
        const doc = new PDFDocument({ 
          size: [receiptWidth, 842], // 90mm width, fixed height
          margin: 0,
          autoFirstPage: true
        });
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);

        let yPos = 5;

        // Header Section - Logo on left, Title on right
        const logoPath = path.resolve(__dirname, '../assets/voyage-logo.png');
        let logoHeight = 0;
        
        if (fs.existsSync(logoPath)) {
          try {
            const logoWidth = 40;
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
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Tax Invoice', receiptWidth - margin - 80, yPos + 5, { width: 80, align: 'right' });
        doc.fontSize(6).font('Helvetica');
        doc.text('(Original for Recipient)', receiptWidth - margin - 80, yPos + 15, { width: 80, align: 'right' });
        
        yPos += Math.max(logoHeight, 25) + 5;

        // Customer Service Info (Right aligned)
        doc.fontSize(5).font('Helvetica');
        doc.text('Customer Service', receiptWidth - margin - 100, yPos, { width: 100, align: 'right' });
        yPos += 5;
        doc.text('Telephone: +91 97167 85038', receiptWidth - margin - 100, yPos, { width: 100, align: 'right' });
        yPos += 4;
        doc.text('Email: voyagekiosk@voyageeyewear.in', receiptWidth - margin - 100, yPos, { width: 100, align: 'right' });
        yPos += 8;

        // Horizontal line
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 5;

        // Billing and Shipping Address Section
        const addressWidth = (contentWidth - 5) / 2;
        const addressStartY = yPos;
        
        // Billing Address (Left)
        doc.fontSize(6).font('Helvetica-Bold');
        doc.text('Billing Address', margin, yPos);
        let billingY = yPos + 6;
        doc.fontSize(5).font('Helvetica');
        if (customer?.name) {
          doc.text(customer.name, margin, billingY, { width: addressWidth });
          billingY += 5;
        }
        if (customer?.address) {
          const addressLines = customer.address.split(',').map(s => s.trim());
          addressLines.forEach(line => {
            if (line) {
              doc.text(line, margin, billingY, { width: addressWidth });
              billingY += 5;
            }
          });
        } else if (store?.address) {
          if (store.address.street) {
            doc.text(store.address.street, margin, billingY, { width: addressWidth });
            billingY += 5;
          }
          if (store.address.city && store.address.state) {
            doc.text(`${store.address.city}, ${store.address.state} ${store.address.zipCode || ''}`, margin, billingY, { width: addressWidth });
            billingY += 5;
          }
        }
        if (store?.address?.state) {
          doc.text(`State Code: ${this.getStateCode(store.address.state)}`, margin, billingY);
          billingY += 5;
        }
        
        // Shipping Address (Right) - Same as billing
        let shippingY = addressStartY + 6;
        doc.fontSize(6).font('Helvetica-Bold');
        doc.text('Shipping Address', margin + addressWidth + 5, addressStartY);
        doc.fontSize(5).font('Helvetica');
        if (customer?.name) {
          doc.text(customer.name, margin + addressWidth + 5, shippingY, { width: addressWidth });
          shippingY += 5;
        }
        if (customer?.address) {
          const addressLines = customer.address.split(',').map(s => s.trim());
          addressLines.forEach(line => {
            if (line) {
              doc.text(line, margin + addressWidth + 5, shippingY, { width: addressWidth });
              shippingY += 5;
            }
          });
        } else if (store?.address) {
          if (store.address.street) {
            doc.text(store.address.street, margin + addressWidth + 5, shippingY, { width: addressWidth });
            shippingY += 5;
          }
          if (store.address.city && store.address.state) {
            doc.text(`${store.address.city}, ${store.address.state} ${store.address.zipCode || ''}`, margin + addressWidth + 5, shippingY, { width: addressWidth });
            shippingY += 5;
          }
        }
        if (store?.address?.state) {
          doc.text(`State Code: ${this.getStateCode(store.address.state)}`, margin + addressWidth + 5, shippingY);
          shippingY += 5;
          doc.text(`Place of Supply: ${store.address.state}`, margin + addressWidth + 5, shippingY);
          shippingY += 5;
        }
        
        yPos = Math.max(billingY, shippingY) + 5;

        // Horizontal line
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 5;

        // Order Information
        doc.fontSize(6).font('Helvetica-Bold');
        doc.text('Order Info', margin, yPos);
        yPos += 6;
        doc.fontSize(5).font('Helvetica');
        
        const saleDate = new Date(sale.saleDate || sale.createdAt);
        const day = String(saleDate.getDate()).padStart(2, '0');
        const month = String(saleDate.getMonth() + 1).padStart(2, '0');
        const year = saleDate.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;
        
        doc.text(`Order No.: ${sale.invoiceNumber}`, margin, yPos);
        yPos += 5;
        doc.text(`Invoice date: ${formattedDate}`, margin, yPos);
        yPos += 5;
        doc.text(`Invoice No.: ${sale.invoiceNumber}`, margin, yPos);
        yPos += 8;

        // Itemized Table Header - Adjusted for 90mm width
        const tableStartY = yPos;
        doc.fontSize(4).font('Helvetica-Bold');
        const colWidths = {
          article: 18,
          hsn: 28,
          size: 15,
          product: 45,
          unitPrice: 25,
          qty: 15,
          netPrice: 25,
          cgst: 20,
          sgst: 20,
          igst: 20,
          total: 25
        };
        
        let colX = margin;
        doc.text('Art.', colX, yPos, { width: colWidths.article });
        colX += colWidths.article;
        this.drawCellBorder(doc, colX, yPos - 2, 0, 10);
        doc.text('HSN', colX, yPos, { width: colWidths.hsn });
        colX += colWidths.hsn;
        this.drawCellBorder(doc, colX, yPos - 2, 0, 10);
        doc.text('Size', colX, yPos, { width: colWidths.size });
        colX += colWidths.size;
        this.drawCellBorder(doc, colX, yPos - 2, 0, 10);
        doc.text('Product', colX, yPos, { width: colWidths.product });
        colX += colWidths.product;
        this.drawCellBorder(doc, colX, yPos - 2, 0, 10);
        doc.text('Unit', colX, yPos, { width: colWidths.unitPrice });
        colX += colWidths.unitPrice;
        this.drawCellBorder(doc, colX, yPos - 2, 0, 10);
        doc.text('Qty', colX, yPos, { width: colWidths.qty });
        colX += colWidths.qty;
        this.drawCellBorder(doc, colX, yPos - 2, 0, 10);
        doc.text('Net', colX, yPos, { width: colWidths.netPrice });
        colX += colWidths.netPrice;
        this.drawCellBorder(doc, colX, yPos - 2, 0, 10);
        doc.text('CGST', colX, yPos, { width: colWidths.cgst });
        colX += colWidths.cgst;
        this.drawCellBorder(doc, colX, yPos - 2, 0, 10);
        doc.text('SGST', colX, yPos, { width: colWidths.sgst });
        colX += colWidths.sgst;
        this.drawCellBorder(doc, colX, yPos - 2, 0, 10);
        doc.text('IGST', colX, yPos, { width: colWidths.igst });
        colX += colWidths.igst;
        this.drawCellBorder(doc, colX, yPos - 2, 0, 10);
        doc.text('Total', colX, yPos, { width: colWidths.total });
        
        yPos += 8;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 3;

        // Items
        doc.fontSize(3.5).font('Helvetica');
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
          let hsnCode = '90031900'; // Default: Eyeglass/Frame
          if (itemName.includes('sunglass')) {
            hsnCode = '90041000'; // Sunglass
          }
          
          // Article number (use SKU or index)
          const articleNo = item.product?.sku || item.sku || `ART${index + 1}`;
          
          colX = margin;
          doc.text(articleNo.substring(0, 6), colX, yPos, { width: colWidths.article });
          colX += colWidths.article;
          this.drawCellBorder(doc, colX, yPos - 1, 0, 6);
          doc.text(hsnCode, colX, yPos, { width: colWidths.hsn });
          colX += colWidths.hsn;
          this.drawCellBorder(doc, colX, yPos - 1, 0, 6);
          doc.text('-', colX, yPos, { width: colWidths.size, align: 'center' });
          colX += colWidths.size;
          this.drawCellBorder(doc, colX, yPos - 1, 0, 6);
          const productName = (item.name || item.productName || 'Product').substring(0, 15);
          doc.text(productName, colX, yPos, { width: colWidths.product });
          colX += colWidths.product;
          this.drawCellBorder(doc, colX, yPos - 1, 0, 6);
          doc.text(netPrice.toFixed(2), colX, yPos, { width: colWidths.unitPrice, align: 'right' });
          colX += colWidths.unitPrice;
          this.drawCellBorder(doc, colX, yPos - 1, 0, 6);
          doc.text(quantity.toString(), colX, yPos, { width: colWidths.qty, align: 'center' });
          colX += colWidths.qty;
          this.drawCellBorder(doc, colX, yPos - 1, 0, 6);
          doc.text(itemNetTotal.toFixed(2), colX, yPos, { width: colWidths.netPrice, align: 'right' });
          colX += colWidths.netPrice;
          this.drawCellBorder(doc, colX, yPos - 1, 0, 6);
          // CGST/SGST split (for same state)
          const cgst = itemTaxTotal / 2;
          const sgst = itemTaxTotal / 2;
          const igst = 0; // Same state = 0 IGST
          doc.text(`${cgst.toFixed(2)}\n${(taxRate/2).toFixed(2)}%`, colX, yPos, { width: colWidths.cgst, align: 'right' });
          colX += colWidths.cgst;
          this.drawCellBorder(doc, colX, yPos - 1, 0, 6);
          doc.text(`${sgst.toFixed(2)}\n${(taxRate/2).toFixed(2)}%`, colX, yPos, { width: colWidths.sgst, align: 'right' });
          colX += colWidths.sgst;
          this.drawCellBorder(doc, colX, yPos - 1, 0, 6);
          doc.text(`${igst.toFixed(2)}\n0%`, colX, yPos, { width: colWidths.igst, align: 'right' });
          colX += colWidths.igst;
          this.drawCellBorder(doc, colX, yPos - 1, 0, 6);
          doc.text(itemTotal.toFixed(2), colX, yPos, { width: colWidths.total, align: 'right' });
          
          yPos += 8;
        });

        // Draw table border
        this.drawTableBorder(doc, margin, tableStartY - 2, receiptWidth - margin * 2, yPos - tableStartY + 2);
        yPos += 3;

        // Summary of Charges (Right aligned)
        const summaryX = receiptWidth - margin - 80;
        doc.fontSize(5).font('Helvetica');
        doc.text('Subtotal before Tax', summaryX, yPos, { width: 80, align: 'right' });
        doc.text(subtotalBeforeTax.toFixed(2), summaryX, yPos, { width: 80, align: 'right' });
        yPos += 6;
        doc.text('Shipping & Handling', summaryX, yPos, { width: 80, align: 'right' });
        doc.text('0.00', summaryX, yPos, { width: 80, align: 'right' });
        yPos += 6;
        doc.text('Total Tax', summaryX, yPos, { width: 80, align: 'right' });
        doc.text(totalTax.toFixed(2), summaryX, yPos, { width: 80, align: 'right' });
        yPos += 6;
        doc.fontSize(6).font('Helvetica-Bold');
        doc.text('Total Invoice Amount', summaryX, yPos, { width: 80, align: 'right' });
        doc.text(parseFloat(sale.totalAmount || 0).toFixed(2), summaryX, yPos, { width: 80, align: 'right' });
        yPos += 10;

        // Payment Section
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 5;
        
        doc.fontSize(5).font('Helvetica');
        const paymentMode = sale.paymentMode || (sale.paymentMethod ? sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1) : 'Cash');
        doc.text(`Payment Mode: ${paymentMode}`, margin, yPos);
        yPos += 6;

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
            doc.text(`Cash: Rs.${parseFloat(paymentDetails.cash).toFixed(2)}`, margin, yPos);
            yPos += 5;
          }
          if (paymentDetails.card > 0) {
            doc.text(`Card: Rs.${parseFloat(paymentDetails.card).toFixed(2)}`, margin, yPos);
            yPos += 5;
          }
          if (paymentDetails.upi > 0) {
            doc.text(`UPI: Rs.${parseFloat(paymentDetails.upi).toFixed(2)}`, margin, yPos);
            yPos += 5;
          }
        }

        yPos += 8;
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 5;

        // Authorization Section
        doc.fontSize(5).font('Helvetica');
        doc.text('For Voyage Eyewear:', margin, yPos);
        yPos += 15;
        doc.text('Authorized Signatory', margin, yPos);
        yPos += 10;

        // Footer - Legal Information
        doc.moveTo(margin, yPos).lineTo(receiptWidth - margin, yPos).stroke();
        yPos += 5;
        doc.fontSize(4).font('Helvetica');
        doc.text('Whether Tax is payable under reverse charge: No', margin, yPos);
        yPos += 5;
        if (store?.address) {
          const storeAddress = `${store.address.street || ''}, ${store.address.city || ''}, ${store.address.state || ''}, ${store.address.zipCode || ''}`.replace(/^,\s*|,\s*$/g, '');
          doc.text(storeAddress, margin, yPos, { width: contentWidth });
          yPos += 5;
        }
        const gstNumber = store?.gstNumber || '08AGFPK7804C1ZQ';
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

  // Helper to get state code (simplified - you can expand this)
  getStateCode(state) {
    const stateCodes = {
      'Delhi': '07',
      'Haryana': '06',
      'Uttar Pradesh': '09',
      'Maharashtra': '27',
      'Karnataka': '29',
      'Tamil Nadu': '33',
      'Gujarat': '24',
      'Rajasthan': '08',
      'Andhra Pradesh': '37',
      'Telangana': '36',
      'West Bengal': '19',
      'Punjab': '03',
      'Madhya Pradesh': '23',
      'Bihar': '10',
      'Odisha': '21',
      'Kerala': '32',
      'Assam': '18',
      'Jharkhand': '20',
      'Chhattisgarh': '22',
      'Himachal Pradesh': '02',
      'Uttarakhand': '05',
      'Goa': '30',
      'Manipur': '14',
      'Meghalaya': '17',
      'Mizoram': '15',
      'Nagaland': '13',
      'Tripura': '16',
      'Arunachal Pradesh': '12',
      'Sikkim': '11',
      'Jammu and Kashmir': '01',
      'Ladakh': '38',
      'Puducherry': '34',
      'Chandigarh': '04',
      'Dadra and Nagar Haveli': '26',
      'Daman and Diu': '25',
      'Lakshadweep': '31',
      'Andaman and Nicobar Islands': '35'
    };
    return stateCodes[state] || '00';
  }
}

module.exports = new ReceiptGenerator();
