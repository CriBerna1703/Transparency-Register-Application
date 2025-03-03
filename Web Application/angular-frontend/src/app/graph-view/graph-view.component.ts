import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-graph-view',
  imports: [],
  templateUrl: './graph-view.component.html',
  styleUrl: './graph-view.component.css'
})
export class GraphViewComponent {
  @Output() nodeSelected = new EventEmitter<{ id: string; type: string;}>();

  private onNodeClick(entity: { id: string; type: string }): void {
    this.nodeSelected.emit(entity);
  }
}
