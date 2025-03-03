import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../services/data.service';
import { FilterService } from '../services/filter.service';

@Component({
  selector: 'app-filter-mask',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-mask.component.html',
  styleUrls: ['./filter-mask.component.css']
})
export class FilterMaskComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();
  @Output() showOverview = new EventEmitter<void>();
  @Output() filtersApplied = new EventEmitter<any>();

  filters: any = {};

  directorates: any[] = [];
  lobbyists: any[] = [];
  fields: any[] = [];
  commissioners: any[] = [];

  filteredDirectorates: any[] = [];
  filteredLobbyists: any[] = [];
  filteredFields: any[] = [];
  filteredCommissioners: any[] = [];

  selectedDirectorates: any[] = [];
  selectedLobbyists: any[] = [];
  selectedFields: any[] = [];
  selectedCommissioners: any[] = [];

  searchDirectorate = '';
  searchLobbyist = '';
  searchField = '';
  searchCommissioner = '';

  startDate: string = '';
  endDate: string = '';
  startDateError: boolean = false;
  endDateError: boolean = false;
  dateOrderError: boolean = false;
  keywords: string[] = [];
  keywordInput: string = '';
  filterType: 'AND' | 'OR' = 'OR';

  dateErrors = {
    startDateEmpty: false,
    endDateEmpty: false,
    endDateBeforeStart: false
  };

  expandedSections: any = {
    directorates: false,
    lobbyists: false,
    fields: false,
    commissioners: false,
    keywords: false
  };  

  constructor(private dataService: DataService, private filterService: FilterService) {}

  ngOnInit() {
    this.dataService.getDirectorates().subscribe(data => {
      this.directorates = data;
      this.filteredDirectorates = [...this.directorates];
    });
    this.dataService.getLobbyists().subscribe(data => {
      this.lobbyists = data;
      this.filteredLobbyists = [...this.lobbyists];
    });
    this.dataService.getFields().subscribe(data => {
      this.fields = data;
      this.filteredFields = [...this.fields];
    });
    this.dataService.getCommissioners().subscribe(data => {
      this.commissioners = data;
      this.filteredCommissioners = [...this.commissioners];
    });
  }

  validateDates() {
    this.dateErrors = {
      startDateEmpty: !this.startDate,
      endDateEmpty: !this.endDate,
      endDateBeforeStart: !!this.startDate && !!this.endDate && this.endDate < this.startDate
    };
  }  

  checkDateOrder() {
    if (this.startDate && this.endDate) {
      this.dateOrderError = new Date(this.endDate) < new Date(this.startDate);
    } else {
      this.dateOrderError = false;
    }
  }

  toggleFilter() {
    this.toggle.emit();
  }

  showOverviewPanel() {
    this.showOverview.emit();
  }

  toggleSection(section: string) {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  toggleSelection(item: any, selectionList: any[], idField: string) {
    const index = selectionList.findIndex(selected => selected[idField] === item[idField]);
    if (index !== -1) {
      selectionList.splice(index, 1);
    } else {
      selectionList.push({ ...item });
    }
  }

  isAnySelected(selectionList: any[]): boolean {
    return selectionList.length === 0;
  }

  toggleAnySelection(selectionList: any[]) {
    selectionList.length = 0; // Svuota la lista
  }
  
  isSelected(item: any, selectionList: any[], idField: string): boolean {
    return selectionList.some(selected => selected[idField] === item[idField]);
  }

  filterDirectorates() {
    this.filteredDirectorates = this.directorates.filter(dg =>
      dg.name.toLowerCase().includes(this.searchDirectorate.toLowerCase())
    );
  }

  filterLobbyists() {
    this.filteredLobbyists = this.lobbyists.filter(lob =>
      lob.organization_name.toLowerCase().includes(this.searchLobbyist.toLowerCase())
    );
  }

  filterFields() {
    this.filteredFields = this.fields.filter(field =>
      field.field_name.toLowerCase().includes(this.searchField.toLowerCase())
    );
  }

  filterCommissioners() {
    this.filteredCommissioners = this.commissioners.filter(comm =>
      comm.name.toLowerCase().includes(this.searchCommissioner.toLowerCase())
    );
  }

  addKeyword() {
    const trimmedKeyword = this.keywordInput.trim();
    if (trimmedKeyword && !this.keywords.includes(trimmedKeyword)) {
      this.keywords.push(trimmedKeyword);
    }
    this.keywordInput = '';
  }
  

  removeKeyword(keyword: string) {
    this.keywords = this.keywords.filter(k => k !== keyword);
  }

  toggleFilterType(type: 'AND' | 'OR') {
    this.filterType = type;
  }

  updateFilters() {
    this.validateDates();
    if (!this.dateErrors.startDateEmpty && !this.dateErrors.endDateEmpty && !this.dateErrors.endDateBeforeStart) {
      const selectedLobbyistsIds = this.selectedLobbyists.map(lob => lob.lobbyist_id);
      const selectedFieldsIds = this.selectedFields.map(field => field.field_id);
      const selectedDirectoratesIds = this.selectedDirectorates.map(dg => dg.id);
      const selectedCommissionersIds = this.selectedCommissioners.map(comm => comm.id);  
    
      this.filters = {
        date_from: this.startDate,
        date_to: this.endDate,
        directorate_ids: selectedDirectoratesIds,
        lobbyist_ids: selectedLobbyistsIds,
        field_ids: selectedFieldsIds,
        representative_ids: selectedCommissionersIds,
        keywords: this.keywords,
        filter_type: this.filterType
      };

      this.filterService.setFilters(this.filters);
      this.toggleFilter();
      this.showOverviewPanel();
    } else {
      console.warn("There are errors in the date fields.");
    }
  }
  
}
