import QRCode from 'qrcode';

interface VatQrPayload {
  sellerName: string;
  vatNumber: string;
  timestamp: Date | string;
  total: number;
  vatAmount: number;
}

// ZATCA / Zoho-compatible TLV encoding (basic format, 5 tags)
const tlv = (tag: number, value: string): string => {
  const bytes = new TextEncoder().encode(value);
  if (bytes.length > 255) {
    throw new Error(`TLV value for tag ${tag} exceeds 255 bytes`);
  }
  const out = new Uint8Array(bytes.length + 2);
  out[0] = tag;
  out[1] = bytes.length;
  out.set(bytes, 2);
  return String.fromCharCode(...out);
};

const formatAmount = (value: number): string => Number(value || 0).toFixed(2);

export const buildZatcaPayload = ({
  sellerName,
  vatNumber,
  timestamp,
  total,
  vatAmount,
}: VatQrPayload): string => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const iso = Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();

  return (
    tlv(1, sellerName) +
    tlv(2, vatNumber) +
    tlv(3, iso) +
    tlv(4, formatAmount(total)) +
    tlv(5, formatAmount(vatAmount))
  );
};

export const generateVatQrDataUrl = async (payload: VatQrPayload): Promise<string> => {
  const text = buildZatcaPayload(payload);
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 400,
  });
};
