import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CancelCommunityRequestRequest,
  CommunityAdminOverviewResponse,
  CommunityCollaboratorResponse,
  CommunityRequestDetailResponse,
  CommunityRequestListItemResponse,
  CommunityRequestMatchResponse,
  CommunityRequestQueryRequest,
  CommunityRouteResponse,
  CreateCommunityRequestRequest,
  RateCommunityCollaboratorRequest,
  SelectCommunityRequestApplicationRequest,
  UpdateCommunityCollaboratorRequest,
  UpsertCommunityRouteRequest,
} from '../models/community.models';

const COMMUNITY_AVAILABILITY_STATUS_MAP: Record<string, number> = {
  Disconnected: 0,
  Available: 1,
  Busy: 2,
};

const COMMUNITY_REQUEST_TYPE_MAP: Record<string, number> = {
  MarketPurchase: 0,
  Errand: 1,
  ProductPickup: 2,
  PackageDelivery: 3,
  CompensatedFavor: 4,
};

@Injectable({ providedIn: 'root' })
export class CommunityApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/community`;
  private readonly adminBaseUrl = `${environment.apiBaseUrl}/api/admin/community`;

  getMyCollaborator(): Observable<CommunityCollaboratorResponse> {
    return this.http.get<CommunityCollaboratorResponse>(`${this.baseUrl}/collaborator/me`);
  }

  updateMyCollaborator(request: UpdateCommunityCollaboratorRequest): Observable<CommunityCollaboratorResponse> {
    return this.http.patch<CommunityCollaboratorResponse>(`${this.baseUrl}/collaborator/me`, {
      ...request,
      availabilityStatus:
        COMMUNITY_AVAILABILITY_STATUS_MAP[request.availabilityStatus] ?? request.availabilityStatus,
    });
  }

  getMyRoutes(): Observable<CommunityRouteResponse[]> {
    return this.http.get<CommunityRouteResponse[]>(`${this.baseUrl}/routes/me`);
  }

  createRoute(request: UpsertCommunityRouteRequest): Observable<CommunityRouteResponse> {
    return this.http.post<CommunityRouteResponse>(`${this.baseUrl}/routes/me`, request);
  }

  updateRoute(routeId: string, request: UpsertCommunityRouteRequest): Observable<CommunityRouteResponse> {
    return this.http.put<CommunityRouteResponse>(`${this.baseUrl}/routes/me/${routeId}`, request);
  }

  getRequests(filters: CommunityRequestQueryRequest = {}): Observable<CommunityRequestListItemResponse[]> {
    let params = new HttpParams();
    if (filters.q?.trim()) {
      params = params.set('q', filters.q.trim());
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }
    if (filters.mine) {
      params = params.set('mine', String(filters.mine));
    }

    return this.http.get<CommunityRequestListItemResponse[]>(`${this.baseUrl}/requests`, { params });
  }

  createRequest(request: CreateCommunityRequestRequest): Observable<CommunityRequestDetailResponse> {
    return this.http.post<CommunityRequestDetailResponse>(`${this.baseUrl}/requests`, {
      ...request,
      type: COMMUNITY_REQUEST_TYPE_MAP[request.type] ?? request.type,
    });
  }

  getRequestById(requestId: string): Observable<CommunityRequestDetailResponse> {
    return this.http.get<CommunityRequestDetailResponse>(`${this.baseUrl}/requests/${requestId}`);
  }

  getRequestMatches(requestId: string): Observable<CommunityRequestMatchResponse[]> {
    return this.http.get<CommunityRequestMatchResponse[]>(`${this.baseUrl}/requests/${requestId}/matches`);
  }

  acceptRequest(requestId: string): Observable<CommunityRequestDetailResponse> {
    return this.http.patch<CommunityRequestDetailResponse>(`${this.baseUrl}/requests/${requestId}/accept`, {});
  }

  applyToRequest(requestId: string): Observable<CommunityRequestDetailResponse> {
    return this.http.patch<CommunityRequestDetailResponse>(`${this.baseUrl}/requests/${requestId}/apply`, {});
  }

  selectApplication(
    requestId: string,
    request: SelectCommunityRequestApplicationRequest,
  ): Observable<CommunityRequestDetailResponse> {
    return this.http.patch<CommunityRequestDetailResponse>(`${this.baseUrl}/requests/${requestId}/select`, request);
  }

  startRequest(requestId: string): Observable<CommunityRequestDetailResponse> {
    return this.http.patch<CommunityRequestDetailResponse>(`${this.baseUrl}/requests/${requestId}/start`, {});
  }

  completeRequest(requestId: string, request: FormData): Observable<CommunityRequestDetailResponse> {
    return this.http.patch<CommunityRequestDetailResponse>(`${this.baseUrl}/requests/${requestId}/complete`, request);
  }

  confirmRequest(requestId: string): Observable<CommunityRequestDetailResponse> {
    return this.http.patch<CommunityRequestDetailResponse>(`${this.baseUrl}/requests/${requestId}/confirm`, {});
  }

  cancelRequest(requestId: string, request: CancelCommunityRequestRequest): Observable<CommunityRequestDetailResponse> {
    return this.http.patch<CommunityRequestDetailResponse>(`${this.baseUrl}/requests/${requestId}/cancel`, request);
  }

  rateCollaborator(requestId: string, request: RateCommunityCollaboratorRequest): Observable<CommunityRequestDetailResponse> {
    return this.http.patch<CommunityRequestDetailResponse>(`${this.baseUrl}/requests/${requestId}/rating`, request);
  }

  getAdminOverview(): Observable<CommunityAdminOverviewResponse> {
    return this.http.get<CommunityAdminOverviewResponse>(`${this.adminBaseUrl}/overview`);
  }

  getAdminCollaborators(): Observable<CommunityCollaboratorResponse[]> {
    return this.http.get<CommunityCollaboratorResponse[]>(`${this.adminBaseUrl}/collaborators`);
  }

  getAdminRequests(): Observable<CommunityRequestListItemResponse[]> {
    return this.http.get<CommunityRequestListItemResponse[]>(`${this.adminBaseUrl}/requests`);
  }
}
