import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getLobbyists(): Observable<any> {
    return this.http.get(`${this.apiUrl}/lobbyists`);
  }

  getLobbyistDetails(lobbyistId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/lobbyists/${lobbyistId}/details`);
  }

  getFields(): Observable<any> {
    return this.http.get(`${this.apiUrl}/fields`);
  }

  getDirectorates(): Observable<any> {
    return this.http.get(`${this.apiUrl}/directorates`);
  }

  getDirectorateDetails(directorate_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/directorates/${directorate_id}`);
  }

  getCommissioners(): Observable<any> {
    return this.http.get(`${this.apiUrl}/commission-representatives`);
  }

  getCommissionerDetails(commissioner_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/commission-representatives/${commissioner_id}`);
  }

  getMeetings(lobbyistId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/meetings/${lobbyistId}`);
  }

  getFilteredMeetings(filters: any): Observable<any> {
    let params = new HttpParams();

    if (filters.date_from) {
      params = params.set('date_from', filters.date_from);
    }
    if (filters.date_to) {
      params = params.set('date_to', filters.date_to);
    }
    if (filters.filter_type) {
      params = params.set('filter_type', filters.filter_type);
    }
    if (filters.keywords && filters.keywords.length > 0) {
      filters.keywords.forEach((keyword: string) => {
        params = params.append('keywords', keyword);
      });
    }
    if (filters.lobbyist_ids && filters.lobbyist_ids.length > 0) {
      filters.lobbyist_ids.forEach((id: string) => {
        params = params.append('lobbyist_ids', id.toString());
      });
    }
    if (filters.representative_ids && filters.representative_ids.length > 0) {
      filters.representative_ids.forEach((id: number) => {
        params = params.append('representative_ids', id.toString());
      });
    }
    if (filters.directorate_ids && filters.directorate_ids.length > 0) {
      filters.directorate_ids.forEach((id: number) => {
        params = params.append('directorate_ids', id.toString());
      });
    }
    if (filters.field_ids && filters.field_ids.length > 0) {
      filters.field_ids.forEach((id: number) => {
        params = params.append('field_ids', id.toString());
      });
    }

    return this.http.get(`${this.apiUrl}/meetings/filter`, { params });
  }

  getMeetingByLobbyistAndNumber(lobbyistId: string, meetingNumber: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/meetings/${lobbyistId}/${meetingNumber}`);
  }
}
