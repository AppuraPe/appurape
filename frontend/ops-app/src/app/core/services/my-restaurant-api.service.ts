import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MyBusinessResponse } from '../models/business.model';
import { MyBusinessApiService } from './my-business-api.service';

@Injectable({ providedIn: 'root' })
export class MyRestaurantApiService {
  private readonly myBusinessApi = inject(MyBusinessApiService);

  getMyRestaurant(): Observable<MyBusinessResponse> {
    return this.myBusinessApi.getMyBusiness();
  }

  updateMyRestaurant(request: FormData): Observable<MyBusinessResponse> {
    return this.myBusinessApi.updateMyBusiness(request);
  }
}
