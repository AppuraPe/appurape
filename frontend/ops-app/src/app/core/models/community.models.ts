export interface CommunityCollaboratorResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  isAvailable: boolean;
  availabilityStatus: string;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  availabilityRadiusKm: number;
  availableFromUtc?: string | null;
  availableUntilUtc?: string | null;
  trustScore: number;
  completedCollaborations: number;
  collaborationRating: number;
  communityAcceptanceRate: number;
  communityCancellationRate: number;
  collaborationLevel: string;
  collaboratorApprovalStatus?: string | null;
  isIdentityVerified: boolean;
  isPhoneVerified: boolean;
  identityDocumentNumber?: string | null;
  userStatus: string;
}

export interface CommunityRouteResponse {
  id: string;
  originLabel: string;
  originLatitude: number;
  originLongitude: number;
  destinationLabel: string;
  destinationLatitude: number;
  destinationLongitude: number;
  estimatedMinutes: number;
  deviationRadiusKm: number;
  isActive: boolean;
  startsAtUtc?: string | null;
  endsAtUtc?: string | null;
}

export interface CommunityRequestListItemResponse {
  orderId?: string | null;
  sourceType?: string;
  id: string;
  createdByUserId: string;
  createdByFullName: string;
  type: string;
  title: string;
  originLabel: string;
  destinationLabel: string;
  compensationAmount: number;
  estimatedPurchaseAmount: number;
  favorPlatformCommissionAmount: number;
  collaboratorEarningAmount: number;
  totalClientAmount: number;
  deadlineUtc?: string | null;
  status: string;
  isMine: boolean;
  isAssignedToMe: boolean;
  matchScore: number;
  createdAtUtc: string;
}

export interface CommunityRequestDetailResponse {
  orderId?: string | null;
  sourceType?: string;
  id: string;
  createdByUserId: string;
  createdByFullName: string;
  type: string;
  title: string;
  description: string;
  originLabel: string;
  originLatitude?: number | null;
  originLongitude?: number | null;
  destinationLabel: string;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  compensationAmount: number;
  estimatedPurchaseAmount: number;
  favorPlatformCommissionAmount: number;
  collaboratorEarningAmount: number;
  totalClientAmount: number;
  platformRevenueAmount: number;
  deadlineUtc?: string | null;
  status: string;
  assignedCollaboratorId?: string | null;
  assignedCollaboratorName?: string | null;
  assignedRouteId?: string | null;
  matchScore: number;
  confirmationCode?: string | null;
  pickupCode?: string | null;
  pickupConfirmedAtUtc?: string | null;
  proofImageUrl?: string | null;
  collaboratorRating?: number | null;
  collaboratorFeedback?: string | null;
  acceptedAtUtc?: string | null;
  startedAtUtc?: string | null;
  deliveredAtUtc?: string | null;
  clientConfirmedAtUtc?: string | null;
  cancelledAtUtc?: string | null;
  cancellationReason?: string | null;
  applications: CommunityRequestApplicationResponse[];
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface CommunityRequestMatchResponse {
  collaboratorId: string;
  fullName: string;
  availabilityStatus: string;
  isAvailable: boolean;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  availabilityRadiusKm: number;
  trustScore: number;
  completedCollaborations: number;
  collaborationRating: number;
  communityAcceptanceRate: number;
  communityCancellationRate: number;
  collaborationLevel: string;
  hasRouteMatch: boolean;
  distanceKm: number;
  estimatedMinutes: number;
  matchScore: number;
  existingApplicationId?: string | null;
  applicationStatus?: string | null;
}

export interface CommunityRequestApplicationResponse {
  applicationId: string;
  collaboratorId: string;
  fullName: string;
  availabilityStatus: string;
  isAvailable: boolean;
  trustScore: number;
  completedCollaborations: number;
  collaborationRating: number;
  communityAcceptanceRate: number;
  communityCancellationRate: number;
  collaborationLevel: string;
  collaboratorApprovalStatus?: string | null;
  isIdentityVerified: boolean;
  isPhoneVerified: boolean;
  hasRouteMatch: boolean;
  distanceKm: number;
  estimatedMinutes: number;
  matchScore: number;
  status: string;
  appliedAtUtc: string;
  routeId?: string | null;
}

export interface CommunityAdminCollaboratorRankingResponse {
  collaboratorId: string;
  fullName: string;
  email: string;
  availabilityStatus: string;
  collaborationLevel: string;
  trustScore: number;
  collaborationRating: number;
  completedCollaborations: number;
  matchScore: number;
}

export interface CommunityAdminOverviewResponse {
  activeCollaboratorsCount: number;
  availableCollaboratorsCount: number;
  publishedRequestsCount: number;
  acceptedRequestsCount: number;
  inProcessRequestsCount: number;
  deliveredRequestsCount: number;
  cancelledRequestsCount: number;
  successRate: number;
  averageTrustScore: number;
  topCollaborators: CommunityAdminCollaboratorRankingResponse[];
}

export interface UpdateCommunityCollaboratorRequest {
  isAvailable: boolean;
  availabilityStatus: string;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  availabilityRadiusKm: number;
  availableFromUtc?: string | null;
  availableUntilUtc?: string | null;
}

export interface UpsertCommunityRouteRequest {
  originLabel: string;
  originLatitude: number;
  originLongitude: number;
  destinationLabel: string;
  destinationLatitude: number;
  destinationLongitude: number;
  estimatedMinutes: number;
  deviationRadiusKm: number;
  isActive: boolean;
  startsAtUtc?: string | null;
  endsAtUtc?: string | null;
}

export interface CreateCommunityRequestRequest {
  type: string;
  title: string;
  description: string;
  originLabel: string;
  originLatitude?: number | null;
  originLongitude?: number | null;
  destinationLabel: string;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  compensationAmount: number;
  estimatedPurchaseAmount?: number;
  deadlineUtc?: string | null;
}

export interface CommunityRequestQuoteResponse {
  compensationAmount: number;
  estimatedPurchaseAmount: number;
  favorPlatformCommissionAmount: number;
  collaboratorEarningAmount: number;
  totalClientAmount: number;
  platformRevenueAmount: number;
}

export interface CommunityRequestQueryRequest {
  q?: string;
  status?: string;
  type?: string;
  mine?: boolean;
  view?: string;
}

export interface CancelCommunityRequestRequest {
  reason?: string | null;
}

export interface RateCommunityCollaboratorRequest {
  rating: number;
  comment?: string | null;
}

export interface SelectCommunityRequestApplicationRequest {
  applicationId: string;
}
