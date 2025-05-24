import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterService } from '../services/filter.service';
import { SelectionService } from '../services/selection.service';
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

  totalLobbyists = 0;
  totalRepresentatives = 0;
  totalDirectorates = 0;
  totalMeetings = 0;
  loading = true;
  
  expandedSections = {
    lobbyists: false,
    representatives: false,
    directorates: false
  };

  lobbyists: any[] = [];
  representatives: any[] = [];
  directorates: any[] = [];

  filteredLobbyists: any[] = [];
  filteredRepresentatives: any[] = [];
  filteredDirectorates: any[] = [];
  searchLobbyist = '';
  searchCommissioner = '';
  searchDirectorate = '';

  selectedNodesSet = new Set<string>();

  constructor(private filterService: FilterService, private selectionService: SelectionService) {}

  ngOnInit(): void {
    const data$ = this.useOverviewData ? this.filterService.overview$ : this.filterService.meetings$;

    if(this.useOverviewData) {
      this.filterService.loading$.subscribe((isLoading) => {
        this.loading = isLoading;
      });
    }

    this.subscription = data$.subscribe(meetings => {
      const lobbistiMap = new Map();
      const rappresentantiMap = new Map();
      const direzioniMap = new Map();

      meetings.forEach(meeting => {
        console.log('Processing meeting:', meeting);
        lobbistiMap.set(meeting.lobbyist_id, meeting.Lobbyist.organization_name); // Assicurati che il nome esista
        const rep = meeting.CommissionRepresentative;
        rappresentantiMap.set(rep.id, rep.name || `Rep #${rep.id}`);
        const dir = rep.RepresentativeAllocations?.[0]?.Directorate;
        if (dir) {
          direzioniMap.set(dir.id, dir.name);
        }
      });

      this.totalLobbyists = lobbistiMap.size;
      this.totalRepresentatives = rappresentantiMap.size;
      this.totalDirectorates = direzioniMap.size;
      this.totalMeetings = meetings.length;

      this.lobbyists = Array.from(lobbistiMap, ([id, name]) => ({ id, name }));
      this.representatives = Array.from(rappresentantiMap, ([id, name]) => ({ id, name }));
      this.directorates = Array.from(direzioniMap, ([id, name]) => ({ id, name }));

      this.lobbyists = this.lobbyists.sort((a, b) => a.name.localeCompare(b.name));
      this.filteredLobbyists = [...this.lobbyists];
      this.representatives = this.representatives.sort((a, b) => a.name.localeCompare(b.name));
      this.filteredRepresentatives = [...this.representatives];
      this.directorates = this.directorates.sort((a, b) => a.name.localeCompare(b.name));
      this.filteredDirectorates = [...this.directorates];
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

  toggleSection(section: 'lobbyists' | 'representatives' | 'directorates') {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  toggleSelection(item: any, type: 'lobbyist' | 'representative' | 'directorate') {
    this.selectionService.toggleNode({ id: item.id, type });
  }

  isSelected(item: any, type: 'lobbyist' | 'representative' | 'directorate'): boolean {
    return this.selectedNodesSet.has(`${type}:${item.id}`);
  }

  clearSelection(group: 'lobbyists' | 'representatives' | 'directorates') {
    const typeMap = {
      lobbyists: 'lobbyist',
      representatives: 'representative',
      directorates: 'directorate'
    } as const;

    const type = typeMap[group];

    const selected = Array.from(this.selectedNodesSet).filter(k => k.startsWith(`${type}:`));
    for (const key of selected) {
      const id = key.split(':')[1];
      this.selectionService.deselectNode(id);
    }
  }


  filterList(listName: 'lobbyists' | 'representatives' | 'directorates', searchValue: string) {
    let sourceList: any[] = [];
    let key = '';

    switch (listName) {
      case 'lobbyists':
        sourceList = this.lobbyists;
        key = 'name';
        this.filteredLobbyists = sourceList.filter(item =>
          item[key].toLowerCase().includes(searchValue.toLowerCase())
        );
        break;
      case 'representatives':
        sourceList = this.representatives;
        key = 'name';
        this.filteredRepresentatives = sourceList.filter(item =>
          item[key].toLowerCase().includes(searchValue.toLowerCase())
        );
        break;
      case 'directorates':
        sourceList = this.directorates;
        key = 'name';
        this.filteredDirectorates = sourceList.filter(item =>
          item[key].toLowerCase().includes(searchValue.toLowerCase())
        );
        break;
    }
  }

}