import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Quote, Service, QuotationSettings } from '../types/quotation';
import { Customer } from '../types';

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Web Development',
    nameAr: 'تطوير المواقع',
    description: 'Custom website development services',
    descriptionAr: 'خدمات تطوير المواقع المخصصة',
    defaultPrice: 5000,
    category: 'Development',
    isActive: true,
  },
  {
    id: '2',
    name: 'Mobile App Development',
    nameAr: 'تطوير تطبيقات الجوال',
    description: 'iOS and Android app development',
    descriptionAr: 'تطوير تطبيقات iOS و Android',
    defaultPrice: 8000,
    category: 'Development',
    isActive: true,
  },
];

export function useQuotations() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<QuotationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchQuotes(),
        fetchCustomers(),
        fetchServices(),
        fetchSettings(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      const { quotations } = await api.getQuotations();
      setQuotes(quotations.map((q: any) => {
        const rawLineItems = q.lineItems || q.line_items || [];

        const lineItems = rawLineItems.map((item: any) => {
          const quantity = Number(item.quantity) || 0;
          const unitPrice = Number(item.unit_price ?? item.unitPrice) || 0;
          const itemTotal = Number(item.total_price ?? item.total) || (quantity * unitPrice);
          const description = item.description || item.name || '';

          return {
            id: item.id,
            serviceId: item.service_id || item.serviceId || '',
            itemCode: item.item_code || item.itemCode || item.code || item.sku || item.partNumber || '',
            name: item.name || description,
            nameAr: item.nameAr || item.name_ar || '',
            description,
            descriptionAr: item.descriptionAr || item.description_ar || '',
            quantity,
            unit: item.unit || 'piece',
            customUnit: item.custom_unit || item.customUnit || '',
            unitPrice,
            total: itemTotal,
          };
        });

        const derivedSubtotal = lineItems.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
        const subtotal = Number(q.subtotal ?? q.sub_total) || derivedSubtotal;
        const discountValue = Number(q.discount_value ?? q.discountValue) || 0;
        const discountAmount = Number(q.discount_amount ?? q.discountAmount) || 0;
        const vatRate = Number(q.vat_rate ?? q.vatRate) || 15;
        const computedVatBase = Math.max(subtotal - discountAmount, 0);
        const vatAmount = Number(q.vat_amount ?? q.vatAmount) || (computedVatBase * vatRate / 100);
        const total = Number(q.total_amount ?? q.total ?? q.amount) || (computedVatBase + vatAmount);
        const notes = q.notes ?? q.terms ?? '';
        const terms = q.terms ?? q.terms_text ?? q.notes ?? '';
        const scopeOfWork = q.scope_of_work || q.scopeOfWork || '';
        const scopeOfWorkAr = q.scope_of_work_ar || q.scopeOfWorkAr || '';
        const pointOfContact = {
          title: q.point_of_contact_title || q.pointOfContactTitle || 'Smart Universe : Primary Contact of this Project',
          name: q.point_of_contact_name || q.pointOfContactName || '',
          designation: q.point_of_contact_designation || q.pointOfContactDesignation || '',
          mobileNumber: q.point_of_contact_mobile || q.pointOfContactMobile || '',
          emailAddress: q.point_of_contact_email || q.pointOfContactEmail || '',
        };
        const quoteNumber = q.quotation_number || q.quote_number || q.quoteNumber || (q.id ? `Q-${new Date().getFullYear()}-${String(q.id).padStart(4, '0')}` : 'DRAFT');

        return {
          id: q.id,
          quoteNumber,
          customerId: String(q.customer_id || q.customerId || ''),
          status: q.status || 'draft',
          lineItems,
          subtotal,
          discountType: q.discount_type || q.discountType || 'percentage',
          discountValue,
          discountAmount,
          vatRate,
          vatAmount,
          total,
          validUntil: q.valid_until ? new Date(q.valid_until) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes,
          notesAr: q.notesAr || q.notes_ar || '',
          scopeOfWork,
          scopeOfWorkAr,
          pointOfContact,
          terms,
          termsAr: q.termsAr || q.terms_ar || '',
          assignedTo: q.assignedTo || q.assigned_to || '',
          createdBy: q.created_by || q.createdBy || '',
          createdAt: new Date(q.created_at || q.createdAt || Date.now()),
          updatedAt: new Date(q.updated_at || q.updatedAt || Date.now()),
        };
      }));
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { customers } = await api.getCustomers();
      setCustomers(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchServices = async () => {
    // Remove supabase logic, use mockServices for now
    setServices(mockServices);
  };

  const fetchSettings = async () => {
    try {
      const response = await api.getCompanySettings() as any;
      const settings = response.settings;
      setSettings({
        vatRate: settings.vatRate || 15,
        companyInfo: {
          name: settings.name,
          nameAr: settings.nameAr,
          address: settings.address,
          addressAr: settings.addressAr,
          phone: settings.phone,
          email: settings.email,
          crNumber: settings.crNumber,
          vatNumber: settings.vatNumber,
          bankingDetails: settings.bankingDetails,
        },
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Fallback to default settings
      setSettings({
        vatRate: 15,
        companyInfo: {
          name: 'Smart Universe Communication and Information Technology',
          nameAr: 'مؤسسة الكون الذكي للاتصالات و تقنية المعلومات',
          address: 'Office # 3 ln, Al Dirah Dist, P.O.Box 12633, Riyadh - 11461 KSA',
          addressAr: 'مكتب رقم 3، حي الديرة، ص.ب 12633، الرياض 11461، المملكة العربية السعودية',
          phone: '011-4917295',
          email: 'info@smartuniit.com',
          crNumber: '1010123456',
          vatNumber: '300155266800003',
          bankingDetails: {
            bankName: 'Saudi National Bank',
            iban: 'SA3610000041000000080109',
            accountNumber: '41000000080109'
          },
        },
      });
    }
  };

  const addQuote = async (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'quoteNumber'>) => {
    try {
      const validCustomerId = customers.some(customer => customer.id === String(quote.customerId))
        ? String(quote.customerId)
        : null;

      const payload = {
        proposal_id: null,
        customerId: validCustomerId,
        customer_id: validCustomerId,
        amount: quote.total,
        total_amount: quote.total,
        total: quote.total,
        currency: quote.currency || 'SAR',
        valid_until: quote.validUntil,
        terms: quote.terms ?? quote.notes ?? '',
        notes: quote.notes ?? quote.terms ?? '',
        scopeOfWork: quote.scopeOfWork ?? '',
        scopeOfWorkAr: quote.scopeOfWorkAr ?? '',
        pointOfContactTitle: quote.pointOfContact?.title ?? 'Smart Universe : Primary Contact of this Project',
        point_of_contact_title: quote.pointOfContact?.title ?? 'Smart Universe : Primary Contact of this Project',
        pointOfContactName: quote.pointOfContact?.name ?? '',
        point_of_contact_name: quote.pointOfContact?.name ?? '',
        pointOfContactDesignation: quote.pointOfContact?.designation ?? '',
        point_of_contact_designation: quote.pointOfContact?.designation ?? '',
        pointOfContactMobile: quote.pointOfContact?.mobileNumber ?? '',
        point_of_contact_mobile: quote.pointOfContact?.mobileNumber ?? '',
        pointOfContactEmail: quote.pointOfContact?.emailAddress ?? '',
        point_of_contact_email: quote.pointOfContact?.emailAddress ?? '',
        lineItems: quote.lineItems,
        subtotal: quote.subtotal,
        discountType: quote.discountType,
        discountValue: quote.discountValue,
        discountAmount: quote.discountAmount,
        vatRate: quote.vatRate,
        vatAmount: quote.vatAmount,
      };
      const { quotation } = await api.createQuotation(payload);
      await fetchQuotes();
      return quotation;
    } catch (error) {
      throw error;
    }
  };

  const updateQuote = async (id: string, updates: Partial<Quote>) => {
    try {
      console.log('updateQuote called with updates:', updates);
      
      // Get the total amount from updates with multiple fallbacks
      let amount = updates.total || (updates as any).total_amount || (updates as any).amount || 0;
      
      console.log('Raw amount value:', amount, 'Type:', typeof amount);
      
      // Convert to number if it's a string
      if (typeof amount === 'string') {
        amount = parseFloat(amount) || 0;
      }
      
      // Ensure it's a number
      if (typeof amount !== 'number' || isNaN(amount)) {
        console.log('Amount is not a valid number, defaulting to 0');
        amount = 0;
      }
      
      console.log('Processed amount value:', amount, 'Type:', typeof amount);
      
      // Only reject if it's explicitly negative
      if (amount < 0) {
        throw new Error('Total amount cannot be negative.');
      }
      
      const validCustomerId = updates.customerId !== undefined
        ? (customers.some(customer => customer.id === String(updates.customerId))
            ? String(updates.customerId)
            : null)
        : undefined;

      const normalizedLineItems = Array.isArray(updates.lineItems)
        ? updates.lineItems.map((item: any) => ({
            itemCode: item.itemCode || item.item_code || item.code || item.sku || item.partNumber || '',
            description: item.description || item.name || '',
            quantity: Number(item.quantity) || 0,
            unit: item.unit || 'piece',
            customUnit: item.customUnit || item.custom_unit || '',
            unitPrice: Number(item.unitPrice ?? item.unit_price) || 0,
            total: Number(item.total ?? item.total_price) || 0,
          }))
        : [];

      const normalizedValidUntil = updates.validUntil
        ? new Date(updates.validUntil).toISOString()
        : undefined;

      const payload = {
        customer_id: validCustomerId,
        amount: amount,
        total_amount: amount,
        currency: updates.currency || 'SAR',
        point_of_contact_title: updates.pointOfContact?.title,
        point_of_contact_name: updates.pointOfContact?.name,
        point_of_contact_designation: updates.pointOfContact?.designation,
        point_of_contact_mobile: updates.pointOfContact?.mobileNumber,
        point_of_contact_email: updates.pointOfContact?.emailAddress,
        valid_until: normalizedValidUntil,
        terms: updates.terms ?? updates.notes ?? '',
        notes: updates.notes ?? '',
        scopeOfWork: updates.scopeOfWork ?? '',
        scopeOfWorkAr: updates.scopeOfWorkAr ?? '',
        status: updates.status,
        subtotal: Number(updates.subtotal) || 0,
        discountType: updates.discountType,
        discountValue: Number(updates.discountValue) || 0,
        discountAmount: Number(updates.discountAmount) || 0,
        vatRate: Number(updates.vatRate) || 15,
        vatAmount: Number(updates.vatAmount) || 0,
        lineItems: normalizedLineItems,
      };
      
      console.log('Updating quotation with payload:', payload);
      const { quotation } = await api.updateQuotation(id, payload);
      await fetchQuotes();
      return quotation;
    } catch (error) {
      console.error('Error updating quotation:', error);
      throw error;
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      await api.deleteQuotation(id);
      await fetchQuotes();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      throw error;
    }
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === id 
        ? { ...customer, ...updates, updatedAt: new Date() }
        : customer
    ));
  };

  const duplicateQuote = async (quoteId: string) => {
    const originalQuote = quotes.find(q => q.id === quoteId);
    if (originalQuote) {
      const duplicatedQuote = {
        ...originalQuote,
        status: 'draft' as const,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };
      delete (duplicatedQuote as any).id;
      delete (duplicatedQuote as any).quoteNumber;
      delete (duplicatedQuote as any).createdAt;
      delete (duplicatedQuote as any).updatedAt;
      return await addQuote(duplicatedQuote);
    }
  };

  return {
    quotes,
    customers,
    services,
    settings,
    isLoading,
    addQuote,
    updateQuote,
    deleteQuote,
    duplicateQuote,
    addCustomer,
    updateCustomer,
    refetch: fetchAllData,
  };
}
