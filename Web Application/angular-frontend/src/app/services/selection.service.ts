import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SelectedNode {
  id: string;
  type: 'lobbyist' | 'representative' | 'directorate' | 'meeting';
}

export interface ActiveInfoTab {
  id: string | null;
  type: 'meeting' | 'lobbyist' | 'lobbyist-meeting' | null;
}

export interface ActiveHistogramTab {
  id: string | null;
  type: 'representative' | 'directorate' | 'representative-directorate' | null;
}

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  private selectedNodes = new Set<string>();
  private selectedNodesSubject = new BehaviorSubject<SelectedNode[]>([]);
  selectedNodes$ = this.selectedNodesSubject.asObservable();

  private infoTabSubject = new BehaviorSubject<ActiveInfoTab | null>(null);
  activeInfoTab$ = this.infoTabSubject.asObservable();

  private histogramTabSubject = new BehaviorSubject<ActiveHistogramTab | null>(null);
  activeHistogramTab$ = this.histogramTabSubject.asObservable();

  selectNode(node: SelectedNode) {
    this.selectedNodes.add(node.id);
    this.emit();
  }

  deselectNode(id: string) {
    this.selectedNodes.delete(id);
    this.emit();
  }

  toggleNode(node: SelectedNode) {
    if (this.selectedNodes.has(node.id)) {
      this.deselectNode(node.id);
    } else {
      this.selectNode(node);
    }
  }

  private emit() {
    this.selectedNodesSubject.next(Array.from(this.selectedNodes).map(id => ({ id, type: 'lobbyist' })));
  }

  clearAll() {
    this.selectedNodes.clear();
    this.emit();
  }

  setActiveInfoTab(tab: ActiveInfoTab | null) {
    this.infoTabSubject.next(tab);
  }

  setActiveHistogramTab(tab: ActiveHistogramTab | null) {
    this.histogramTabSubject.next(tab);
  }
}
