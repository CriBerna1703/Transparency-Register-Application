import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild
} from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FilterService } from '../services/filter.service';
import { DataService } from '../services/data.service';
import { D3Service } from '../services/d3.service';
import { SelectionService, SelectedNode } from '../services/selection.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as d3 from 'd3';

interface Node {
  id: string;
  name: string;
  x?: number;
  y?: number;
  degree?: number;
}

interface Link {
  source: string;
  target: string;
  similarity: number;
}

interface TextSimilarity {
  lobbyist1: string;
  lobbyist2: string;
  similarity: number;
  shared_keywords: string[];
  similarity_cosine?: number;
  similarity_jaccard?: number;
  similarity_NumJaccard?: number;
}

interface KeywordWithScore {
  word: string;
  score: number;
}

@Component({
  selector: 'app-graph-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './graph-view.component.html',
  styleUrls: ['./graph-view.component.css']
})
export class GraphViewComponent implements OnInit, OnDestroy {
  @Output() nodeSelected = new EventEmitter<{ id: string; type: string }>();
  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef;

  private meetingsSubscription: Subscription | undefined;
  private selectionSubscription!: Subscription;
  public selectedSimilarity: number | null = null;
  private textSimilarities: TextSimilarity[] = [];
  public isTextGraphLoading: boolean = false;
  public selectedNodes: SelectedNode[] = [];
  public selectedKeywords: KeywordWithScore[] = [];
  public selectedFilterValues: (number | string)[] = [];
  public selectedInterestFilterValues: number[] = [];
  public selectedTextFilterValues: string[] = [];
  public availableFilterOptions: { id: number | string, label: string }[] = []; // parole o campi da mostrare nel menu
  public fieldMap: Map<number, string> = new Map();
  public dropdownOpen: boolean = false;
  public selectAllInterestChecked: boolean = true;
  public selectAllTextChecked: boolean = true;
  public showLeftPanel: boolean = true;
  public showRightPanel: boolean = true;
  public simulationRunning: boolean = true;
  public HoverEffectButtonRedrawGraph = false;



  public keywordSortOrder: 'abc' | 'score' = 'abc';

  public selectedTextMetric: 'similarity_cosine' | 'similarity_jaccard' = 'similarity_cosine';
  selectedLink: { source: string; target: string } | undefined = undefined;
  filterGraphApplied: boolean = false;
  commonFields: string[] = [];
  sourceName: string = '';
  targetName: string = '';

  formattedMeetings: {
    lobbyist_id: string;
    lobbyist_name: string;
    fieldVector: number[];
  }[] = [];

  minThreshold: number = 0.8;
  maxThreshold: number = 1.0;
  zoomLevel: number = 0.3;
  labelFontSize: number = 60;
  NodeSize: number = 20;


  startDate: Date = new Date(0);
  endDate: Date = new Date();

  graphType: 'interest' | 'text' = 'interest';
  isTextGraph: boolean = false;

  constructor(
    private filterService: FilterService,
    private dataService: DataService,
    private d3Service: D3Service,
    private selectionService: SelectionService
  ) {}

  ngOnInit(): void {
    this.meetingsSubscription = this.filterService.meetings$.subscribe(meetings => {
      const meetingLobbyists = meetings.map(meeting => ({
        lobbyist_id: meeting.lobbyist_id,
        lobbyist_name: meeting.Lobbyist.organization_name
      }));

      const uniqueLobbyistsMap = new Map<string, string>();
      meetingLobbyists.forEach(lobbyist => {
        if (!uniqueLobbyistsMap.has(lobbyist.lobbyist_id)) {
          uniqueLobbyistsMap.set(lobbyist.lobbyist_id, lobbyist.lobbyist_name);
        }
      });

      this.textSimilarities = [];

      this.formattedMeetings = Array.from(uniqueLobbyistsMap, ([lobbyist_id, lobbyist_name]) => ({
        lobbyist_id,
        lobbyist_name,
        fieldVector: new Array(40).fill(0)
      })).sort((a, b) => a.lobbyist_name.localeCompare(b.lobbyist_name));

      const dates = meetings.map(m => new Date(m.meeting_date));
      this.startDate = new Date(Math.min(...dates.map(d => d.getTime())));
      this.endDate = new Date(Math.max(...dates.map(d => d.getTime())));

      const observables = this.formattedMeetings.map(lobbyist =>
        this.dataService.getLobbyistFieldOfInterest(lobbyist.lobbyist_id).pipe(
          tap(details => {
            lobbyist.fieldVector = this.generateFieldVector(details);
          })
        )
      );

      forkJoin(observables).subscribe(
        () => {
          this.updateGraph(); // per interesse
          this.callGetSimilarities(); // ✅ ora è sicuro farlo qui
        },
        error => console.error('Errore nel recupero dei dettagli per i lobbisti:', error)
      );
    });



    this.selectionSubscription = this.selectionService.selectedNodes$.subscribe(nodes => {
      this.selectedNodes = nodes;
      this.d3Service.updateNodeSelection(nodes);
    });

    this.dataService.getFields().subscribe(fields => {
      this.fieldMap = new Map(fields.map((f: any) => [f.field_id, f.field_name]));
    });
  }


