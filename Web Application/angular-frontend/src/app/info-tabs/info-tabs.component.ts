import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabNavigationComponent } from '../tab-navigation/tab-navigation.component';
import { DataService } from '../services/data.service';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SelectionService } from '../services/selection.service';

interface Tab {
  id: string;
  type: string;
  title: string;
  content: string;
  data?: any;
  isLoading?: boolean;
  error?: string;
}

@Component({
  selector: 'app-info-tabs',
  standalone: true,
  imports: [CommonModule, FormsModule, TabNavigationComponent],
  templateUrl: './info-tabs.component.html',
  styleUrls: ['./info-tabs.component.css']
})
export class InfoTabsComponent implements OnChanges {
  @Input() selectedEntity: { id: string, type: string } | null = null;
  tabs: Tab[] = [];
  activeTabId: string | null = null;
  activeTabType: string | null = null;

  @ViewChild('tabTitleContainer', { static: false }) tabTitleContainer!: ElementRef;

  constructor(private dataService: DataService, private selectionService: SelectionService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedEntity'] && this.selectedEntity) {
      this.openTab(this.selectedEntity);
    }
  }

  setActiveTab({ id, type }: { id: string | null; type: string | null }): void {
    this.selectionService.setActiveInfoTab(
      {
        id,
        type: (type === 'lobbyist' || type === 'meeting') ? type : 'lobbyist-meeting'
      }
    );
    this.activeTabId = id;
    this.activeTabType = type;
  }

  openTab(entity: { id: string, type: string }): void {
    const isMeeting = entity.type === 'meeting' && entity.id.startsWith('meeting_');
    const isLobbyist = entity.type === 'lobbyist';
    const existingTab = this.tabs.find(tab => tab.id === entity.id && tab.type === entity.type);
  
    if (existingTab) {
      this.setActiveTab({ id: existingTab.id, type: existingTab.type });
    } else {
      const newTab: Tab = {
        id: entity.id,
        type: entity.type,
        title: isLobbyist ? `Lobbyist ${entity.id}` : `Meeting ${entity.id}`,
        content: `Loading...`,
        isLoading: true
      };
  
      this.tabs.push(newTab);
      this.setActiveTab({ id: newTab.id, type: newTab.type });

      // Lobbyist
      if (isLobbyist) {
        this.dataService.getLobbyistDetails(entity.id).pipe(
          tap((data) => {
            newTab.data = data;
            newTab.isLoading = false;
            newTab.title = `Lobbyist ${data.organization_name}`;
            this.tabs = [...this.tabs];
          }),
          catchError((error) => {
            newTab.isLoading = false;
            newTab.error = 'Error retrieving lobbyist information.';
            console.error('Error:', error);
            return of(null);
          })
        ).subscribe();
      }
  
      // Meeting
      if (isMeeting) {
        const idParts = entity.id.split('_');
        const lobbyistId = idParts[1];
        const meetingNumber = idParts[2];
  
        this.dataService.getMeetingByLobbyistAndNumber(lobbyistId, meetingNumber).pipe(
          tap((data) => {
            newTab.data = data;
            newTab.isLoading = false;
            newTab.title = `Meeting on ${new Date(data.meeting_date).toLocaleDateString()}`;
          }),
          catchError((error) => {
            newTab.isLoading = false;
            newTab.error = 'Error retrieving meeting information.';
            console.error('Error:', error);
            return of(null);
          })
        ).subscribe();
      }
    }
  }
  

  closeTab({ id, type }: { id: string; type: string | null; }): void {
    const tabIndex = this.tabs.findIndex(tab => tab.id === id && tab.type === type);
    this.tabs = this.tabs.filter(tab => tab.id !== id || tab.type !== type);

    if (this.activeTabId === id && this.activeTabType === type) {
      if (this.tabs.length) {
        const newIndex = tabIndex > 0 ? tabIndex - 1 : 0;
        this.setActiveTab({ id: this.tabs[newIndex].id, type: this.tabs[newIndex].type });
      } else {
        this.setActiveTab({ id: null, type: null });
      }
    }
  }

  formatBudgetRange(min: number | null, max: number | null): string {
    const INFINITE = 9223372036854775807;

    if (min == null && max == null) {
      return 'No information available';
    }
    
    min = Number(min);
    max = Number(max);

    if (min === 0 && max != null && max !== INFINITE) {
      return `< ${max.toLocaleString('it-IT')} €`;
    }
    if (max === INFINITE && min != null) {
      return `> ${min.toLocaleString('it-IT')} €`;
    }
    if (min != null && max != null) {
      return `${min.toLocaleString('it-IT')} - ${max.toLocaleString('it-IT')} €`;
    }

    return 'No information available';
  }

}
