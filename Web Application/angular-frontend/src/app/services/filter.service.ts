import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService } from './data.service';
import { CsvService } from './csv.service';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private filtersSubject = new BehaviorSubject<any>({});
  private meetingsSubject = new BehaviorSubject<any[]>([]);
  private overviewSubject = new BehaviorSubject<any[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private currentRequest?: Subscription;

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

  public showMeetings() {
    const meetingsData = this.overviewSubject.getValue();
    this.meetingCsvData = this.csvService.generateMeetingCsvData(meetingsData);

    const lobbyistIds = Array.from(
      new Set(meetingsData.map(m => m.lobbyist_profile?.lobbyist_id))
    ).filter(id => !!id);

    this.dataService.getFields().subscribe(allFields => {
      this.dataService.getAllLobbyistsDetails(lobbyistIds).subscribe(lobbyistData => {
        this.lobbyistCsvData = this.csvService.generateLobbyistCsvData(lobbyistData, allFields);
      });
    });

    this.meetingsSubject.next([...meetingsData]);
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
