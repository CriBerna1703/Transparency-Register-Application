import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getLobbyists(): Observable<any> {
    return this.http.get(`${this.apiUrl}/lobbyists`);
  }

  getLobbyistDetails(lobbyistId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/lobbyists/${lobbyistId}/details`);
  }

  getAllLobbyistsDetails(lobbyistIds: string[]): Observable<any[]> {
    const params = new HttpParams().set('lobbyist_ids', lobbyistIds.join(','));
    return this.http.get<any[]>(`${this.apiUrl}/allLobbyists`, { params });
  }

  async getLobbyistsDetailsSequentially(lobbyistIds: string[], batchSize = 300): Promise<any[]> {
    const results: any[] = [];

    for (let i = 0; i < lobbyistIds.length; i += batchSize) {
      const batch = lobbyistIds.slice(i, i + batchSize);

      try {
        const batchResult = await firstValueFrom(this.getAllLobbyistsDetails(batch));
        results.push(...batchResult);
      } catch (error) {
        console.error(`Errore durante il caricamento del batch ${i / batchSize + 1}:`, error);
      }
    }

    return results;
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

  getCabinetDetails(cabinet_id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/cabinets/${cabinet_id}`);
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
    return this.http.post(`${this.apiUrl}/meetings/filter`, filters);
  }

  getLobbyistFieldOfInterest(lobbyistId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/fields/lobbyist/${lobbyistId}`);
  }
  
  getMeetingByLobbyistAndNumber(lobbyistId: string, meetingNumber: string): Observable<any> {
    const filters = {
      lobbyist_ids: [lobbyistId],
      meeting_number: meetingNumber
    };
    return this.http.post(`${this.apiUrl}/meetings/filter`, filters);
  }
  
  getSimilarities(payload: { startDate: string; endDate: string; lobbyist_ids: string[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}/similarities`, payload);
  }
  
}
