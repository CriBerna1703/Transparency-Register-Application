import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterMaskComponent } from './filter-mask/filter-mask.component';
import { GraphViewComponent } from './graph-view/graph-view.component';
import { TemporalViewComponent } from './temporal-view/temporal-view.component';
import { RangeSelectorComponent } from './range-selector/range-selector.component';
import { HistogramViewComponent } from './histogram-view/histogram-view.component';
import { InfoTabsComponent } from './info-tabs/info-tabs.component';
import { OverviewComponent } from './overview/overview.component';
import { MeetingSummaryComponent } from './meeting-summary/meeting-summary.component';
import { FilterService } from './services/filter.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FilterMaskComponent, GraphViewComponent, TemporalViewComponent, RangeSelectorComponent, HistogramViewComponent, InfoTabsComponent, CommonModule, FormsModule, OverviewComponent, MeetingSummaryComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isFilterCollapsed = false;
  isOverviewCollapsed = true;
  isControlPanelCollapsed = false;
  isHistogramPanelCollapsed = false;
  labelSize = 14;
  zoomLevel = 100;
  showRepresentatives = true;
  selectedInfoEntity: { id: string, type: string } | null = null;
  selectedHistogramEntity: { id: string, type: string } | null = null;  public startDate: Date = new Date();
  activeTab: 'overview' | 'graph' = 'overview';
  public endDate: Date = new Date();
  public minDate?: Date = new Date();
  public maxDate?: Date = new Date();
  public hasMeetings: boolean = true;

  @ViewChild(TemporalViewComponent) temporalViewComponent!: TemporalViewComponent;
  @ViewChild(OverviewComponent) overviewComponent!: OverviewComponent;

  constructor(private cdr: ChangeDetectorRef, private filterService: FilterService) {}

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
  }

  onCancel() {
    this.isOverviewCollapsed = true
    this.isFilterCollapsed = false;
  }

  toggleControlPanel() {
    this.isControlPanelCollapsed = !this.isControlPanelCollapsed;
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
    this.createVisualization();
  }

  public createVisualization(): void {
    if (this.temporalViewComponent) {
      this.temporalViewComponent.createVisualization();
      this.setActiveTab('overview');
    }
  }
  
  onNodeSelected(entity: { id: string, type: string}): void {
    this.selectedInfoEntity = null;
    this.selectedHistogramEntity = null;
    this.cdr.detectChanges();
  
    if (entity.type === 'lobbyist' || entity.type === 'meeting') {
      this.selectedInfoEntity = entity;
    } else if (entity.type === 'representative' || entity.type === 'directorate') {
      this.selectedHistogramEntity = entity;
    }
  }

  setActiveTab(tab: 'graph' | 'overview') {
    this.activeTab = tab;
    
    if (tab === 'overview') {
        setTimeout(() => this.overviewComponent?.updateHistogram(), 0);
    }
  }

  downloadCSV(){
    this.filterService.downloadMeetingCsv();
    this.filterService.downloadLobbyistCsv();
  }
}