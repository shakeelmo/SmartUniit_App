import jsPDF from 'jspdf';
import '@abdulrysr/saudi-riyal-new-symbol-font';
import { SMART_UNIVERSE_LOGO_BASE64 } from './logoBase64';

// Note: SAR currency symbol is handled as text in the PDF

// Saudi Riyal symbol as base64 image (small icon)
const SAUDI_RIYAL_SYMBOL_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAxMiAxMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIgM0g0VjEwSDJWM0g4VjVIMTJWMTBIMTBWN0g4VjVIMTJWNEg4VjNIMTJWMkgxMFYzSDhWMkg2VjNIMloiIGZpbGw9IiMxZTRhYWYiLz4KPC9zdmc+';

// Helper function to format currency with thousands separators
function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Helper function to add Saudi Riyal symbol as image
function addSaudiRiyalSymbol(pdf: jsPDF, x: number, y: number, size: number = 3) {
  try {
    pdf.addImage(SAUDI_RIYAL_SYMBOL_BASE64, 'PNG', x, y - size/2, size, size);
  } catch (error) {
    console.warn('Could not add Saudi Riyal symbol image:', error);
  }
}

// Helper function to format currency with Saudi Riyal symbol
function formatCurrencyWithSymbol(amount: number): string {
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  // Use "SAR" text for PDF compatibility - the symbol will be added separately in the UI
  return `${formattedAmount} SAR`;
}

