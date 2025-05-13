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
import { SelectionService } from '../services/selection.service';
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
  private selectedNodes: Set<string> = new Set();
  public selectedSimilarity: number | null = null;
  private textSimilarities: TextSimilarity[] = [];
  private hasFetchedTextSimilarities: boolean = false;
  public isTextGraphLoading: boolean = false;
  selectedLink: { source: string; target: string } | undefined = undefined;
  commonFields: string[] = [];
  sourceName: string = '';
  targetName: string = '';

  formattedMeetings: {
    lobbyist_id: string;
    lobbyist_name: string;
    fieldVector: number[];
  }[] = [];

  lobbyistTexts: { id: string, name: string, text: string, vector: number[] }[] = [];

  minThreshold: number = 0.1;
  maxThreshold: number = 1.0;
  zoomLevel: number = 100;
  labelFontSize: number = 12;
  chargeStrength: number = -100;

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
          requestAnimationFrame(() => this.updateGraph());
          this.loadLobbyistTexts();
        },
        error => console.error('Errore nel recupero dei dettagli per i lobbisti:', error)
      );
    });

    this.selectionService.selectedNodes$.subscribe(nodes => {
      this.selectedNodes = new Set(nodes.map(n => n.id));
      this.d3Service.updateForceGraphStyles(this.selectedNodes, this.selectedLink);
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

  private loadLobbyistTexts(): void {
    const textRequests = this.formattedMeetings.map(lobbyist =>
      this.dataService.getLobbyistText(lobbyist.lobbyist_id).pipe(
        tap({
          next: response => {
            console.log(`✅ Testo ricevuto per ${lobbyist.lobbyist_id}:`, response.text);
          },
          error: error => {
            console.warn(`⚠️ Testo NON trovato per ${lobbyist.lobbyist_id}`);
          }
        })
      )
    );
  
    forkJoin(textRequests).subscribe({
      next: responses => {
        this.lobbyistTexts = responses.map((response, index) => {
          const lobbyist = this.formattedMeetings[index];
          const text = response?.text || '';
          const filteredText = this.filterTextByDate(text, this.startDate, this.endDate);
          return {
            id: lobbyist.lobbyist_id,
            name: lobbyist.lobbyist_name,
            text: filteredText,
            vector: []
          };
        });
  
        console.log('📋 Tutti i testi caricati:', this.lobbyistTexts);
        requestAnimationFrame(() => this.updateGraph());
      },
      error: error => {
        console.error('❗ Errore durante il caricamento dei testi:', error);
      }
    });
  }
  

  private filterTextByDate(text: string, startDate: Date, endDate: Date): string {
    const lines = text.split('\n');
    const filteredSentences: string[] = [];
    let capture = false;
    let currentDate: Date | null = null;
  
    for (const line of lines) {
      const dateMatch = line.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (dateMatch) {
        const [day, month, year] = dateMatch.slice(1).map(Number);
        currentDate = new Date(year, month - 1, day);
        capture = currentDate >= startDate && currentDate <= endDate;
      } else if (capture && line.trim() !== '') {
        filteredSentences.push(line.trim());
      }
    }

    return filteredSentences.join(', ');
  }
  

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return (normA && normB) ? dotProduct / (normA * normB) : 0;
  }

  public updateGraph(): void {
    if (this.graphType === 'interest') {
      this.updateInterestGraph();
    } else {
      this.updateTextGraph();
    }
  }

  private updateInterestGraph(): void {
    const containerEl = this.graphContainer.nativeElement;
    const nodes: Node[] = this.formattedMeetings.map(l => ({ id: l.lobbyist_id, name: l.lobbyist_name }));
    const links: Link[] = [];

    let minSim = Infinity;
    let maxSim = -Infinity;

    for (let i = 0; i < this.formattedMeetings.length; i++) {
      for (let j = i + 1; j < this.formattedMeetings.length; j++) {

        const sim = this.cosineSimilarity(this.formattedMeetings[i].fieldVector, this.formattedMeetings[j].fieldVector);
        if (sim > 0 && sim >= this.minThreshold && sim <= this.maxThreshold) {
          links.push({ source: this.formattedMeetings[i].lobbyist_id, target: this.formattedMeetings[j].lobbyist_id, similarity: sim });
          minSim = Math.min(minSim, sim);
          maxSim = Math.max(maxSim, sim);
        }

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
        selectedNodes: this.selectedNodes,
        onNodeClick: (d: any) => this.onNodeClick({ id: d.id, type: 'lobbyist' }),
        onRightClick: (d: any) => this.onNodeRightClick(d),
        onLinkRightClick: (link: any) => this.onLinkRightClick(link)
      }
    );
  }

  private updateTextGraph(): void {
  const containerEl = this.graphContainer.nativeElement;
  const nodes: Node[] = this.lobbyistTexts.map(l => ({ id: l.id, name: l.name }));

  if (this.textSimilarities.length > 0) {
    this.drawTextGraph(containerEl, nodes, this.textSimilarities);
    return;
  }

  this.isTextGraphLoading = true;

  setTimeout(() => {
    const texts = this.lobbyistTexts.map(l => ({ id: l.id, text: l.text }));

    console.log('📦 Payload che mando al backend:', JSON.stringify({ texts }, null, 2));

    this.dataService.getSimilarities(texts).subscribe({
      next: response => {
        this.isTextGraphLoading = false;
        console.log('✅ Risposta ricevuta dal backend:', response);

        const similarities = response.similarities;
        if (!similarities || !Array.isArray(similarities)) {
          console.error('❗ La risposta non contiene similarities o non è un array.');
          return;
        }

        this.textSimilarities = similarities;
        this.drawTextGraph(containerEl, nodes, this.textSimilarities);
      },
      error: error => {
        this.isTextGraphLoading = false;
        console.error('❗ Errore nella chiamata getSimilarities:', error);
      }
    });
  }, 0);
}


  private drawTextGraph(containerEl: HTMLElement, nodes: Node[], similarities: { lobbyist1: string; lobbyist2: string; similarity?: number }[]): void {
    const links: Link[] = [];
  
    let minSim = Infinity;
    let maxSim = -Infinity;
  
    for (const sim of similarities) {
      if (typeof sim.similarity !== 'number') {
        continue; // Skippa se la similarità non è definita
      }
      if (sim.similarity >= this.minThreshold && sim.similarity <= this.maxThreshold) {
        links.push({
          source: sim.lobbyist1,
          target: sim.lobbyist2,
          similarity: sim.similarity
        });
        minSim = Math.min(minSim, sim.similarity);
        maxSim = Math.max(maxSim, sim.similarity);
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
        selectedNodes: this.selectedNodes,
        onNodeClick: (d: any) => this.onNodeClick({ id: d.id, type: 'lobbyist' }),
        onRightClick: (d: any) => this.onNodeRightClick(d),
        onLinkRightClick: (link: any) => this.onLinkRightClick(link)
      }
    );
  }
  
  
  public onNodeClick(entity: { id: string; type: string }): void {
    this.nodeSelected.emit(entity);
  }

  private onNodeRightClick(d: any): void {
    const isSelected = this.selectedNodes.has(d.id);
    const newSelectedNodes = new Set(this.selectedNodes);
  
    if (isSelected) {
      newSelectedNodes.delete(d.id);
      this.selectionService.deselectNode(d.id);
    } else {
      newSelectedNodes.add(d.id);
      this.selectionService.selectNode({ id: d.id, type: 'lobbyist' });
    }  
    this.selectedNodes = newSelectedNodes;

    this.d3Service.updateForceGraphStyles(this.selectedNodes, this.selectedLink);  
  }
  

  public onLinkRightClick(link: any): void {
    this.selectedLink = {
      source: typeof link.source === 'object' ? link.source.id : link.source,
      target: typeof link.target === 'object' ? link.target.id : link.target,
    };

    this.selectedSimilarity = typeof link.similarity === 'number' ? link.similarity : null;


    const sourceNode = this.formattedMeetings.find(m => m.lobbyist_id === this.selectedLink!.source);
    const targetNode = this.formattedMeetings.find(m => m.lobbyist_id === this.selectedLink!.target);

    if (sourceNode && targetNode) {
      this.sourceName = sourceNode.lobbyist_name;
      this.targetName = targetNode.lobbyist_name;

    if (this.graphType === 'text') {
      // Ottieni le parole chiave dalla risposta già presente
      const similarity = this.textSimilarities.find(s =>
        (s.lobbyist1 === this.selectedLink!.source && s.lobbyist2 === this.selectedLink!.target) ||
        (s.lobbyist1 === this.selectedLink!.target && s.lobbyist2 === this.selectedLink!.source)
      );

      if (similarity && Array.isArray(similarity.shared_keywords)) {
        this.commonFields = similarity.shared_keywords;
      } else {
        this.commonFields = [];
      }
    } else {
      // Recupera campi di interesse
      Promise.all([
        this.dataService.getLobbyistFieldOfInterest(sourceNode.lobbyist_id).toPromise(),
        this.dataService.getLobbyistFieldOfInterest(targetNode.lobbyist_id).toPromise()
      ])
      .then(([sourceFieldsRaw, targetFieldsRaw]) => {
        const sourceFields = sourceFieldsRaw || [];
        const targetFields = targetFieldsRaw || [];
        const sourceFieldIds = new Set(sourceFields.map((f: { field_id: number, field_name: string }) => f.field_id));
        const commonFields = targetFields.filter((f: { field_id: number, field_name: string }) => sourceFieldIds.has(f.field_id));
        this.commonFields = commonFields.map((f: { field_id: number, field_name: string }) => f.field_name);
      })
      .catch(error => {
        console.error('Errore nel recupero dei campi:', error);
        this.commonFields = [];
      });
    }
    } else {
      this.commonFields = [];
      this.sourceName = '';
      this.targetName = '';
    }

    this.d3Service.updateForceGraphStyles(this.selectedNodes, this.selectedLink);
  }

  public onMinThresholdChange(): void {
    if (this.minThreshold >= this.maxThreshold) {
      this.minThreshold = this.maxThreshold - 0.01;
    }
    this.updateGraph();
  }

  public onMaxThresholdChange(): void {
    if (this.maxThreshold <= this.minThreshold) {
      this.maxThreshold = this.minThreshold + 0.01;
    }
    this.updateGraph();
  }

  public onLabelFontSizeChange(): void {
    this.d3Service.setLabelFontSize(this.labelFontSize);
  }

  public onChargeStrengthChange(): void {
    this.d3Service.updateChargeStrength(this.chargeStrength);
  }


  public onGraphTypeSwitchChange(): void {
    this.graphType = this.isTextGraph ? 'text' : 'interest';
    this.updateGraph();
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
  }
}
