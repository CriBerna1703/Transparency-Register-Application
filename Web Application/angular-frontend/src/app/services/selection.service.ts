import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SelectedNode {
  id: string;
  type: 'lobbyist' | 'representative' | 'directorate' | 'meeting' | 'cabinet';
}

export interface ActiveInfoTab {
  id: string | null;
  type: 'meeting' | 'lobbyist' | 'lobbyist-meeting' | null;
}

export interface ActiveHistogramTab {
  id: string | null;
  type: 'representative' | 'directorate' | 'cabinet' | 'representative-directorate-cabinet' | null;
}

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  private selectedNodes = new Map<SelectedNode['type'], Set<string>>();
  private selectedNodesSubject = new BehaviorSubject<SelectedNode[]>([]);
  selectedNodes$ = this.selectedNodesSubject.asObservable();

  private infoTabSubject = new BehaviorSubject<ActiveInfoTab | null>(null);
  activeInfoTab$ = this.infoTabSubject.asObservable();

  private histogramTabSubject = new BehaviorSubject<ActiveHistogramTab | null>(null);
  activeHistogramTab$ = this.histogramTabSubject.asObservable();

  selectNode(node: SelectedNode) {
    if (!this.selectedNodes.has(node.type)) {
      this.selectedNodes.set(node.type, new Set<string>());
    }
    this.selectedNodes.get(node.type)!.add(node.id);
    this.emit();
  }

  deselectNode(node: SelectedNode) {
    this.selectedNodes.get(node.type)?.delete(node.id);
    this.emit();
  }

  toggleNode(node: SelectedNode) {
    const set = this.selectedNodes.get(node.type);
    if (set?.has(node.id)) {
      this.deselectNode(node);
    } else {
      this.selectNode(node);
    }
  }

  private emit() {
    const all: SelectedNode[] = [];
    this.selectedNodes.forEach((ids, type) => {
      ids.forEach(id => all.push({ id, type }));
    });
    this.selectedNodesSubject.next(all);
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

  clearSection(type: SelectedNode['type']) {
    this.selectedNodes.delete(type);
    this.emit();
  }
}