export async function generateQuotationPDF(quote: any, settings: any = {}) {
  console.log('PDF Generator - Input quote:', quote);
  console.log('PDF Generator - Input settings:', settings);
  
  // Fix and clean quote data
  const lineItems = quote.lineItems || [];
  const combinedItems = new Map();
  
  lineItems.forEach((item: any) => {
    // Clean and validate item data
    const rawName = String(item.name || item.description || '').trim();
    const quantity = parseFloat(String(item.quantity || 0));
    const unitPrice = parseFloat(String(item.unitPrice || 0));
    const itemTotal = parseFloat(String(item.total || (quantity * unitPrice) || 0));
    
    // Skip invalid or test items
    if (quantity <= 0 || unitPrice <= 0 || isTestData(rawName)) {
      return;
    }
    
    const key = rawName.toLowerCase();
    
    if (combinedItems.has(key)) {
      const existing = combinedItems.get(key);
      existing.quantity += quantity;
      existing.total += itemTotal;
      // Keep the higher unit price if they differ
      if (unitPrice > existing.unitPrice) {
        existing.unitPrice = unitPrice;
      }
    } else {
      // Create clean, meaningful description
      let itemName = rawName;
      if (!itemName || itemName.toLowerCase() === 'item') {
        itemName = 'Professional Service';
      }
      
      combinedItems.set(key, {
        name: itemName,
        quantity: quantity,
        unitPrice: unitPrice,
        total: itemTotal
      });
    }
  });
  
  // Helper function to detect test data
  function isTestData(text: string): boolean {
    const testPatterns = [
      /^\d+$/, // Just numbers like "2222", "222222"
      /^[a-z]{1,3}$/, // Short random text like "fa", "adf"
      /test/i,
      /dummy/i,
      /placeholder/i
    ];
    return testPatterns.some(pattern => pattern.test(text));
  }
  
  const deduplicatedItems = Array.from(combinedItems.values()).filter(item => item.name && item.quantity > 0);
  
  // Calculate totals properly including discount
  const subtotal = deduplicatedItems.reduce((sum: number, item: any) => {
    return sum + parseFloat(String(item.total || 0));
  }, 0);
  
  // Calculate discount
  const discountType = quote.discountType || 'percentage';
  const discountValue = parseFloat(String(quote.discountValue || 0));
  let discountAmount = 0;
  if (discountValue > 0) {
    if (discountType === 'percentage') {
      discountAmount = subtotal * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }
  }
  
  const vatRate = parseFloat(quote.vatRate) || parseFloat(settings?.vatRate) || 15; // 15% VAT
  const vatAmount = (subtotal - discountAmount) * (vatRate / 100);
  const total = subtotal - discountAmount + vatAmount;
  
  console.log('PDF Generator - Calculated totals:', { subtotal, discountAmount, vatAmount, total, lineItemsCount: deduplicatedItems.length });

  // Custom terms and conditions - use the actual terms from the quote
  const customTerms = quote.terms || settings.defaultTerms || [
    'Payment terms: 30 days from invoice date',
            'All prices are in Saudi Riyals (SAR)',
    'VAT is included in all prices',
    'Delivery will be made within 7-14 business days'
  ];

  // Get customer data - handle both quote.customer and separate customer object
  const customer = quote.customer || quote;
  
  console.log('PDF Generator - Customer data:', customer);

  // Create PDF using jsPDF with proper encoding
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Note: Font embedding for custom symbols in jsPDF is complex
  // We'll use a different approach for the Saudi Riyal symbol
  
  // Set document properties for proper Unicode support
  pdf.setProperties({
    title: 'Quotation',
    subject: 'Business Quotation',
    author: 'Smart Universe',
    creator: 'Smart Universe Task Flow'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (2 * margin);
  
  let currentY = margin;
  let pageNumber = 1;

  // Function to add a new page
  const addNewPage = () => {
    pdf.addPage();
    pageNumber++;
    currentY = margin;
  };

  // Function to check if we need a new page with optimized footer space
  const checkPageBreak = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - margin - 25) { // Optimized footer space
      addNewPage();
      return true;
    }
    return false;
  };
  
  // Note: checkPageBreak is available for future use if needed

  // Function to check if text contains Arabic characters
  const isArabicText = (text: string): boolean => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text);
  };

  // Function to add text with proper font support for Arabic
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    const { fontSize = 10, fontFamily = 'helvetica', fontStyle = 'normal', color = [51, 51, 51], align = 'left' } = options;
    
    pdf.setFontSize(fontSize);
    pdf.setFont(fontFamily, fontStyle);
    pdf.setTextColor(color[0], color[1], color[2]);
    
    // Handle Arabic text with proper alignment
    if (isArabicText(text)) {
      // For Arabic text, use right alignment and ensure proper rendering
      pdf.text(text, x, y, { align: 'right' });
    } else {
      pdf.text(text, x, y, { align });
    }
  };

  // Function to add text with word wrapping and proper font support
  const addWrappedText = (text: string, x: number, startY: number, maxWidth: number, options: any = {}) => {
    const { fontSize = 10, fontFamily = 'helvetica', fontStyle = 'normal', color = [51, 51, 51] } = options;
    
    pdf.setFontSize(fontSize);
    pdf.setFont(fontFamily, fontStyle);
    pdf.setTextColor(color[0], color[1], color[2]);
    
    const lines = pdf.splitTextToSize(text, maxWidth);
    let localY = startY;
    lines.forEach((line: string) => {
      if (localY + 5 > pageHeight - margin - 35) {
        addNewPage();
        localY = margin;
      }
      
      if (isArabicText(line)) {
        pdf.text(line, x + maxWidth, localY, { align: 'right' });
      } else {
        pdf.text(line, x, localY);
      }
      localY += 5;
    });
    currentY = localY;
    return lines.length * 5;
  };

  // Function to add professional header
  const addHeader = () => {
    // 1. LOGO POSITIONING - Left side, 25mm × 25mm as requested
    const logoSize = 25; // Increased to 25mm × 25mm for better visibility
    const logoY = currentY + 2;
    try {
      pdf.addImage(SMART_UNIVERSE_LOGO_BASE64, 'JPEG', margin, logoY, logoSize, logoSize);
    } catch (error) {
      console.warn('Could not add header logo:', error);
    }
    
    // 2. TWO-PART HEADER LAYOUT: Company Info (Left) + Quotation Details (Right)
    
    // LEFT PART: Company Information Block - Left aligned with proper spacing
    const logoGap = 10;
    const companyX = margin + logoSize + logoGap;
    const companyY = currentY + 4;
    const companyMaxWidth = 120; // Adequate width for company information
    
    // Company name broken into logical parts with proper width control
    // Part 1: Main company name
    addText('Smart Universe', companyX, companyY, { fontSize: 14, fontStyle: 'bold', color: [30, 64, 175] });
    
    // Part 2: Subtitle on next line
    const subtitleY = companyY + 6;
    const subtitleText = 'for Communications and Information Technology';
    const subtitleLines = pdf.splitTextToSize(subtitleText, companyMaxWidth);
    subtitleLines.forEach((line: string, index: number) => {
      addText(line, companyX, subtitleY + (index * 4), { fontSize: 10, fontStyle: 'bold', color: [30, 64, 175] });
    });
    
    // Company address with proper wrapping
    const companyDetailsY = subtitleY + (subtitleLines.length * 4) + 4;
    const addressText = 'Office # 3 ln, Al Dirah Dist, P.O.Box 12633, Riyadh - 11461 KSA';
    const addressLines = pdf.splitTextToSize(addressText, companyMaxWidth);
    addressLines.forEach((line: string, index: number) => {
      addText(line, companyX, companyDetailsY + (index * 3), { fontSize: 8, color: [51, 51, 51] });
    });
    
    // Phone number
    const phoneY = companyDetailsY + (addressLines.length * 3) + 2;
    addText('Tel: 011-4917295', companyX, phoneY, { fontSize: 8, color: [51, 51, 51] });
    
    // Registration details
    const regDetailsY = phoneY + 6;
    addText('VAT: 300155266800003', companyX, regDetailsY, { fontSize: 8, color: [51, 51, 51] });
    addText('CR: 1010973808', companyX, regDetailsY + 3, { fontSize: 8, color: [51, 51, 51] });
    
    // RIGHT PART: Quotation Details Box - Far right, just above header line to avoid overlap
    const quoteBoxWidth = 55; // reduced width to better fit text content and prevent overlap
    const quoteBoxHeight = 14; // reduced height to better fit text content and prevent overlap

    // Calculate the bottom of the company info block
    const companyBottomY = (regDetailsY + 6);

    // Place the quotation box so its bottom sits exactly on the header line area on the right corner
    const rightPadding = -5; // increased negative padding to move it further right, right before page end
    const quoteDetailsX = pageWidth - margin - quoteBoxWidth - rightPadding; // anchor to right edge
    const quoteDetailsY = companyBottomY - quoteBoxHeight; // position it exactly on top of the header separator line

    // Background box
    pdf.setFillColor(248, 250, 252);
    pdf.rect(quoteDetailsX - 3, quoteDetailsY - 2, quoteBoxWidth, quoteBoxHeight, 'F');

    // Border
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.rect(quoteDetailsX - 3, quoteDetailsY - 2, quoteBoxWidth, quoteBoxHeight, 'S');

    // Blue accent line
    pdf.setDrawColor(30, 64, 175);
    pdf.setLineWidth(2);
    pdf.line(quoteDetailsX - 3, quoteDetailsY - 2, quoteDetailsX - 3, quoteDetailsY + quoteBoxHeight - 2);

    // Labels and values - adjusted for smaller box and better text alignment
    addText('Quotation #:', quoteDetailsX + 2, quoteDetailsY + 3, { fontSize: 7, fontStyle: 'bold', color: [51, 51, 51] });
    addText(quote.quoteNumber || quote.quote_number || 'Q-001', quoteDetailsX + 25, quoteDetailsY + 3, { fontSize: 8, fontStyle: 'bold', color: [30, 64, 175] });

    addText('Date:', quoteDetailsX + 2, quoteDetailsY + 8, { fontSize: 7, fontStyle: 'bold', color: [51, 51, 51] });
    const quoteDate = quote.created_at ? new Date(quote.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    addText(quoteDate, quoteDetailsX + 25, quoteDetailsY + 8, { fontSize: 8, fontStyle: 'bold', color: [30, 64, 175] });
    
    // 5. CALCULATE HEADER HEIGHT - Dynamic based on content
    const companySectionHeight = regDetailsY + 6;
    const quoteSectionHeight = quoteDetailsY + quoteBoxHeight;
    currentY = Math.max(companySectionHeight, quoteSectionHeight);
    
    // 6. CLEAN SEPARATOR LINE - Professional finish
    currentY += 6;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
  };

  // Function to add customer information section
  const addCustomerSection = () => {
    // Add section title with better positioning
    addText('Bill To:', margin, currentY, { fontSize: 12, fontStyle: 'bold', color: [30, 64, 175] });
    currentY += 8;
    
    // Calculate customer section width to align with table
    const tableWidth = 175; // Match the table width from addItemsTable
    const tableCenterX = (pageWidth - tableWidth) / 2;
    const customerSectionWidth = tableWidth; // Same width as table
    const customerStartX = tableCenterX; // Align with table left edge
    
    // Customer details with proper alignment
    if (quote.customer) {
      const customer = quote.customer;
      
      // Company name (always shown, bold)
      if (customer.name && customer.name.trim()) {
        addText(customer.name.trim(), customerStartX, currentY, { fontSize: 11, fontStyle: 'bold', color: [51, 51, 51] });
        currentY += 6;
      }
      
      // Address (only if not empty)
      if (customer.address && customer.address.trim() && customer.address.trim() !== 'N/A') {
        addText(customer.address.trim(), customerStartX, currentY, { fontSize: 10, color: [51, 51, 51] });
        currentY += 5;
      }
      
      // Phone (only if not empty)
      if (customer.phone && customer.phone.trim() && customer.phone.trim() !== 'N/A') {
        addText(`Phone: ${customer.phone.trim()}`, customerStartX, currentY, { fontSize: 10, color: [51, 51, 51] });
        currentY += 5;
      }
      
      // Email (only if not empty)
      if (customer.email && customer.email.trim() && customer.email.trim() !== 'N/A') {
        addText(`Email: ${customer.email.trim()}`, customerStartX, currentY, { fontSize: 10, color: [51, 51, 51] });
        currentY += 5;
      }
    } else {
      // Fallback for missing customer data
      addText('Customer information not available', customerStartX, currentY, { fontSize: 10, fontStyle: 'italic', color: [153, 153, 153] });
      currentY += 6;
    }
    
    // Add spacing before items table
    currentY += 10;
  };

  // Function to add items table with improved pagination logic
  const addItemsTable = () => {
    const tableHeaderHeight = 15;
    const rowHeight = 14; // Slightly increased for better text handling
    
    // Calculate space needed for sections that must follow table
    const totalsNeeded = 45; // Space for totals section
    const termsNeeded = 70;   // Space for terms section
    const footerNeeded = 30;  // Footer space
    const bufferSpace = 5;    // Reduced safety buffer to prevent unnecessary breaks
    
    // Calculate if entire table can fit on current page
    const totalTableHeight = tableHeaderHeight + (deduplicatedItems.length * rowHeight);
    const totalSpaceNeeded = totalTableHeight + totalsNeeded + termsNeeded + footerNeeded + bufferSpace;
    const availableSpace = pageHeight - margin - currentY;
    
    console.log('PDF: Total items:', deduplicatedItems.length, 'Available space:', availableSpace, 'Current Y:', currentY);
    
    // Add table header with better positioning
    addText('Items & Services', margin, currentY, { fontSize: 12, fontStyle: 'bold', color: [30, 64, 175] });
    currentY += 8;

    // Improved column widths for better professional appearance
    // Total table width: 175 (optimized for A4 page)
    const colWidths = [18, 85, 25, 32, 30]; // Optimized for A4 page fit with professional readability
    const tableStartX = margin;
    const tableEndX = tableStartX + colWidths.reduce((sum, width) => sum + width, 0);
    
    // Center the table on the page for professional appearance
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const tableCenterX = (pageWidth - tableWidth) / 2;
    const colX = [
      tableCenterX,
      tableCenterX + colWidths[0],
      tableCenterX + colWidths[0] + colWidths[1],
      tableCenterX + colWidths[0] + colWidths[1] + colWidths[2],
      tableCenterX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]
    ];
    
    // Add table header with improved styling and positioning
    const addTableHeader = () => {
      pdf.setFillColor(30, 64, 175);
      pdf.setTextColor(255, 255, 255);
      pdf.rect(tableCenterX, currentY, tableWidth, tableHeaderHeight, 'F');
      
      // Add header borders with white lines
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.3);
      
      // Draw header cell borders
      colWidths.forEach((width, colIndex) => {
        pdf.rect(colX[colIndex], currentY, width, tableHeaderHeight);
      });
      
      // Add header text with proper alignment
      addText('#', colX[0] + colWidths[0]/2, currentY + 10, { fontSize: 10, fontStyle: 'bold', color: [255, 255, 255], align: 'center' });
      addText('Description', colX[1] + 2, currentY + 10, { fontSize: 10, fontStyle: 'bold', color: [255, 255, 255] });
      addText('Qty', colX[2] + colWidths[2]/2, currentY + 10, { fontSize: 10, fontStyle: 'bold', color: [255, 255, 255], align: 'center' });
      addText('Unit Price', colX[3] + colWidths[3]/2, currentY + 10, { fontSize: 10, fontStyle: 'bold', color: [255, 255, 255], align: 'center' });
      addText('Total', colX[4] + colWidths[4]/2, currentY + 10, { fontSize: 10, fontStyle: 'bold', color: [255, 255, 255], align: 'center' });
      
      currentY += tableHeaderHeight;
    };
    
    // If no valid items, show "No items" message
    if (deduplicatedItems.length === 0) {
      addTableHeader();
      // Add "No items" row
      pdf.setFillColor(250, 250, 250);
      pdf.rect(tableCenterX, currentY, tableWidth, rowHeight, 'F');
      addText('No items to display', tableCenterX + tableWidth/2, currentY + 8, { 
        fontSize: 10, 
        color: [153, 153, 153], 
        fontStyle: 'italic',
        align: 'center' 
      });
      currentY += rowHeight;
      // Add small gap after table
      currentY += 5;
      return;
    }

    let headerAdded = false;

    // Add header only once at the beginning
    addTableHeader();
    headerAdded = true;
    
    // Always try to start table on current page first
    // Only move to next page if we have valid items and absolutely no space
    if (deduplicatedItems.length > 0 && currentY + tableHeaderHeight + rowHeight + 80 > pageHeight - margin) {
      // Move to next page only if we can't fit even header + one row + minimal space
      addNewPage();
      // Add header again on new page
      addTableHeader();
      headerAdded = true;
    }
    
    // Add items with proper pagination and alignment
    deduplicatedItems.forEach((item: any, index: number) => {
      // Check if we need a new page for this row - be less aggressive
      const spaceForThisRow = rowHeight + totalsNeeded + termsNeeded + footerNeeded;
      if (currentY + spaceForThisRow > pageHeight - margin && index > 0) {
        // Only break if we really can't fit the row
        if (currentY + rowHeight > pageHeight - margin) {
          addNewPage();
          // Always add header on new page for table continuity
          addTableHeader();
          headerAdded = true;
        }
      }

      const quantity = item.quantity;
      const unitPrice = item.unitPrice;
      const itemTotal = item.total;
      
      // Clean and format description - remove excessive line breaks
      let description = String(item.name).replace(/\n+/g, ' ').trim();
      
      // Allow longer descriptions with better text wrapping
      const descLines = pdf.splitTextToSize(description, colWidths[1] - 8);
      // Allow up to 4 lines for better description visibility in narrower column
      const limitedDescLines = descLines.slice(0, 4);
      const rowActualHeight = Math.max(rowHeight, Math.min(limitedDescLines.length * 4 + 8, 35));

      // Add alternating row background for professional appearance
      if (index % 2 === 1) {
        pdf.setFillColor(248, 249, 250); // Very light gray
        pdf.rect(tableCenterX, currentY, tableWidth, rowActualHeight, 'F');
      }

      // Add table borders for each cell with improved styling
      pdf.setDrawColor(150, 150, 150);
      pdf.setLineWidth(0.2);
      
      // Draw cell borders
      colWidths.forEach((width, colIndex) => {
        pdf.rect(colX[colIndex], currentY, width, rowActualHeight);
      });
      
      // Reset line properties
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.1);
      
      // Add row content with proper alignment within cells
      addText((index + 1).toString(), colX[0] + colWidths[0]/2, currentY + 9, { fontSize: 10, color: [51, 51, 51], align: 'center' });
      
      // Handle descriptions with controlled wrapping within cell bounds
      limitedDescLines.forEach((line: string, lineIndex: number) => {
        addText(line, colX[1] + 2, currentY + 9 + (lineIndex * 4), { fontSize: 8, color: [51, 51, 51] });
      });
      
      // Format numbers with thousands separators and proper alignment
      // Cap quantity at reasonable levels and default to 1 if unrealistic
      const normalizedQuantity = (quantity > 1000 || quantity <= 0) ? 1 : quantity;
      const quantityText = normalizedQuantity === 1 ? '1 pc' : `${Math.round(normalizedQuantity).toLocaleString()} pcs`;
              const unitPriceText = `${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const totalText = `${itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      
      // Center quantity, center unit price, right-align total
      addText(quantityText, colX[2] + colWidths[2]/2, currentY + 9, { fontSize: 10, color: [51, 51, 51], align: 'center' });
      addText(unitPriceText, colX[3] + colWidths[3]/2, currentY + 9, { fontSize: 10, color: [51, 51, 51], align: 'center' });
      addText(totalText, colX[4] + colWidths[4] - 3, currentY + 9, { fontSize: 10, color: [51, 51, 51], align: 'right' });

      currentY += rowActualHeight;
    });
    
    // Add horizontal divider above totals with better positioning
    currentY += 8;
    pdf.setDrawColor(30, 64, 175);
    pdf.setLineWidth(0.5);
    // Align divider with table width
    pdf.line(tableCenterX, currentY, tableCenterX + tableWidth, currentY);
    currentY += 5;
  };

  // Function to add totals section directly below items table
  const addTotalsSection = () => {
    // Calculate exact space needed for totals section
    const totalsHeight = (discountAmount > 0 ? 4 : 3) * 6 + 10; // 3-4 lines + spacing
    
    // Only break page if we absolutely cannot fit totals
    if (currentY + totalsHeight + 35 > pageHeight - margin) {
      addNewPage();
      // Re-add divider if on new page
      pdf.setDrawColor(30, 64, 175);
      pdf.setLineWidth(0.5);
      // Align divider with table width
      const tableWidth = 175; // Match the table width from addItemsTable
      const tableCenterX = (pageWidth - tableWidth) / 2;
      pdf.line(tableCenterX, currentY, tableCenterX + tableWidth, currentY);
      currentY += 5;
    }

    // Calculate totals section positioning to align with table
    const tableWidth = 175; // Match the table width from addItemsTable
    const tableCenterX = (pageWidth - tableWidth) / 2;
    const totalsSectionWidth = 120; // Width of the totals section
    const totalsStartX = tableCenterX + tableWidth - totalsSectionWidth; // Right-align with table
    
    // Subtotal - Bold label with proper number formatting
    addText('Subtotal', totalsStartX, currentY, { fontSize: 10, fontStyle: 'bold', color: [51, 51, 51] });
            addText(`${formatCurrency(subtotal)} SAR`, tableCenterX + tableWidth - 5, currentY, { fontSize: 10, fontStyle: 'bold', color: [51, 51, 51], align: 'right' });
    currentY += 6; // Improved spacing

    // Discount - if applicable with bold label
    if (discountAmount > 0) {
      const discountLabel = discountType === 'percentage' 
        ? `Discount (${discountValue}%)`
        : 'Discount (Fixed)';
      addText(discountLabel, totalsStartX, currentY, { fontSize: 10, fontStyle: 'bold', color: [51, 51, 51] });
              addText(`-${formatCurrency(discountAmount)} SAR`, tableCenterX + tableWidth - 5, currentY, { fontSize: 10, fontStyle: 'bold', color: [51, 51, 51], align: 'right' });
      currentY += 6;
    }

    // VAT - Bold label with proper number formatting
    const vatLabel = `VAT (${vatRate}%)`;
    addText(vatLabel, totalsStartX, currentY, { fontSize: 10, fontStyle: 'bold', color: [51, 51, 51] });
            addText(`${formatCurrency(vatAmount)} SAR`, tableCenterX + tableWidth - 5, currentY, { fontSize: 10, fontStyle: 'bold', color: [51, 51, 51], align: 'right' });
    currentY += 6;

    // Total - Enhanced formatting with proper thousands separators
    currentY += 3; // Small gap before total
    addText('Total', totalsStartX, currentY, { fontSize: 12, fontStyle: 'bold', color: [30, 64, 175] });
            addText(`${formatCurrency(total)} SAR`, tableCenterX + tableWidth - 5, currentY, { fontSize: 12, fontStyle: 'bold', color: [30, 64, 175], align: 'right' });
    currentY += 10;

    // Quotation validity removed - users can customize validity in terms
    currentY += 6;
  };

  // Function to add scope of work section
  const addScopeOfWork = () => {
    // Check if scope of work exists
    if (!quote.scopeOfWork && !quote.scopeOfWorkAr) {
      return; // Skip if no scope of work
    }

    // Calculate space needed for scope section
    const scopeHeight = 20; // Header + some space
    
    // Only break page if scope absolutely won't fit
    if (currentY + scopeHeight + 35 > pageHeight - margin) {
      addNewPage();
    }

    // Add gap before scope
    currentY += 8;
    
    // Subtle separator line aligned with table
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    const tableWidth = 175; // Match the table width from addItemsTable
    const tableCenterX = (pageWidth - tableWidth) / 2;
    pdf.line(tableCenterX, currentY, tableCenterX + tableWidth, currentY);
    currentY += 6;

    // Scope of Work header
    addText('Scope of Work:', tableCenterX, currentY, { fontSize: 11, fontStyle: 'bold', color: [30, 64, 175] });
    currentY += 7;
    
    // Add English scope of work if available
    if (quote.scopeOfWork) {
      const scopeLines = quote.scopeOfWork.split('\n');
      scopeLines.forEach((line: string) => {
        const lines = pdf.splitTextToSize(`• ${line}`, tableWidth - 10);
        lines.forEach((wrappedLine: string, lineIndex: number) => {
          const fontSize = lineIndex === 0 ? 9.5 : 9;
          addText(wrappedLine, tableCenterX + 3, currentY, { fontSize, fontStyle: 'normal', color: [51, 51, 51] });
          currentY += 4.5;
        });
        currentY += 1;
      });
    }
    
    // Add Arabic scope of work if available
    if (quote.scopeOfWorkAr) {
      currentY += 3; // Add some space between English and Arabic
      addText('نطاق العمل:', tableCenterX + tableWidth - 5, currentY, { fontSize: 11, fontStyle: 'bold', color: [30, 64, 175], align: 'right' });
      currentY += 7;
      
      const scopeArLines = quote.scopeOfWorkAr.split('\n');
      scopeArLines.forEach((line: string) => {
        const lines = pdf.splitTextToSize(`• ${line}`, tableWidth - 10);
        lines.forEach((wrappedLine: string, lineIndex: number) => {
          const fontSize = lineIndex === 0 ? 9.5 : 9;
          addText(wrappedLine, tableCenterX + tableWidth - 5, currentY, { fontSize, fontStyle: 'normal', color: [51, 51, 51], align: 'right' });
          currentY += 4.5;
        });
        currentY += 1;
      });
    }
  };

  // Function to add terms and conditions with banking details side by side
  const addTermsAndConditions = () => {
    // Calculate space needed for terms and banking section
    const termsHeight = 15 + (customTerms.length * 5 * 1.3); // Header + terms with improved line height
    
    // Only break page if terms absolutely won't fit
    if (currentY + termsHeight + 35 > pageHeight - margin) {
      addNewPage();
    }

    // Add gap before terms
    currentY += 8;
    
    // Subtle separator line aligned with table
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    const tableWidth = 175; // Match the table width from addItemsTable
    const tableCenterX = (pageWidth - tableWidth) / 2;
    pdf.line(tableCenterX, currentY, tableCenterX + tableWidth, currentY);
    currentY += 6;

    const startY = currentY;
    const leftColumnWidth = (tableWidth * 0.55); // 55% of table width for terms
    const rightColumnWidth = (tableWidth * 0.4); // 40% of table width for banking
    const columnGap = tableWidth * 0.05; // 5% gap
    
    // Left column: Terms and conditions (aligned with table left edge)
    addText('Terms and Conditions:', tableCenterX, currentY, { fontSize: 11, fontStyle: 'bold', color: [30, 64, 175] });
    currentY += 7;
    
    // Get terms from quote or use defaults
    const termsToUse = quote.terms ? quote.terms.split('\n') : (settings.terms ? settings.terms.split('\n') : customTerms);
    
    // Enhanced terms list with improved spacing
    termsToUse.forEach((term: string) => {
      const lines = pdf.splitTextToSize(`• ${term}`, leftColumnWidth - 10);
      lines.forEach((line: string, lineIndex: number) => {
        const fontSize = lineIndex === 0 ? 9.5 : 9;
        const isKeyTerm = term.includes('Payment terms:') || term.includes('VAT is included') || term.includes('30 days');
        const fontStyle = isKeyTerm && lineIndex === 0 ? 'bold' : 'normal';
        addText(line, tableCenterX + 3, currentY, { fontSize, fontStyle, color: [51, 51, 51] });
        currentY += 4.5;
      });
      currentY += 1;
    });

    // Right column: Banking details (aligned with table right edge)
    const bankingX = tableCenterX + leftColumnWidth + columnGap;
    let bankingY = startY;
    
    addText('Banking Details:', bankingX, bankingY, { fontSize: 11, fontStyle: 'bold', color: [30, 64, 175] });
    bankingY += 8;
    
    // Permanent banking details for Smart Universe
    const bankingDetails = {
      companyName: 'Smart Universe Communication and Information Technology',
      bankName: 'Saudi National Bank',
      accountNumber: '41000000080109',
      iban: 'SA3610000041000000080109',
      vatNumber: '300155266800003'
    };
    
    // Banking details with proper formatting and alignment
    const bankingItems = [
      { label: 'Company:', value: bankingDetails.companyName, bold: true, wrap: true },
      { label: 'Bank:', value: bankingDetails.bankName, bold: false, wrap: false },
      { label: 'Account:', value: bankingDetails.accountNumber, bold: false, wrap: false },
      { label: 'IBAN:', value: bankingDetails.iban, bold: false, wrap: false },
      { label: 'VAT:', value: bankingDetails.vatNumber, bold: false, wrap: false }
    ];
    
    bankingItems.forEach((item, index) => {
      const yPos = bankingY + (index * 5);
      const labelX = bankingX;
      const valueX = bankingX + 25;
      
      // Add label
      addText(item.label, labelX, yPos, { fontSize: 9, fontStyle: 'bold', color: [51, 51, 51] });
      
      // Add value with conditional formatting and text wrapping for company name
      if (item.wrap) {
        // For company name, use text wrapping to prevent cutoff
        const lines = pdf.splitTextToSize(item.value, rightColumnWidth - 30);
        lines.forEach((line: string, lineIndex: number) => {
          const lineY = yPos + (lineIndex * 4);
          addText(line, valueX, lineY, { fontSize: 9, fontStyle: 'bold', color: [51, 51, 51] });
        });
        // Update bankingY for next items to account for wrapped text
        bankingY += (lines.length - 1) * 4;
      } else {
        // For other items, use normal formatting
        const fontStyle = item.bold ? 'bold' : 'normal';
        addText(item.value, valueX, yPos, { fontSize: 9, fontStyle, color: [51, 51, 51] });
      }
    });
    
    // Update currentY to the highest point reached (accounting for wrapped text)
    const maxBankingY = bankingY + (bankingItems.length * 5) + 5;
    currentY = Math.max(currentY, maxBankingY);
    
    // Add "END OF QUOTATIONS" line before footer for professional boundary
    currentY += 10;
    
    // Check if we need a new page to avoid overlap with footer
    const endSectionHeight = 25; // Height needed for separator line + text + spacing
    const footerHeight = 26;
    const minGapFromFooter = 15; // Minimum gap between end section and footer
    
    if (currentY + endSectionHeight + minGapFromFooter > pageHeight - footerHeight) {
      addNewPage();
    }
    
    const endSectionWidth = 175; // Match the table width from addItemsTable
    const endSectionCenterX = (pageWidth - endSectionWidth) / 2;
    
    // Professional separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(endSectionCenterX, currentY, endSectionCenterX + endSectionWidth, currentY);
    currentY += 8;
    
    // END OF QUOTATION text - centered and professional with asterisks
    addText('**************** End of Quotation *******************', pageWidth / 2, currentY, { 
      fontSize: 11, 
      fontStyle: 'bold', 
      color: [156, 163, 175],
      align: 'center'
    });
    currentY += 8;
  };

  // Function to add professional footer with enhanced readability
  const addFooter = () => {
    const totalPages = pdf.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Calculate footer position to minimize white space
      const footerHeight = 26;
      const footerY = pageHeight - footerHeight;
      
      // Footer background with company colors
      pdf.setFillColor(30, 64, 175); // Company blue
      pdf.rect(0, footerY, pageWidth, footerHeight, 'F');
      
      // Add appropriately sized logo to footer
      try {
        pdf.addImage(SMART_UNIVERSE_LOGO_BASE64, 'JPEG', margin, footerY + 3, 14, 8); // Slightly smaller
      } catch (error) {
        console.warn('Could not add footer logo:', error);
      }
      
      // Company info in white text with improved readability
      addText('Smart Universe for Communications and Information Technology', pageWidth / 2, footerY + 7, { fontSize: 9, color: [255, 255, 255], align: 'center' }); // Increased from 8
              addText('Riyadh, Saudi Arabia | Phone Number: +966 550188288 | Email: info@smartuniit.com', pageWidth / 2, footerY + 11, { fontSize: 8, color: [255, 255, 255], align: 'center' }); // Increased from 7
      
      // Thank you message and page numbers with better sizing
      addText('Thank you for your business!', pageWidth / 2, footerY + 17, { fontSize: 9, fontStyle: 'bold', color: [255, 255, 255], align: 'center' }); // Increased from 8
      addText(`Page ${i} of ${totalPages}`, pageWidth - margin - 15, footerY + 17, { fontSize: 8, color: [255, 255, 255], align: 'right' });
    }
  };

  try {
    // Generate PDF content in proper order: Header -> Customer -> Items -> Totals -> Terms -> Footer
    addHeader();
    addCustomerSection();
    addItemsTable(); // This ensures totals ONLY come after complete table
    addTotalsSection(); // Totals come immediately after complete table
    addTermsAndConditions(); // Terms come after totals
    addScopeOfWork(); // Scope of work comes after terms
    addFooter(); // Footer is added to all pages

    // Return as blob
    const blob = pdf.output('blob');
    console.log('PDF Generator - Successfully generated multi-page PDF blob:', blob);
    return blob;
  } catch (error) {
    console.error('PDF Generator - Error generating PDF:', error);
    throw error;
  }
}