  private generateFieldVector(fields: { field_id: number, field_name: string }[]): number[] {
    const vector = new Array(40).fill(0);
    fields.forEach(field => {
      if (field.field_id >= 1 && field.field_id <= 40) {
        vector[field.field_id - 1] = 1;
      }
    });
    return vector;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return (normA && normB) ? dotProduct / (normA * normB) : 0;
  }
  
  public updateGraph(): void {
    if (this.graphType === 'interest') {
    const allOptions = this.getAllInterestFields();

      if (!this.filterGraphApplied && this.selectedFilterValues.length === 0) {
        this.selectedFilterValues = allOptions.map(opt => opt.id);
      }

      this.availableFilterOptions = allOptions;
      this.updateInterestGraph();
    } else {
      const allOptions = this.getSortedKeywords();

      if (!this.filterGraphApplied && this.selectedFilterValues.length === 0) {
        this.selectedFilterValues = allOptions.map(opt => opt.id);
      }

      this.availableFilterOptions = allOptions;
      this.updateTextGraph();
    }

  } 

  public getKeywordScore(word: string | number): string {
    const match = this.selectedKeywords.find(k => k.word === String(word));
    return match ? match.score.toFixed(3) : '';
  }

  private getSortedKeywords(): { id: string, label: string }[] {
    const sorted = [...this.selectedKeywords];

    if (this.keywordSortOrder === 'abc') {
      sorted.sort((a, b) => a.word.localeCompare(b.word));
    } else {
      sorted.sort((a, b) => b.score - a.score);
    }

    return sorted.map(kw => ({
      id: kw.word,
      label: `${kw.word} (${kw.score.toFixed(3)})`
    }));
  }

  public onKeywordSortChange(order: 'abc' | 'score'): void {
    this.keywordSortOrder = order;
    if (this.graphType === 'text') {
      this.availableFilterOptions = this.getSortedKeywords();
    }
  }

  private updateInterestGraph(): void {
  const containerEl = this.graphContainer.nativeElement;
  const nodes: Node[] = this.formattedMeetings.map(l => ({
    id: l.lobbyist_id,
    name: l.lobbyist_name
  }));

  const allSimilarities: {
    source: string;
    target: string;
    sim: number;
    sharedFieldIds: number[];
  }[] = [];

  for (let i = 0; i < this.formattedMeetings.length; i++) {
    for (let j = i + 1; j < this.formattedMeetings.length; j++) {
      const sim = this.cosineSimilarity(
        this.formattedMeetings[i].fieldVector,
        this.formattedMeetings[j].fieldVector
      );

      if (sim > 0) {
        const sharedFieldIds = this.formattedMeetings[i].fieldVector
          .map((v, idx) => v === 1 && this.formattedMeetings[j].fieldVector[idx] === 1 ? idx + 1 : null)
          .filter((id): id is number => id !== null);

        allSimilarities.push({
          source: this.formattedMeetings[i].lobbyist_id,
          target: this.formattedMeetings[j].lobbyist_id,
          sim,
          sharedFieldIds
        });
      }
    }
  }

  const links: Link[] = [];
  let minSim = Infinity;
  let maxSim = -Infinity;

  for (const s of allSimilarities) {
    if (
      s.sim >= this.minThreshold &&
      s.sim <= this.maxThreshold &&
      s.sharedFieldIds.some(id => this.selectedFilterValues.includes(id))
    ) {
      links.push({
        source: s.source,
        target: s.target,
        similarity: s.sim
      });

      minSim = Math.min(minSim, s.sim);
      maxSim = Math.max(maxSim, s.sim);
    }
  }

  this.d3Service.drawForceGraph(
        containerEl,
        nodes,
        links,
        {
          width: containerEl.offsetWidth,
          height: 600,
          zoomLevel: this.zoomLevel,
          minSim,
          maxSim,
          SelectedNode: this.selectedNodes,
          onNodeClick: (d: any) => this.onNodeClick({ id: d.id, type: 'lobbyist' }),
          onLinkLeftClick: (link: any) => this.onLinkLeftClick(link),
          onNodeRightClick: (node: any) => this.onNodeRightClick(node)
        }
      );
  
}

