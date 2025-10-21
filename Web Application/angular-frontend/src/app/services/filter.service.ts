import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { DataService } from './data.service';
import { CsvService } from './csv.service';
import { Subscription, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private filtersSubject = new BehaviorSubject<any>({});
  private meetingsSubject = new BehaviorSubject<any[]>([]);
  private overviewSubject = new BehaviorSubject<any[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private currentRequest?: Subscription;
  public isCsvReady: boolean = false;

  filters$ = this.filtersSubject.asObservable();
  meetings$ = this.meetingsSubject.asObservable();
  overview$ = this.overviewSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  meetingCsvData: any;
  lobbyistCsvData: any;

  constructor(private dataService: DataService, private csvService: CsvService) {}

  // Set filters and update meetings
  setFilters(filters: any) {
    this.filtersSubject.next(filters);
    this.fetchMeetings(filters);
  }

  // Retrieve filtered meetings from backend
  private fetchMeetings(filters: any) {
    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
    }
  
    this.loadingSubject.next(true);
  
    this.currentRequest = this.dataService.getFilteredMeetings(filters).subscribe(
      (meetings) => {
        this.overviewSubject.next(meetings);
        this.loadingSubject.next(false);
      },
      (error) => {
        console.error('Error retrieving meetings:', error);
        this.loadingSubject.next(false);
      }
    );
  }


  public async showMeetings() {
    this.isCsvReady = false;

    const meetingsData = this.overviewSubject.getValue();
    const lobbyistIds = Array.from(
      new Set(meetingsData.map(m => m.lobbyist_profile?.lobbyist_id))
    ).filter(id => !!id);

    try {
      const allFields = await firstValueFrom(this.dataService.getFields());
      const lobbyistData = await this.dataService.getLobbyistsDetailsSequentially(lobbyistIds, 1000);

      this.lobbyistCsvData = this.csvService.generateLobbyistCsvData(lobbyistData, allFields);
      this.meetingCsvData = this.csvService.generateMeetingCsvDataWithLobbyistData(
        meetingsData,
        lobbyistData,
        allFields
      );

      this.meetingsSubject.next([...meetingsData]);
      this.isCsvReady = true;
    } catch (error) {
      console.error('Errore durante il caricamento dei dati:', error);
    }
  }


  getCurrentFilters(): any {
    return this.filtersSubject.getValue();
  }

  getCurrentMeetings(): any[] {
    return this.meetingsSubject.getValue();
  }

  getOverviewMeetings(): any[] {
    return this.overviewSubject.getValue();
  }

  downloadMeetingCsv() {
    this.csvService.downloadCSV(this.meetingCsvData, 'meeting_centric.csv', '$');
  }

  downloadLobbyistCsv() {
    this.csvService.downloadCSV(this.lobbyistCsvData, 'lobbyist_centric.csv', '$');
  }

  cancelFetch() {
    if (this.currentRequest) {
      this.currentRequest.unsubscribe();
      this.currentRequest = undefined;
      this.loadingSubject.next(false);
    }
  }
}
