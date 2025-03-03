import { Component, Input, OnChanges, SimpleChanges, ElementRef } from '@angular/core';
import { D3Service } from '../services/d3.service';
import { DataService } from '../services/data.service';
import { FilterService } from '../services/filter.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabNavigationComponent } from '../tab-navigation/tab-navigation.component';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

interface HistogramTab {
  id: string;
  type: string;
  title: string;
  rawData: Date[];
  filteredData: number[];
  maxDegree: number;
  isLoading?: boolean;
  error?: string;
}

@Component({
  selector: 'app-histogram-view',
  standalone: true,
  imports: [CommonModule, FormsModule, TabNavigationComponent],
  templateUrl: './histogram-view.component.html',
  styleUrls: ['./histogram-view.component.css']
})
export class HistogramViewComponent implements OnChanges {
  @Input() selectedEntity: { id: string, type: string } | null = null;
  tabs: HistogramTab[] = [];
  activeTabId: string | null = null;
  zoomLevel: number = 500;

  selectedAggregation: string = 'month';  // Default: aggregazione per mese
  aggregationOptions = [
    { value: 'month', label: 'Mese' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'semester', label: 'Semestre' },
    { value: 'year', label: 'Anno' },
    { value: 'biennium', label: 'Biennio' }
  ];

  timeWindowStart: Date = new Date();
  timeWindowEnd: Date = new Date();

