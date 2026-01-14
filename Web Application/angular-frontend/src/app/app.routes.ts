import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { WelcomeGuard } from './guards/welcome.guard';

export const routes: Routes = [
  { path: 'welcome', component: WelcomeComponent },
  {
    path: '',
    component: DashboardComponent,
    canActivate: [WelcomeGuard]
  },
  { path: '**', redirectTo: '' }
];
