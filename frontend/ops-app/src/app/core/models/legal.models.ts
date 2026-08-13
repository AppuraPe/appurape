export interface LegalDocument {
  id: string; type: string; audience: string; slug: string; version: string; title: string;
  contentMarkdown: string; contentHash: string; status: string; effectiveAtUtc?: string | null; publishedAtUtc?: string | null;
}
export interface LegalConsentStatus { isRequired: boolean; requiredDocuments: LegalDocument[]; acceptedDocumentIds: string[]; }
export interface AccountDeletionStatus { status: string; scheduledForUtc?: string | null; canCancel: boolean; }