  constructor(
    private d3Service: D3Service,
    private dataService: DataService,
    private filterService: FilterService,
    private el: ElementRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedEntity'] && this.selectedEntity) {
      this.openTab(this.selectedEntity);
    }
  }

  setActiveTab(id: string): void {
    this.activeTabId = id;
    this.updateHistogram();
  }

  openTab(entity: { id: string, type: string }): void {
    if (!entity.id) return;

    const isRepresentative = entity.type === 'representative';
    const isDirectorate = entity.type === 'directorate';
    const existingTab = this.tabs.find(tab => tab.id === entity.id && tab.type === entity.type);
    
    if (existingTab) {
        this.activeTabId = existingTab.id;
        this.updateHistogram();
    } else {
        const allMeetings = this.filterService.getCurrentMeetings();
        const maxDegree = this.calculateMaxDegree(allMeetings, entity.type as 'representative' | 'directorate');

        const newTab: HistogramTab = {
            id: entity.id,
            type: entity.type,
            title: `${entity.type} - ${entity.id}`,
            rawData: [],
            filteredData: [],
            maxDegree
        };

        this.tabs.push(newTab);
        this.activeTabId = newTab.id;

        this.fetchMeetingData(entity).subscribe(meetingDates => {
            newTab.rawData = meetingDates;
            this.updateHistogram(newTab);
        });

        // Representative
        if (isRepresentative) {
          this.dataService.getCommissionerDetails(entity.id).pipe(
            tap((data) => {
              newTab.isLoading = false;
              newTab.title = `${data.name}`;
              this.tabs = [...this.tabs];
            }),
            catchError((error) => {
              newTab.isLoading = false;
              newTab.error = 'Error retrieving lobbyist information.';
              console.error('Error:', error);
              return of(null);
            })
          ).subscribe();
        }
    
        // Directorate
        if (isDirectorate) {
          this.dataService.getDirectorateDetails(entity.id).pipe(
            tap((data) => {
              newTab.isLoading = false;
              newTab.title = `${data.name}`;
              this.tabs = [...this.tabs];
            }),
            catchError((error) => {
              newTab.isLoading = false;
              newTab.error = 'Error retrieving meeting information.';
              console.error('Error:', error);
              return of(null);
            })
          ).subscribe();
        }
    }
  }

  closeTab(tabId: string): void {
    const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
    this.tabs = this.tabs.filter(tab => tab.id !== tabId);

    if (this.activeTabId === tabId) {
      if (this.tabs.length) {
        const newIndex = tabIndex > 0 ? tabIndex - 1 : 0;
        this.activeTabId = this.tabs[newIndex].id;
      } else {
        this.activeTabId = null;
      }
    }
    this.updateHistogram();
  }

  fetchMeetingData(entity: { id: string, type: string }): Observable<Date[]> {
    const currentFilters = { ...this.filterService.getCurrentFilters() };
    if (entity.type === 'directorate') {
      currentFilters.directorate_ids = [entity.id];
    } else if (entity.type === 'representative') {
      currentFilters.representative_ids = [entity.id];
    } else {
      return of([]);
    }

    return this.dataService.getFilteredMeetings(currentFilters).pipe(
      map((meetings: { meeting_date: string }[]) => meetings.map(meeting => new Date(meeting.meeting_date))),
      catchError((error: any) => {
      console.error('Error retrieving data:', error);
      return of<Date[]>([]);
      })
    );
  }

  updateHistogram(tab?: HistogramTab): void {
    const activeTab = tab || this.tabs.find(t => t.id === this.activeTabId);
    if (!activeTab) return;

    const allMeetings = this.filterService.getCurrentMeetings();
    activeTab.maxDegree = this.calculateMaxDegree(allMeetings, activeTab.type as 'representative' | 'directorate');

    const aggregatedData = this.aggregateData(activeTab.rawData, this.selectedAggregation);
    activeTab.filteredData = aggregatedData.values;

    setTimeout(() => this.createHistogram(activeTab, aggregatedData.labels));
  }

  aggregateData(dates: Date[], aggregation: string): { labels: string[], values: number[] } {
    const groupedData: { [key: string]: number } = {};
  
    const allDates = dates.map(d => d.getTime());
    if (allDates.length === 0) return { labels: [], values: [] };
  
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
  
    const dateRange = this.generateDateRange(minDate, maxDate, aggregation);
  
    dates.forEach(date => {
      const key = this.getAggregationKey(date, aggregation);
      groupedData[key] = (groupedData[key] || 0) + 1;
    });
  
    const finalData = dateRange.map(key => ({
      label: key,
      value: groupedData[key] || 0,
      sortableKey: this.getSortableKey(key, aggregation)
    }));
  
    finalData.sort((a, b) => a.sortableKey - b.sortableKey);
  
    return {
      labels: finalData.map(entry => entry.label),
      values: finalData.map(entry => entry.value)
    };
  }
  
  private generateDateRange(start: Date, end: Date, aggregation: string): string[] {
    const dates: string[] = [];
    const current = new Date(start);
  
    while (current <= end) {
      dates.push(this.getAggregationKey(new Date(current), aggregation));
  
      switch (aggregation) {
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'quarter':
          current.setMonth(current.getMonth() + 3);
          break;
        case 'semester':
          current.setMonth(current.getMonth() + 6);
          break;
        case 'year':
          current.setFullYear(current.getFullYear() + 1);
          break;
        case 'biennium':
          current.setFullYear(current.getFullYear() + 2);
          break;
        default:
          current.setDate(current.getDate() + 1);
      }
    }
  
    return dates;
  }

  private getAggregationKey(date: Date, aggregation: string): string {
    switch (aggregation) {
      case 'month':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'quarter':
        return `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
      case 'semester':
        return `${date.getFullYear()}-S${date.getMonth() < 6 ? '1' : '2'}`;
      case 'year':
        return `${date.getFullYear()}`;
      case 'biennium':
        const bienniumStart = Math.floor(date.getFullYear() / 2) * 2;
        return `${bienniumStart}-${bienniumStart + 1}`;
      default:
        return date.toISOString().split('T')[0];  // Giorno per giorno
    }
  }
  
  
  private getSortableKey(label: string, aggregation: string): number {
    const match = label.match(/\d+/g);
    if (!match) return 0;
  
    const numbers = match.map(n => parseInt(n, 10));
  
    switch (aggregation) {
      case 'month':
        return numbers[0] * 12 + (numbers[1] - 1);
      case 'quarter':
        return numbers[0] * 4 + (numbers[1] - 1);
      case 'semester':
        return numbers[0] * 2 + (numbers[1] === 1 ? 0 : 1);
      case 'year':
        return numbers[0];
      case 'biennium':
        return numbers[0];
      default:
        return new Date(label).getTime();
    }
  }

  updateZoom(): void {
    this.updateHistogram();
  }

  private calculateMaxDegree(meetings: any[], entityType: 'representative' | 'directorate'): number {
    const countByNodeAndTime: { [key: string]: { [timeKey: string]: number } } = {};

    for (const meeting of meetings) {
      const nodeId = entityType === 'representative' ? meeting.representative_id : meeting.CommissionRepresentative.RepresentativeAllocations?.[0]?.Directorate?.id;
      
      if (!nodeId) continue;
  
      const timeKey = this.getAggregationKey(new Date(meeting.meeting_date), this.selectedAggregation);
  
      countByNodeAndTime[nodeId] = countByNodeAndTime[nodeId] || {};
      countByNodeAndTime[nodeId][timeKey] = (countByNodeAndTime[nodeId][timeKey] || 0) + 1;
    }  

    let maxDegree = 0;
    Object.values(countByNodeAndTime).forEach(timeCounts => {
        maxDegree = Math.max(maxDegree, ...Object.values(timeCounts));
    });

    return maxDegree;
  }

  
  createHistogram(tab: HistogramTab, labels: string[]): void {
    const element = this.el.nativeElement.querySelector(`#histogram-${tab.id}`);
    this.d3Service.drawHistogram(element, tab.filteredData, labels, this.zoomLevel, 300, tab.maxDegree);
  }
}
