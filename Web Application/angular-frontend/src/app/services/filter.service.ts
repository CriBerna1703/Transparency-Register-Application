import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { DataService } from './data.service';
import { CsvService } from './csv.service';
import { Subscription, forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private filtersSubject = new BehaviorSubject<any>({});
  private meetingsSubject = new BehaviorSubject<any[]>([]);
  private overviewSubject = new BehaviorSubject<any[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private currentRequest?: Subscription;
  public isCsvGenerating: boolean = false; 
  public isCsvReady: boolean = false;

  filters$ = this.filtersSubject.asObservable();
  meetings$ = this.meetingsSubject.asObservable();
  overview$ = this.overviewSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  meetingCsvData: any;
  lobbyistCsvData: any;

  constructor(private dataService: DataService, private csvService: CsvService, private authService: AuthService) {}

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
    this.meetingsSubject.next([...this.overviewSubject.getValue()]);
    this.isCsvGenerating = false;
    this.isCsvReady = false;
  }

  public downloadCsv(): Promise<void> {
    this.isCsvGenerating = true;
    this.isCsvReady = false;

    const meetingsData = this.overviewSubject.getValue();
    const lobbyistIds = Array.from(
      new Set(meetingsData.map(m => m.lobbyist_profile?.lobbyist_id))
    ).filter(id => !!id);

    return new Promise(async (resolve, reject) => {
      try {
        const allFields = await firstValueFrom(this.dataService.getFields());

        if (typeof Worker !== 'undefined') {
          const worker = new Worker(new URL('../workers/csv.worker', import.meta.url));
          const token = this.authService.getToken();

          worker.postMessage({
            lobbyistIds,
            chunkSize: 300,
            apiUrl: environment.apiBaseUrl,
            token
          });

          worker.onmessage = ({ data }) => {
            if (data.progress) {
              console.log(`Caricati ${data.progress}/${data.total} lobbisti`);
            }

            if (data.done) {
              const lobbyistData = data.results;

              this.lobbyistCsvData = this.csvService.generateLobbyistCsvData(lobbyistData, allFields);
              this.meetingCsvData = this.csvService.generateMeetingCsvDataWithLobbyistData(
                meetingsData,
                lobbyistData,
                allFields
              );

              this.isCsvGenerating = false;
              this.isCsvReady = true;

              worker.terminate();
              resolve();
            }
          };

          worker.onerror = (err) => {
            console.error('Worker error:', err);
            this.isCsvGenerating = false;
            reject(err);
          };
        } else {
          const lobbyistData = await this.dataService.getLobbyistsDetailsSequentially(lobbyistIds, 300);

          this.lobbyistCsvData = this.csvService.generateLobbyistCsvData(lobbyistData, allFields);
          this.meetingCsvData = this.csvService.generateMeetingCsvDataWithLobbyistData(
            meetingsData,
            lobbyistData,
            allFields
          );

          this.meetingsSubject.next([...meetingsData]);
          this.isCsvGenerating = false;
          this.isCsvReady = true;
          resolve();
        }
      } catch (error) {
        console.error('Errore durante il caricamento dei dati:', error);
        this.isCsvGenerating = false;
        reject(error);
      }
    });
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
