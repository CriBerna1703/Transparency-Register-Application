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
  commissioners: RepresentativeWithCabinets[] = [];

  filteredDirectorates: any[] = [];
  filteredLobbyists: any[] = [];
  filteredFields: any[] = [];
  filteredCommissioners: RepresentativeWithCabinets[] = [];

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
  minBudget: number | null = null;
  maxBudget: number | null = null;

  dateErrors = {
    startDateEmpty: false,
    endDateEmpty: false,
    endDateBeforeStart: false
  };

  budgetErrors = {
    budgetOrderInvalid: false
  };

  expandedSections: any = {
    directorates: false,
    lobbyists: false,
    fields: false,
    commissioners: false,
    keywords: false,
    budget: false
  };

  viewMode: 'flat' | 'tree' = 'flat';
  cabinetGroups: CabinetGroup[] = [];
  filteredCabinetGroups: CabinetGroup[] = [];

  constructor(private dataService: DataService, private filterService: FilterService) {}

  ngOnInit() {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
  
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = oneYearAgo.toISOString().split('T')[0];

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
    this.dataService.getCommissioners().subscribe((data: RepresentativeWithCabinets[]) => {
      this.commissioners = (data || []).map(r => ({ ...r, cabinets: r.cabinets ?? [] }));
      this.filteredCommissioners = [...this.commissioners];

      this.cabinetGroups = this.buildCabinetTree(this.commissioners);
      this.filteredCabinetGroups = [...this.cabinetGroups];
    });
  }

  validateDates() {
    this.dateErrors = {
      startDateEmpty: !this.startDate,
      endDateEmpty: !this.endDate,
      endDateBeforeStart: !!this.startDate && !!this.endDate && this.endDate < this.startDate
    };
  }

  validateBudgets() {
    this.budgetErrors.budgetOrderInvalid =
      this.minBudget != null &&
      this.maxBudget != null &&
      this.minBudget > this.maxBudget;
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
    const q = this.norm(this.searchCommissioner);

    this.filteredCommissioners = this.commissioners.filter(comm => {
      if (!q) return true;
      return this.norm(comm.name).includes(q);
    });

    const allGroups = this.buildCabinetTree(this.commissioners);
    if (!q) {
      this.filteredCabinetGroups = allGroups;
      return;
    }

    this.filteredCabinetGroups = allGroups
      .map(g => {
        const cabinetMatch = this.norm(g.cabinetName).includes(q);
        const childMatches = g.reps.filter(r => this.norm(r.name).includes(q));
        if (cabinetMatch) return g;
        if (childMatches.length) return { ...g, reps: childMatches };
        return null;
      })
      .filter(Boolean) as CabinetGroup[];
  }

  isRepSelected(repId: number): boolean {
    return this.selectedCommissioners.some(s => s.id === repId);
  }

  toggleRepSelection(repId: number, name: string) {
    const i = this.selectedCommissioners.findIndex(s => s.id === repId);
    if (i >= 0) this.selectedCommissioners.splice(i, 1);
    else this.selectedCommissioners.push({ id: repId, name });
  }

  toggleCabinetRepSelection(group: CabinetGroup) {
    if (!group.cabinetRepresentativeId) return;
    this.toggleRepSelection(group.cabinetRepresentativeId, group.cabinetName || 'No cabinet');
  }

  private groupAllIds(group: CabinetGroup): {id: number, name: string}[] {
    const list = [...group.reps];
    if (group.cabinetRepresentativeId && !list.some(x => x.id === group.cabinetRepresentativeId)) {
      list.unshift({ id: group.cabinetRepresentativeId, name: group.cabinetName || 'No cabinet' });
    }
    return list;
  }

  isCabinetAllSelected(group: CabinetGroup): boolean {
    const all = this.groupAllIds(group);
    return all.length > 0 && all.every(r => this.isRepSelected(r.id));
  }

  isCabinetSomeSelected(group: CabinetGroup): boolean {
    const all = this.groupAllIds(group);
    if (!all.length) return false;
    const selected = all.filter(r => this.isRepSelected(r.id)).length;
    return selected > 0 && selected < all.length;
  }

  toggleCabinetSelection(group: CabinetGroup) {
    const all = this.groupAllIds(group);
    const allSelected = all.every(r => this.isRepSelected(r.id));

    if (allSelected) {
      all.forEach(r => {
        const i = this.selectedCommissioners.findIndex(s => s.id === r.id);
        if (i >= 0) this.selectedCommissioners.splice(i, 1);
      });
    } else {
      all.forEach(r => {
        if (!this.isRepSelected(r.id)) {
          this.selectedCommissioners.push({ id: r.id, name: r.name });
        }
      });
    }
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

  formatBudgetDisplay(value: number | null, isMin: boolean = false): string {
    if (value == null) {
      return isMin ? '0' : '∞';
    }
    return value.toLocaleString('it-IT');
  }

  updateFilters() {
    this.validateDates();
    this.validateBudgets();

    if (
      !this.dateErrors.startDateEmpty &&
      !this.dateErrors.endDateEmpty &&
      !this.dateErrors.endDateBeforeStart &&
      !this.budgetErrors.budgetOrderInvalid
    ) {
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
      if (this.minBudget != null) {
        this.filters.minBudget = this.minBudget;
      }
      if (this.maxBudget != null) {
        this.filters.maxBudget = this.maxBudget;
      }

      this.filterService.setFilters(this.filters);
      this.toggleFilter();
      this.showOverviewPanel();
    } else {
      console.warn("There are errors in the date fields.");
    }
  }

  private buildCabinetTree(reps: RepresentativeWithCabinets[]): CabinetGroup[] {
    const map = new Map<string, CabinetGroup>();
    const cabinetRepIds = new Set<number>();

    for (const r of reps) {
      const cabinets = (r.cabinets && r.cabinets.length)
        ? r.cabinets
        : [{ id: null, name: 'No cabinet', representative_id: null }];

      for (const c of cabinets) {
        const key = `${c.id ?? 'null'}|${c.name ?? 'No cabinet'}`;
        if (!map.has(key)) {
          map.set(key, {
            cabinetId: c.id ?? null,
            cabinetName: c.name ?? 'No cabinet',
            cabinetRepresentativeId: c.representative_id ?? null,
            reps: []
          });
        }
        const g = map.get(key)!;
        if (!g.reps.some(x => x.id === r.id)) {
          g.reps.push({ id: r.id, name: r.name });
        }

        if (c.representative_id) {
          cabinetRepIds.add(c.representative_id);
        }
      }
    }

    const noCabinetKey = `null|No cabinet`;
    if (map.has(noCabinetKey)) {
      const g = map.get(noCabinetKey)!;
      g.reps = g.reps.filter(r => !cabinetRepIds.has(r.id));
    }

    const groups = Array.from(map.values())
      .sort((a, b) => {
        if ((a.cabinetName || '') === 'No cabinet') return 1;
        if ((b.cabinetName || '') === 'No cabinet') return -1;
        return (a.cabinetName || '').localeCompare(b.cabinetName || '');
      });

    return groups;
  }

  areAllCabinetsSelectedExceptNo(): boolean {
    const validGroups = this.filteredCabinetGroups.filter(g => g.cabinetName !== 'No cabinet');
    if (validGroups.length === 0) return false;
    return validGroups.every(g => this.isCabinetAllSelected(g));
  }

  toggleAllCabinetsExceptNo() {
    const validGroups = this.filteredCabinetGroups.filter(g => g.cabinetName !== 'No cabinet');
    const allSelected = validGroups.every(g => this.isCabinetAllSelected(g));

    validGroups.forEach(group => {
      const reps = this.groupAllIds(group);
      reps.forEach(rep => {
        const idx = this.selectedCommissioners.findIndex(s => s.id === rep.id);
        if (allSelected && idx >= 0) {
          // deseleziona
          this.selectedCommissioners.splice(idx, 1);
        } else if (!allSelected && idx === -1) {
          // seleziona
          this.selectedCommissioners.push({ id: rep.id, name: rep.name });
        }
      });
    });
  }

  private norm(v: any): string {
    return (v ?? '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  page = 1;
  pageSize = 100;
  pageInput = 1;

  get paginatedLobbyists() {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredLobbyists.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filteredLobbyists.length / this.pageSize);
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.pageInput = this.page;
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.pageInput = this.page;
    }
  }

  goFirst() {
    this.page = 1;
    this.pageInput = this.page;
  }

  goLast() {
    this.page = this.totalPages;
    this.pageInput = this.page;
  }

  goToPage() {
    const target = Math.min(Math.max(1, this.pageInput), this.totalPages);
    this.page = target;
    this.pageInput = target;
  }

  trackByLobbyist(index: number, item: any): number {
    return item.lobbyist_id; // ID univoco
  }


}

interface CabinetLink {
  id: number | null;
  name: string | null;
  representative_id: number | null;
}

interface RepresentativeWithCabinets {
  id: number;
  name: string;
  cabinets: CabinetLink[];
}

interface CabinetGroup {
  cabinetId: number | null;
  cabinetName: string | null;
  cabinetRepresentativeId: number | null;
  reps: { id: number; name: string }[];
}

