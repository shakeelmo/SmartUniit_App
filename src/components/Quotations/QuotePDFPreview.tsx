import React, { useState } from 'react';
import { Quote } from '../../types/quotation';
import { generateQuotationPDF } from '../../utils/pdfGenerator';

// Saudi Riyal symbol from the GitHub repository
const SAR_SYMBOL = '﷼';

interface QuotePDFPreviewProps {
  quote: Quote;
  customer: any;
  settings?: any;
  onClose: () => void;
}

const QuotePDFPreview: React.FC<QuotePDFPreviewProps> = ({ quote, customer, settings, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const quoteWithCustomer = {
        ...quote,
        customer: customer
      };
      
      console.log('Generating PDF with data:', quoteWithCustomer);
      console.log('Line items:', quote.lineItems);
      console.log('Customer:', customer);
      
      const pdfBlob = await generateQuotationPDF(quoteWithCustomer, settings);
      
      console.log('PDF blob generated:', pdfBlob);
      
      // Create object URL from blob
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quotation-${quote.quoteNumber || quote.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-dark-900">Quotation Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Company Header */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-start justify-between">
            {/* Left Side: English Company Info */}
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-sm">SU</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-600">SMART UNIVERSE</h3>
                <p className="text-xs text-dark-500">
                  FOR COMMUNICATIONS AND INFORMATION TECHNOLOGY<br/>
                  King Abdulaziz Road, Riyadh | Phone Number: +966 550188288 | Email: info@smartuniit.com
                </p>
              </div>
            </div>
            
            {/* Right Side: Arabic Company Name and Quote Info */}
            <div className="text-right">
              <p className="text-sm text-dark-600 mb-3" dir="rtl">مؤسسة الكون الذكي للاتصالات و تقنية المعلومات</p>
              <h4 className="text-lg font-bold text-primary-600">QUOTATION</h4>
              <p className="text-sm text-dark-600">Quote #: {quote.quoteNumber || quote.id}</p>
              <p className="text-sm text-dark-600">Date: {new Date(quote.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold text-dark-900 mb-2">Bill To:</h4>
            <div className="text-sm text-dark-600">
              <p><strong>Name:</strong> {customer?.name || 'N/A'}</p>
              <p><strong>Address:</strong> {customer?.address || 'N/A'}</p>
              <p><strong>Phone:</strong> {customer?.phone || 'N/A'}</p>
              <p><strong>Email:</strong> {customer?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="text-right">
            <h4 className="font-semibold text-dark-900 mb-2">Quote Details:</h4>
            <div className="text-sm text-dark-600">
              <p><strong>Valid Until:</strong> {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : '30 days'}</p>
              <p><strong>Status:</strong> {quote.status || 'Draft'}</p>
              <p><strong>Currency:</strong> {quote.currency || 'SAR'}</p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-6">
          <h4 className="font-semibold text-dark-900 mb-3">Line Items:</h4>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-primary-50">
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">
                    S#
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                    Item
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                    Description / الوصف
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">
                    Qty / الكمية
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">
                    Unit Price / سعر الوحدة (${SAR_SYMBOL})
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">
                    Total / المجموع (${SAR_SYMBOL})
                  </th>
                </tr>
              </thead>
              <tbody>
                {quote.lineItems.map((item, index) => {
                  // Calculate total if not present
                  const itemTotal = item.total || (item.quantity * item.unitPrice) || 0;
                  
                  return (
                    <tr key={item.id || index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                        {index + 1}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm">
                        {item.code || item.itemCode || item.sku || item.partNumber || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-dark-900">{item.description || item.name}</p>
                          {item.descriptionAr && <p className="text-dark-600 text-xs mt-1" dir="rtl">{item.descriptionAr}</p>}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-sm">
                        ${SAR_SYMBOL} {item.unitPrice?.toLocaleString() || '0'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right text-sm font-medium">
                        ${SAR_SYMBOL} {itemTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="mb-6">
          <div className="flex justify-end">
            <div className="w-80">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-dark-600">Subtotal / المجموع الفرعي:</span>
                <span className="text-sm font-medium flex items-center">
                  ${SAR_SYMBOL} {quote.lineItems.reduce((sum, item) => {
                    const itemTotal = item.total || (item.quantity * item.unitPrice) || 0;
                    return sum + itemTotal;
                  }, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-dark-600">VAT (15%):</span>
                <span className="text-sm font-medium flex items-center">
                  ${SAR_SYMBOL} {(quote.lineItems.reduce((sum, item) => {
                    const itemTotal = item.total || (item.quantity * item.unitPrice) || 0;
                    return sum + itemTotal;
                  }, 0) * 0.15).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-300">
                <span className="text-lg font-bold text-dark-900">Total / المجموع الكلي:</span>
                <span className="text-lg font-bold text-primary-600 flex items-center">
                  ${SAR_SYMBOL} {(quote.lineItems.reduce((sum, item) => {
                    const itemTotal = item.total || (item.quantity * item.unitPrice) || 0;
                    return sum + itemTotal;
                  }, 0) * 1.15).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        {quote.terms && (
          <div className="mb-6">
            <h4 className="font-semibold text-dark-900 mb-2">Terms & Conditions:</h4>
            <div className="text-sm text-dark-600 bg-gray-50 p-4 rounded-lg">
              {quote.terms}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-dark-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotePDFPreview;