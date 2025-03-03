import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService } from './data.service';
import { CsvService } from './csv.service';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private filtersSubject = new BehaviorSubject<any>({});
  private meetingsSubject = new BehaviorSubject<any[]>([]);
  private overviewSubject = new BehaviorSubject<any[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

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
    this.loadingSubject.next(true);
    this.dataService.getFilteredMeetings(filters).subscribe(
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
    let allFields:{ field_id: number; field_name: string }[] = [];
    this.dataService.getFields().subscribe(data => {
      allFields = data;
      this.meetingCsvData = this.csvService.generateMeetingCsvData(this.overviewSubject.getValue());
      this.lobbyistCsvData = this.csvService.generateLobbyistCsvData(this.overviewSubject.getValue(), allFields);
    });
    this.meetingsSubject.next([...this.overviewSubject.getValue()]);
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
}
