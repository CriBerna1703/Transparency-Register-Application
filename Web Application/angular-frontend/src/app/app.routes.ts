import { Routes } from '@angular/router';
import { FilterMaskComponent } from './filter-mask/filter-mask.component';
import { GraphViewComponent } from './graph-view/graph-view.component';
import { TemporalViewComponent } from './temporal-view/temporal-view.component';

export const routes: Routes = [
  { path: 'filter', component: FilterMaskComponent },
  { path: 'graph', component: GraphViewComponent },
  { path: 'temporal', component: TemporalViewComponent },
  { path: '', redirectTo: '/graph', pathMatch: 'full' }
];