// Test function to verify PDF generation
export async function testPDFGeneration() {
  const testQuote = {
    id: 'test-quote-123',
    quoteNumber: '11-08-2025-1430', // New format: DD-MM-YYYY-HHMM
    customer: {
      name: 'Test Customer Company',
      address: '123 Test Street, Riyadh, Saudi Arabia',
      phone: '+966 50 123 4567',
      email: 'test@example.com'
    },
    lineItems: [
      {
        name: 'Web Development Services',
        quantity: 22,
        unitPrice: 5000,
        total: 110000
      },
      {
        name: 'Web Development Services', // Duplicate to test deduplication
        quantity: 2,
        unitPrice: 5000,
        total: 10000
      },
      {
        name: 'Mobile App Development',
        quantity: 1,
        unitPrice: 15000,
        total: 15000
      },
      {
        name: 'UI/UX Design',
        quantity: 3,
        unitPrice: 2000,
        total: 6000
      }
    ],
    created_at: new Date().toISOString()
  };

  try {
    const blob = await generateQuotationPDF(testQuote);
    console.log('PDF Generation Test - Success:', blob);
    return blob;
  } catch (error) {
    console.error('PDF Generation Test - Error:', error);
    throw error;
  }
    // RIGHT PART: Quotation Details Box - Positioned at top right corner with proper separation
    const quoteBoxWidth = 120;}