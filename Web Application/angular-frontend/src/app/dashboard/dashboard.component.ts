import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterMaskComponent } from '../filter-mask/filter-mask.component';
import { GraphViewComponent } from '../graph-view/graph-view.component';
import { TemporalViewComponent } from '../temporal-view/temporal-view.component';
import { RangeSelectorComponent } from '../range-selector/range-selector.component';
import { HistogramViewComponent } from '../histogram-view/histogram-view.component';
import { InfoTabsComponent } from '../info-tabs/info-tabs.component';
import { OverviewComponent } from '../overview/overview.component';
import { MeetingSummaryComponent } from '../meeting-summary/meeting-summary.component';
import { FilterService } from '../services/filter.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CsvService } from '../services/csv.service';
import { DataService } from '../services/data.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FilterMaskComponent, GraphViewComponent, TemporalViewComponent, RangeSelectorComponent, HistogramViewComponent, InfoTabsComponent, CommonModule, FormsModule, OverviewComponent, MeetingSummaryComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  isFilterCollapsed = false;
  isOverviewCollapsed = true;
  isControlPanelCollapsed = false;
  isTopCollapsed = false;
  isBottomCollapsed = false;
  isHistogramPanelCollapsed = true;
  labelSize = 14;
  zoomLevel = 100;
  fullLabels = false;
  showRepresentatives = true;
  selectedInfoEntity: { id: string, type: string } | null = null;
  selectedHistogramEntity: { id: string, type: string } | null = null;  public startDate: Date = new Date();
  activeTab: 'overview' | 'graph' = 'overview';
  public labelText: string = '';
  public maxLabelWidth = '35%';
  public endDate: Date = new Date();
  public minDate?: Date = new Date();
  public maxDate?: Date = new Date();
  public hasMeetings: boolean = true;
  public circumference = 2 * Math.PI * 14;
  menuOpen = false;
  email = '';
  isAdmin = false;

  @ViewChild(TemporalViewComponent) temporalViewComponent!: TemporalViewComponent;
  @ViewChild(OverviewComponent) overviewComponent!: OverviewComponent;

  constructor(
    private cdr: ChangeDetectorRef,
    public filterService: FilterService,
    private router: Router,
    private auth: AuthService,
    private dataService: DataService,
    private csvService: CsvService
  ) {}

  toggleFilter() {
    this.isFilterCollapsed = !this.isFilterCollapsed;
  }

  showOverview() {
    this.isOverviewCollapsed = false;
  }

  onConfirm() {
    this.isOverviewCollapsed = true;
    this.isFilterCollapsed = true;
    this.filterService.showMeetings();
    this.setActiveTab('overview');
  }

  collapseBottom() {
    this.isBottomCollapsed = !this.isBottomCollapsed;
    if (this.isBottomCollapsed) {
      this.isTopCollapsed = false;
    }
  }

  onCancel() {
    this.filterService.cancelFetch();
    this.isOverviewCollapsed = true;
    this.isFilterCollapsed = false;
  }

  toggleControlPanel() {
    this.isControlPanelCollapsed = !this.isControlPanelCollapsed;
  }

  toggleTopPanel() {
    this.isTopCollapsed = !this.isTopCollapsed;
    if (this.isTopCollapsed) {
      this.isBottomCollapsed = false;
    }
  }

  toggleHistogramPanel() {
    this.isHistogramPanelCollapsed = !this.isHistogramPanelCollapsed;
  }

  public onDateRangeUpdate(range: { minDate?: Date; maxDate?: Date; hasMeetings: boolean }): void {
    this.minDate = range.minDate;
    this.maxDate = range.maxDate;
    this.hasMeetings = range.hasMeetings;
    this.cdr.detectChanges();
  }

  // Receives data from the Range Selector Component
  public onDateRangeChange(dateRange: { startDate: Date; endDate: Date }): void {
    this.startDate = dateRange.startDate;
    this.endDate = dateRange.endDate;
    this.createVisualization();
    this.cdr.detectChanges();
  }

  public onDrawSizeChange(event: Event): void {
    this.zoomLevel = (event.target as HTMLInputElement).valueAsNumber;
  }

  public onLabelSizeChange(event: Event): void {
    this.labelSize = (event.target as HTMLInputElement).valueAsNumber;
  }

  public onFullLabelsChange(event: Event): void {
    this.fullLabels = (event.target as HTMLInputElement).checked;
  }

  public createVisualization(): void {
    if (this.temporalViewComponent) {
      this.temporalViewComponent.createVisualization();
    }
  }
  
  onNodeSelected(entity: { id: string, type: string}): void {
    this.selectedInfoEntity = null;
    this.selectedHistogramEntity = null;
    this.cdr.detectChanges();
  
    if (entity.type === 'lobbyist' || entity.type === 'meeting') {
      this.selectedInfoEntity = entity;
    } else if (entity.type === 'representative' || entity.type === 'directorate' || entity.type === 'cabinet') {
      this.isHistogramPanelCollapsed = false;
      this.selectedHistogramEntity = entity;
    }
  }

  setActiveTab(tab: 'graph' | 'overview') {
    this.activeTab = tab;
    
    if (tab === 'overview') {
      this.isBottomCollapsed = false;
      setTimeout(() => this.overviewComponent?.updateHistogram(), 0);
    }
  }

  async downloadCSV() {
    if (!this.filterService.isCsvReady && !this.filterService.isCsvGenerating) {
      await this.filterService.downloadCsv();
    }

    this.filterService.downloadMeetingCsv();
    this.filterService.downloadLobbyistCsv();
  }

  goToWelcome() {
    this.router.navigateByUrl('/welcome');
  }

  public onLabelTextChange(newText: string) {
    this.labelText = newText;
    this.cdr.detectChanges();
  }

  ngOnInit() {
    this.email = this.auth.getEmail() || '';
    this.isAdmin = this.auth.isAdmin();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    this.auth.logout();
    localStorage.removeItem('welcome_seen');
    this.router.navigateByUrl('/welcome');
  }

  async downloadLogs() {
    try {
      const logs = await firstValueFrom(
        this.dataService.getApiLogs()
      );
      const cleanedLogs = logs.map(l => ({
        id: l.id,
        user_email: l.user_email,
        method: l.method,
        endpoint: l.endpoint,
        query_params: l.query_params,
        body: JSON.stringify(l.body),
        created_at: l.created_at
      }));

      this.csvService.downloadCSV(
        cleanedLogs,
        'api_logs.csv',
        ';'
      );
    } catch (err) {
      console.error('Error downloading logs', err);
    }
  }
}
