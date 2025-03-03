import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-range-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './range-selector.component.html',
  styleUrls: ['./range-selector.component.css']
})
export class RangeSelectorComponent implements OnChanges {
  @Input() minDate?: Date;
  @Input() maxDate?: Date;
  @Input() hasMeetings: boolean = false;

  @Output() dateRangeChange = new EventEmitter<{ startDate: Date; endDate: Date }>();

  public startDate: Date;
  public endDate: Date;
  
  public windowSizes = [6, 12, 24, 36]; // Months (6 months, 1 year, 2 years, 3 years)
  public stepSizes = [1, 3, 6, 12]; // Months (1 month, quarter, semester, year)
  
  public selectedWindowSize = 12; // Default: 1 year
  public selectedStepSize = 12; // Default: 1 year

  private isFirstLoad: boolean = true;

  constructor() {
    const currentYear = new Date().getFullYear();
    this.startDate = new Date(currentYear, 0, 1);
    this.endDate = new Date(currentYear, 11, 31);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isFirstLoad) {
      this.isFirstLoad = false;
      return;
    }
    
    if (changes['minDate'] || changes['maxDate']) {
      this.validateDateRange();
    }
    
    this.emitDateRangeChange();
  }

  private validateDateRange(): void {
    if (!this.minDate || !this.maxDate) return;
  
    // Ensures that startDate is at least minDate and at most maxDate
    this.startDate = this.clampDate(this.startDate, this.minDate, this.maxDate);
  
    // Calculate a new endDate based on the selected window
    let newEndDate = new Date(this.startDate);
    newEndDate.setMonth(newEndDate.getMonth() + this.selectedWindowSize);
  
    // If the new endDate exceeds the maxDate, fix it
    if (newEndDate > this.maxDate) {
      newEndDate = new Date(this.maxDate);
      this.startDate = new Date(newEndDate);
      this.startDate.setMonth(this.startDate.getMonth() - this.selectedWindowSize);
    }
  
    this.endDate = newEndDate;
  
    this.emitDateRangeChange();
  }
  

  private clampDate(date: Date, min: Date, max: Date): Date {
    return new Date(Math.max(min.getTime(), Math.min(date.getTime(), max.getTime())));
  }

  public changeRange(direction: number): void {
    if (!this.hasMeetings || !this.minDate || !this.maxDate) return;

    const stepMonths = this.selectedStepSize;
    let newStartDate = new Date(this.startDate);
    let newEndDate = new Date(this.endDate);

    newStartDate.setMonth(newStartDate.getMonth() + direction * stepMonths);
    newEndDate.setMonth(newEndDate.getMonth() + direction * stepMonths);

    if (newEndDate > this.maxDate) {
      newEndDate = new Date(this.maxDate);
      newStartDate = new Date(newEndDate);
      newStartDate.setMonth(newStartDate.getMonth() - this.selectedWindowSize);
    } else if (newStartDate < this.minDate) {
      newStartDate = new Date(this.minDate);
      newEndDate = new Date(newStartDate);
      newEndDate.setMonth(newEndDate.getMonth() + this.selectedWindowSize);
    }

    this.startDate = newStartDate;
    this.endDate = newEndDate;
    this.emitDateRangeChange();
  }

  public canChangeRange(direction: number): boolean {
    if (!this.hasMeetings || !this.minDate || !this.maxDate) return false;
  
    if (direction > 0 && this.endDate.getTime() === this.maxDate.getTime()) {
      return false; // Blocked forward
    }
  
    if (direction < 0 && this.startDate.getTime() === this.minDate.getTime()) {
      return false; // Blocked backward
    }
  
    return true;
  }
  
  

  public updateWindowSize(event: Event): void {
    this.selectedWindowSize = +(event.target as HTMLSelectElement).value;
    this.recalculateEndDate();
  }

  public updateStepSize(event: Event): void {
    this.selectedStepSize = +(event.target as HTMLSelectElement).value;
  }

  private recalculateEndDate(): void {
    this.endDate = new Date(this.startDate);
    this.endDate.setMonth(this.endDate.getMonth() + this.selectedWindowSize);
    this.validateDateRange();
  }

  private emitDateRangeChange(): void {
    this.dateRangeChange.emit({ startDate: this.startDate, endDate: this.endDate });
  }

  public get currentRangeLabel(): string {
    return `${this.startDate.toLocaleDateString()} - ${this.endDate.toLocaleDateString()}`;
  }
}
