export interface AdminCommissionSummary {
  pendingAmount: number;
  availableAmount: number;
  settledAmount: number;
  cashDebtAmount: number;
  pendingCount: number;
  availableCount: number;
  cashDebtCount: number;
}

export interface FinancialMovement {
  id: string;
  orderId?: string | null;
  communityRequestId?: string | null;
  restaurantId?: string | null;
  restaurantName?: string | null;
  userId?: string | null;
  userFullName?: string | null;
  type: string;
  status: string;
  amount: number;
  currencyCode: string;
  occurredAtUtc: string;
  availableAtUtc?: string | null;
  settledAtUtc?: string | null;
  reference?: string | null;
  description?: string | null;
}

export interface SettlementItem {
  id: string;
  financialMovementId: string;
  movementType: string;
  grossAmount: number;
  commissionAmount: number;
  serviceFeeAmount: number;
  netAmount: number;
}

export interface SettlementBatch {
  id: string;
  targetType: string;
  businessId?: string | null;
  businessName?: string | null;
  driverId?: string | null;
  collaboratorUserId?: string | null;
  collaboratorName?: string | null;
  periodStartUtc: string;
  periodEndUtc: string;
  grossAmount: number;
  commissionAmount: number;
  serviceFeeAmount: number;
  netAmount: number;
  status: string;
  createdAtUtc: string;
  confirmedAtUtc?: string | null;
  notes?: string | null;
  items: SettlementItem[];
}

export interface CreateSettlementBatchRequest {
  targetType: number;
  businessId?: string | null;
  driverId?: string | null;
  collaboratorUserId?: string | null;
  periodStartUtc: string;
  periodEndUtc: string;
  financialMovementIds: string[];
  notes?: string | null;
}

export interface CollaboratorVerification {
  id: string;
  userId: string;
  userFullName: string;
  status: string;
  verificationFeeAmount: number;
  submittedAtUtc: string;
  reviewedAtUtc?: string | null;
  reviewedByAdminId?: string | null;
  rejectReason?: string | null;
  expiresAtUtc?: string | null;
  hasProfilePhoto: boolean;
  profilePhotoUrl?: string | null;
  hasIdentityDocument: boolean;
  hasLiveSelfie: boolean;
  liveSelfieCapturedAtUtc?: string | null;
}

export interface RejectCollaboratorVerificationRequest {
  reason: string;
}
