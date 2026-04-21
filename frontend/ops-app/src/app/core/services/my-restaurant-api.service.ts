import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MyRestaurantResponse, UpdateMyRestaurantRequest } from '../models/restaurant.models';

@Injectable({ providedIn: 'root' })
export class MyRestaurantApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/my/restaurant`;

  getMyRestaurant(): Observable<MyRestaurantResponse> {
    return this.http.get<MyRestaurantResponse>(this.baseUrl);
  }

  updateMyRestaurant(request: UpdateMyRestaurantRequest): Observable<MyRestaurantResponse> {
    return this.http.put<MyRestaurantResponse>(this.baseUrl, request);
  }
}
