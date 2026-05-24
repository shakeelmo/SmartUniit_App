import { QuotationSettings } from '../types/quotation';

const DEFAULT_COMPANY_INFO = {
  name: 'Smart Universe for Communications and Information Technology',
  nameAr: 'شركة الكون الذكي للاتصالات وتقنية المعلومات',
  address: 'King Abdulaziz Road, Riyadh',
  addressAr: 'طريق الملك عبدالعزيز، الرياض',
  phone: '+966 50 123 4567',
  email: 'info@smartuniit.com',
  crNumber: '1010973808',
  vatNumber: '314076518400003',
};

const looksCorruptedArabic = (value?: string | null) => {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;

  if (/[ØÙÚÛÜÝÞßàáâãäåæçÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×øùúûüýþÿ]/.test(trimmed)) {
    return true;
  }

  const hasArabic = /[\u0600-\u06FF]/.test(trimmed);
  const hasReplacement = /�/.test(trimmed);
  return hasReplacement || !hasArabic;
};

const preferArabic = (value: string | undefined, fallback: string) =>
  looksCorruptedArabic(value) ? fallback : value!.trim();

const preferText = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

export const getSafeCompanyInfo = (settings?: QuotationSettings | null) => {
  const companyInfo = settings?.companyInfo;

  return {
    name: preferText(companyInfo?.name, DEFAULT_COMPANY_INFO.name),
    nameAr: preferArabic(companyInfo?.nameAr, DEFAULT_COMPANY_INFO.nameAr),
    address: preferText(companyInfo?.address, DEFAULT_COMPANY_INFO.address),
    addressAr: preferArabic(companyInfo?.addressAr, DEFAULT_COMPANY_INFO.addressAr),
    phone: preferText(companyInfo?.phone, DEFAULT_COMPANY_INFO.phone),
    email: preferText(companyInfo?.email, DEFAULT_COMPANY_INFO.email),
    crNumber: preferText(companyInfo?.crNumber, DEFAULT_COMPANY_INFO.crNumber),
    vatNumber: preferText(companyInfo?.vatNumber, DEFAULT_COMPANY_INFO.vatNumber),
    bankingDetails: companyInfo?.bankingDetails,
  };
};
