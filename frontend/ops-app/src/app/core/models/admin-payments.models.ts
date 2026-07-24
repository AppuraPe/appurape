export interface AdminPaymentListItem {
  orderId: string;
  orderCode: string;
  customerName: string;
  businessName: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  total: number;
  createdAtUtc: string;
}

export interface AdminPaymentDetailItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface AdminPaymentDetail {
  orderId: string;
  orderCode: string;
  customerName: string;
  customerPhone?: string | null;
  businessName: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentReference?: string | null;
  paymentProofUrl?: string | null;
  createdAtUtc: string;
  items: AdminPaymentDetailItem[];
}