  private updateTextGraph(): void {
    const containerEl = this.graphContainer.nativeElement;
    const nodes: Node[] = this.formattedMeetings.map(l => ({ id: l.lobbyist_id, name: l.lobbyist_name }));

    if (this.textSimilarities.length > 0) {
      this.drawTextGraph(containerEl, nodes, this.textSimilarities);
      return;
    }

    this.isTextGraphLoading = true;
  }

  private drawTextGraph(containerEl: HTMLElement, nodes: Node[], similarities: TextSimilarity[]): void {
    const links: Link[] = [];
    let minSim = Infinity;
    let maxSim = -Infinity;


    for (const sim of similarities) {
      const value = sim[this.selectedTextMetric] as number;
      if (
        typeof value === 'number' &&
        value > 0 &&
        value >= this.minThreshold &&
        value <= this.maxThreshold &&
        (
          sim.shared_keywords?.some(keyword => this.selectedFilterValues.includes(keyword))
        )
      ) {
        links.push({
          source: sim.lobbyist1,
          target: sim.lobbyist2,
          similarity: value
        });
        minSim = Math.min(minSim, value);
        maxSim = Math.max(maxSim, value);
      }
    }

    this.d3Service.drawForceGraph(
      containerEl,
      nodes,
      links,
      {
        width: containerEl.offsetWidth,
        height: 600,
        zoomLevel: this.zoomLevel,
        minSim,
        maxSim,
        SelectedNode: this.selectedNodes,
        onNodeClick: (d: any) => this.onNodeClick({ id: d.id, type: 'lobbyist' }),
        onLinkLeftClick: (link: any) => this.onLinkLeftClick(link),
        onNodeRightClick: (node: any) => this.onNodeRightClick(node)
      }
    );
  }

  public onNodeClick(entity: { id: string; type: string }): void {
    this.nodeSelected.emit(entity);
  }

  public onNodeRightClick(node: any): void {
    const clickedNode: SelectedNode = {
      id: node.id,
      type: 'lobbyist'
    };

    this.selectionService.toggleNode(clickedNode);
  }

  public onLinkLeftClick(link: any): void {

    if(this.showRightPanel === false) {
      this.showRightPanel = true;
    }
    const clickedLink = {
      source: typeof link.source === 'object' ? link.source.id : link.source,
      target: typeof link.target === 'object' ? link.target.id : link.target,
    };

    // Verifica se è già selezionato
    const isSameLink =
      this.selectedLink &&
      ((this.selectedLink.source === clickedLink.source && this.selectedLink.target === clickedLink.target) ||
      (this.selectedLink.source === clickedLink.target && this.selectedLink.target === clickedLink.source));

    if (isSameLink) {
      // Deseleziona
      this.selectedLink = undefined;
      this.selectedSimilarity = null;
      this.commonFields = [];
      this.sourceName = '';
      this.targetName = '';
    } else {
      // Nuova selezione
      this.selectedLink = clickedLink;
      this.selectedSimilarity = typeof link.similarity === 'number' ? link.similarity : null;

      const sourceNode = this.formattedMeetings.find(m => m.lobbyist_id === clickedLink.source);
      const targetNode = this.formattedMeetings.find(m => m.lobbyist_id === clickedLink.target);

      this.sourceName = sourceNode?.lobbyist_name ?? '';
      this.targetName = targetNode?.lobbyist_name ?? '';

      if (this.graphType === 'text') {
        const similarity = this.textSimilarities.find(s =>
          (s.lobbyist1 === clickedLink.source && s.lobbyist2 === clickedLink.target) ||
          (s.lobbyist1 === clickedLink.target && s.lobbyist2 === clickedLink.source)
        );
        this.commonFields = similarity?.shared_keywords || [];
      } else {
        Promise.all([
          this.dataService.getLobbyistFieldOfInterest(clickedLink.source).toPromise(),
          this.dataService.getLobbyistFieldOfInterest(clickedLink.target).toPromise()
        ])
        .then(([sFields, tFields]) => {
          const sSet = new Set((sFields as { field_id: number }[]).map(f => f.field_id));
          this.commonFields = (tFields as { field_id: number, field_name: string }[])
            .filter(f => sSet.has(f.field_id))
            .map(f => f.field_name);
        })
        .catch(error => {
          console.error('Errore nel recupero dei campi:', error);
          this.commonFields = [];
        });
      }
    }

    this.d3Service.updateForceGraphStyles(this.selectedLink);
  }

