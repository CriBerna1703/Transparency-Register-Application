import { Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { D3Service } from '../services/d3.service';
import { FilterService } from '../services/filter.service';
import { MeetingSummaryComponent } from '../meeting-summary/meeting-summary.component';

@Component({
  selector: 'app-overview',
  imports: [CommonModule, FormsModule, MeetingSummaryComponent],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css']
})
export class OverviewComponent implements OnInit {
  zoomLevel: number = 500;
  selectedAggregation: string = 'month';
  aggregationOptions = [
    { value: 'month', label: 'Mese' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'semester', label: 'Semestre' },
    { value: 'year', label: 'Anno' },
    { value: 'biennium', label: 'Biennio' }
  ];
  
  rawData: Date[] = [];
  filteredData: number[] = [];
  maxDegree: number = 0;
  labels: string[] = [];

  constructor(
    private d3Service: D3Service,
    private filterService: FilterService,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.updateHistogram();
  }

  updateHistogram(): void {
    const allMeetings = this.filterService.getCurrentMeetings();
    this.maxDegree = this.calculateMaxDegree(allMeetings);

    this.rawData = allMeetings.map(m => new Date(m.meeting_date));
    const aggregatedData = this.aggregateData(this.rawData, this.selectedAggregation);
    
    this.labels = aggregatedData.labels;
    this.filteredData = aggregatedData.values;

    setTimeout(() => this.createHistogram());
  }

  updateZoom(): void {
    this.createHistogram();
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
        case 'month': current.setMonth(current.getMonth() + 1); break;
        case 'quarter': current.setMonth(current.getMonth() + 3); break;
        case 'semester': current.setMonth(current.getMonth() + 6); break;
        case 'year': current.setFullYear(current.getFullYear() + 1); break;
        case 'biennium': current.setFullYear(current.getFullYear() + 2); break;
        default: current.setDate(current.getDate() + 1);
      }
    }

    return dates;
  }

  private getAggregationKey(date: Date, aggregation: string): string {
    switch (aggregation) {
      case 'month': return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'quarter': return `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
      case 'semester': return `${date.getFullYear()}-S${date.getMonth() < 6 ? '1' : '2'}`;
      case 'year': return `${date.getFullYear()}`;
      case 'biennium': return `${Math.floor(date.getFullYear() / 2) * 2}-${Math.floor(date.getFullYear() / 2) * 2 + 1}`;
      default: return date.toISOString().split('T')[0];
    }
  }

  private getSortableKey(label: string, aggregation: string): number {
    const match = label.match(/\d+/g);
    if (!match) return 0;
    const numbers = match.map(n => parseInt(n, 10));

    switch (aggregation) {
      case 'month': return numbers[0] * 12 + (numbers[1] - 1);
      case 'quarter': return numbers[0] * 4 + (numbers[1] - 1);
      case 'semester': return numbers[0] * 2 + (numbers[1] === 1 ? 0 : 1);
      case 'year': return numbers[0];
      case 'biennium': return numbers[0];
      default: return new Date(label).getTime();
    }
  }

  private calculateMaxDegree(meetings: any[]): number {
    const countByTime: { [timeKey: string]: number } = {};

    meetings.forEach(meeting => {
      const timeKey = this.getAggregationKey(new Date(meeting.meeting_date), this.selectedAggregation);
      countByTime[timeKey] = (countByTime[timeKey] || 0) + 1;
    });

    return Math.max(...Object.values(countByTime), 0);
  }

  private createHistogram(): void {
    const element = this.el.nativeElement.querySelector(`#overview-histogram`);
    this.d3Service.drawHistogram(element, this.filteredData, this.labels, this.zoomLevel, 300, this.maxDegree);
  }
}
