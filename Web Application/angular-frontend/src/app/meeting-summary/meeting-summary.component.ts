import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterService } from '../services/filter.service';
import { SelectionService } from '../services/selection.service';
import { Subscription } from 'rxjs';
import { RawParticipant } from '../temporal-view/temporal-view.component';

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

  totalLobbyists = 0;
  totalRepresentatives = 0;
  totalDirectorates = 0;
  totalCabinets = 0;
  totalMeetings = 0;
  loading = true;

  expandedSections = {
    lobbyists: false,
    representatives: false,
    directorates: false,
    cabinets: false
  };

  lobbyists: any[] = [];
  representatives: any[] = [];
  directorates: any[] = [];
  cabinets: any[] = [];

  filteredLobbyists: any[] = [];
  filteredRepresentatives: any[] = [];
  filteredDirectorates: any[] = [];
  filteredCabinets: any[] = [];

  searchLobbyist = '';
  searchCommissioner = '';
  searchDirectorate = '';
  searchCabinet = '';

  selectedNodesSet = new Set<string>();

  constructor(private filterService: FilterService, private selectionService: SelectionService) {}

  ngOnInit(): void {
    const data$ = this.useOverviewData ? this.filterService.overview$ : this.filterService.meetings$;

    if (this.useOverviewData) {
      this.filterService.loading$.subscribe((isLoading) => {
        this.loading = isLoading;
      });
    }

    this.subscription = data$.subscribe(meetings => {
      const lobbistiMap = new Map();
      const rappresentantiMap = new Map();
      const directoratesMap = new Map();
      const cabinetsMap = new Map();

      meetings.forEach(meeting => {
        lobbistiMap.set(meeting.lobbyist_profile.lobbyist_id, meeting.lobbyist_profile.organization_name);

        meeting.participants.forEach((p: RawParticipant) => {
          rappresentantiMap.set(p.commission_representative.id, p.commission_representative.name);

          if (p.directorate?.id) {
            directoratesMap.set(p.directorate.id, p.directorate.name);
          }
          if (p.commission_cabinet?.id) {
            cabinetsMap.set(p.commission_cabinet.id, p.commission_cabinet.name);
          }
        });
      });

      this.totalLobbyists = lobbistiMap.size;
      this.totalRepresentatives = rappresentantiMap.size;
      this.totalDirectorates = directoratesMap.size;
      this.totalCabinets = cabinetsMap.size;
      this.totalMeetings = meetings.length;

      this.lobbyists = Array.from(lobbistiMap, ([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      this.filteredLobbyists = [...this.lobbyists];

      this.representatives = Array.from(rappresentantiMap, ([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      this.filteredRepresentatives = [...this.representatives];

      this.directorates = Array.from(directoratesMap, ([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      this.filteredDirectorates = [...this.directorates];

      this.cabinets = Array.from(cabinetsMap, ([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      this.filteredCabinets = [...this.cabinets];
    });

    this.selectionService.selectedNodes$.subscribe((nodes: any[]) => {
      this.selectedNodesSet = new Set(
        nodes.map(n => `${n.type}:${n.id}`)
      );
    });
  }

  confirmSelection() {
    this.confirm.emit();
  }

  cancelSelection() {
    this.cancel.emit();
  }

  toggleSection(section: 'lobbyists' | 'representatives' | 'directorates' | 'cabinets') {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  toggleSelection(item: any, type: 'lobbyist' | 'representative' | 'directorate' | 'cabinet') {
    this.selectionService.toggleNode({ id: item.id, type });
  }

  isSelected(item: any, type: 'lobbyist' | 'representative' | 'directorate' | 'cabinet'): boolean {
    return this.selectedNodesSet.has(`${type}:${item.id}`);
  }

  clearSelection(group: 'lobbyists' | 'representatives' | 'directorates' | 'cabinets') {
    const typeMap = {
      lobbyists: 'lobbyist',
      representatives: 'representative',
      directorates: 'directorate',
      cabinets: 'cabinet'
    } as const;

    const type = typeMap[group];

    this.selectionService.clearSection(type);
  }

  filterList(listName: 'lobbyists' | 'representatives' | 'directorates' | 'cabinets', searchValue: string) {
    let sourceList: any[] = [];
    let key = 'name';

    switch (listName) {
      case 'lobbyists':
        sourceList = this.lobbyists;
        this.filteredLobbyists = sourceList.filter(item =>
          item[key].toLowerCase().includes(searchValue.toLowerCase())
        );
        break;
      case 'representatives':
        sourceList = this.representatives;
        this.filteredRepresentatives = sourceList.filter(item =>
          item[key].toLowerCase().includes(searchValue.toLowerCase())
        );
        break;
      case 'directorates':
        sourceList = this.directorates;
        this.filteredDirectorates = sourceList.filter(item =>
          item[key].toLowerCase().includes(searchValue.toLowerCase())
        );
        break;
      case 'cabinets':
        sourceList = this.cabinets;
        this.filteredCabinets = sourceList.filter(item =>
          item[key].toLowerCase().includes(searchValue.toLowerCase())
        );
        break;
    }
  }
}
