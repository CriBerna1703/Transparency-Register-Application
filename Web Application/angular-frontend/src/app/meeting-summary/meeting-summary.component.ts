import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterService } from '../services/filter.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-meeting-summary',
  imports: [CommonModule, FormsModule],
  templateUrl: './meeting-summary.component.html',
  styleUrls: ['./meeting-summary.component.css']
})
export class MeetingSummaryComponent implements OnInit {
  @Input() collapsed = true;
  @Input() useOverviewData = true;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private subscription: Subscription | undefined;

  totalLobbisti = 0;
  totalRappresentanti = 0;
  totalDirezioni = 0;
  totalMeetings = 0;
  loading = true;


  constructor(private filterService: FilterService) {}

  ngOnInit(): void {
    const data$ = this.useOverviewData ? this.filterService.overview$ : this.filterService.meetings$;

    if(this.useOverviewData) {
      this.filterService.loading$.subscribe((isLoading) => {
        this.loading = isLoading;
      });
    }

    this.subscription = data$.subscribe(meetings => {
      const lobbistiSet = new Set();
      const rappresentantiSet = new Set();
      const direzioniSet = new Set();

      meetings.forEach(meeting => {
        lobbistiSet.add(meeting.lobbyist_id);
        rappresentantiSet.add(meeting.CommissionRepresentative.id);

        if (meeting.CommissionRepresentative.RepresentativeAllocations?.[0]?.Directorate) {
          direzioniSet.add(meeting.CommissionRepresentative.RepresentativeAllocations[0].Directorate.id);
        }
      });

      this.totalLobbisti = lobbistiSet.size;
      this.totalRappresentanti = rappresentantiSet.size;
      this.totalDirezioni = direzioniSet.size;
      this.totalMeetings = meetings.length;
    });
  }

  confirmSelection() {
    this.confirm.emit();
  }

  cancelSelection() {
    this.cancel.emit();
  }
}