  private getAllInterestFields(): { id: number, label: string }[] {
    const fieldIds = new Set<number>();

    this.formattedMeetings.forEach(meeting => {
      meeting.fieldVector.forEach((v, i) => {
        if (v === 1) fieldIds.add(i + 1);
      });
    });

    return Array.from(fieldIds)
      .map(id => ({
        id,
        label: this.fieldMap.get(id) || `Field ${id}`
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  public onMinThresholdChange(): void {
    if (this.minThreshold >= this.maxThreshold) {
      this.minThreshold = this.maxThreshold - 0.01;
    }
    this.applyThresholOrFiltersdAndUpdate();
  }

  public onMaxThresholdChange(): void {
    if (this.maxThreshold <= this.minThreshold) {
      this.maxThreshold = this.minThreshold + 0.01;
    }
    this.applyThresholOrFiltersdAndUpdate();
  }

  private applyThresholOrFiltersdAndUpdate(): void {
    if(!this.simulationRunning){
      const filteredLinks = this.getFilteredLinks();
      this.d3Service.updateGraphLinksOnly(filteredLinks);
    }else {
      const filteredLinks = this.getFilteredLinks();
      this.d3Service.updateGraphLinksOnly(filteredLinks);
      this.d3Service.recomputeGraphStructure();
    }
  }

  public onLabelFontSizeChange(): void {
    this.d3Service.setLabelFontSize(this.labelFontSize);
  }

  public onNodeSizeChange(): void {
    this.d3Service.setNodeSize(this.NodeSize);
  }

  private callGetSimilarities(): void {
    const formatDate = (date: Date): string => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const payload = {
      startDate: formatDate(this.startDate),
      endDate: formatDate(this.endDate),
      lobbyist_ids: this.formattedMeetings.map(m => m.lobbyist_id)
    };


    if (this.graphType === 'text') {
      this.isTextGraphLoading = true;
    }

    this.dataService.getSimilarities(payload).subscribe({
      next: response => {
        this.isTextGraphLoading = false;

        if (!Array.isArray(response.similarities)) {
          console.error('❗ Risposta non valida:', response);
          return;
        }

        this.textSimilarities = response.similarities;
        this.selectedKeywords = Array.isArray(response.selected_keywords)
          ? response.selected_keywords
          : [];

        if (this.graphType === 'text') {
          this.availableFilterOptions = this.selectedKeywords.map(kw => ({
            id: kw.word,
            label: `${kw.word} (${kw.score.toFixed(3)})`
          }));
        }

        if (this.graphType === 'text' && this.selectedFilterValues.length === 0) {
          this.selectedFilterValues = this.availableFilterOptions.map(opt => opt.id);
        }

        if (this.graphType === 'text') {
          this.updateGraph();
        }
      },
      error: error => {
        this.isTextGraphLoading = false;
        console.error('❗ Errore nella chiamata getSimilarities:', error);
      }
    });
  }


private getFilteredLinks(): Link[] {
  if (this.graphType === 'interest') {
    const allLinks: Link[] = [];

    for (let i = 0; i < this.formattedMeetings.length; i++) {
      for (let j = i + 1; j < this.formattedMeetings.length; j++) {
        const sim = this.cosineSimilarity(
          this.formattedMeetings[i].fieldVector,
          this.formattedMeetings[j].fieldVector
        );

        if (sim > 0) {
          const sharedFieldIds = this.formattedMeetings[i].fieldVector
            .map((v, idx) => v === 1 && this.formattedMeetings[j].fieldVector[idx] === 1 ? idx + 1 : null)
            .filter((id): id is number => id !== null);

          if (
            sim >= this.minThreshold &&
            sim <= this.maxThreshold &&
            sharedFieldIds.some(id => this.selectedFilterValues.includes(id))
          ) {
            allLinks.push({
              source: this.formattedMeetings[i].lobbyist_id,
              target: this.formattedMeetings[j].lobbyist_id,
              similarity: sim
            });
          }
        }
      }
    }

    return allLinks;
  }

  if (this.graphType === 'text') {
    return this.textSimilarities
      .filter(sim => {
        const value = sim[this.selectedTextMetric] as number;
        return (
          typeof value === 'number' &&
          value >= this.minThreshold &&
          value <= this.maxThreshold &&
          sim.shared_keywords?.some(keyword => this.selectedFilterValues.includes(keyword))
        );
      })
      .map(sim => ({
        source: sim.lobbyist1,
        target: sim.lobbyist2,
        similarity: sim[this.selectedTextMetric] as number
      }));
  }

  return [];
}




  public onFilterToggle(value: number | string, checked: boolean): void {
    if (checked) {
      if (!this.selectedFilterValues.includes(value)) {
        this.selectedFilterValues = [...this.selectedFilterValues, value];
      }
    } else {
      this.selectedFilterValues = this.selectedFilterValues.filter(v => v !== value);
    }

    const allSelected = this.availableFilterOptions.length > 0 &&
      this.availableFilterOptions.every(opt => this.selectedFilterValues.includes(opt.id));

    if (this.graphType === 'interest') {
      this.selectAllInterestChecked = allSelected;
    } else {
      this.selectAllTextChecked = allSelected;
    }

    if (this.graphType === 'interest') {
      this.selectAllInterestChecked = allSelected;
      this.selectedInterestFilterValues = [...this.selectedFilterValues as number[]];
    } else {
      this.selectAllTextChecked = allSelected;
      this.selectedTextFilterValues = [...this.selectedFilterValues as string[]];
    }
  }


  public toggleAllFilters(type: 'interest' | 'text'): void {
    const allSelected = this.availableFilterOptions.length > 0 &&
      this.availableFilterOptions.every(opt => this.selectedFilterValues.includes(opt.id));

    if (allSelected) {
      this.selectedFilterValues = [];
      if (type === 'interest') {
        this.selectAllInterestChecked = false;
      } else {
        this.selectAllTextChecked = false;
      }
    } else {
      this.selectedFilterValues = this.availableFilterOptions.map(opt => opt.id);
      if (type === 'interest') {
        this.selectAllInterestChecked = true;
      } else {
        this.selectAllTextChecked = true;
      }
    }

    if (type === 'interest') {
      this.selectedInterestFilterValues = [...this.selectedFilterValues as number[]];
    } else {
      this.selectedTextFilterValues = [...this.selectedFilterValues as string[]];
    }

  }

  onSimulationToggle(running: boolean): void {
    this.d3Service.setSimulationRunning(running);
  }


  public allFilterSelected(): boolean {
    return this.availableFilterOptions.length > 0 &&
      this.availableFilterOptions.every(opt => this.selectedFilterValues.includes(opt.id));
  }

  public onGraphTypeSwitchChange(): void {
    if (this.graphType === 'interest') {
      this.selectedInterestFilterValues = [...this.selectedFilterValues as number[]];
    } else {
      this.selectedTextFilterValues = [...this.selectedFilterValues as string[]];
    }

    // Cambia il tipo di grafo
    this.graphType = this.isTextGraph ? 'text' : 'interest';

    // Ripristina la selezione precedente
    if (this.graphType === 'interest') {
      this.selectedFilterValues = [...this.selectedInterestFilterValues];
    } else {
      this.selectedFilterValues = [...this.selectedTextFilterValues];
    }

    this.simulationRunning = true; 
    this.updateGraph();
    this.d3Service.centerAfterSimulation();
  }


  public applyFilters(): void {
    this.filterGraphApplied = true;
    this.applyThresholOrFiltersdAndUpdate();
  }

  redrawGraph(): void {
    this.updateGraph();
    this.simulationRunning = true; 
  }

  fitGraph(): void {
    this.d3Service.centerGraph();
  }
  ngAfterViewInit(): void {
    const container = this.graphContainer.nativeElement;

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        this.updateGraph();
        resizeObserver.disconnect();
      }
    });

    resizeObserver.observe(container);
  }

  ngOnDestroy(): void {
    this.meetingsSubscription?.unsubscribe();
    this.selectionSubscription?.unsubscribe();
  }
}
