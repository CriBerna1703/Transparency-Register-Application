import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Tab {
  id: string;
  title: string;
}

@Component({
  selector: 'app-tab-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-navigation.component.html',
  styleUrls: ['./tab-navigation.component.css']
})
export class TabNavigationComponent implements AfterViewInit, OnChanges {
  @Input() tabs: Tab[] = [];
  @Input() activeTabId: string | null = null;
  @Input() compact: boolean = false;
  @Input() closable: boolean = true;

  @Output() activeTabChange = new EventEmitter<string>();
  @Output() tabClosed = new EventEmitter<string>();

  @ViewChild('tabTitleContainer', { static: false }) tabTitleContainer!: ElementRef;

  showScrollLeft = false;
  showScrollRight = false;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.checkScroll();
      this.scrollToActiveTab();
    }, 0); // Ensure the view is fully initialized
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tabs'] || changes['activeTabId']) {
      setTimeout(() => {
        this.checkScroll();
        this.scrollToActiveTab();
      }, 0);
    }
  }

  setActiveTab(id: string): void {
    this.activeTabChange.emit(id);
  }

  closeTabClick(event: Event, id: string): void {
    event.stopPropagation();  // Prevent tab activation
    this.tabClosed.emit(id);
  }

  scrollTabs(direction: number): void {
    const container = this.tabTitleContainer?.nativeElement;
    if (container) {
      container.scrollBy({ left: direction, behavior: 'smooth' });
      setTimeout(() => this.checkScroll(), 300); // Delay to complete the scroll
    }
  }

  checkScroll(): void {
    const container = this.tabTitleContainer?.nativeElement;
    if (container) {
      const containerWidth = container.clientWidth;
      const scrollWidth = container.scrollWidth;
      const scrollLeft = container.scrollLeft;

      this.showScrollLeft = scrollLeft > 0;
      this.showScrollRight = scrollWidth > containerWidth + scrollLeft;

      // Check if any tab is partially out of view
      const tabs = container.querySelectorAll('li');
      if (tabs.length > 0) {
        const lastTab = tabs[tabs.length - 1];
        const lastTabRight = lastTab.getBoundingClientRect().right;
        const containerRight = container.getBoundingClientRect().right;
        this.showScrollRight = lastTabRight > containerRight;
      }
    }
  }

  scrollToActiveTab(): void {
    const container = this.tabTitleContainer?.nativeElement;
    if (container && this.activeTabId) {
      const activeTab = container.querySelector(`li.active`);
      if (activeTab) {
        const activeTabLeft = activeTab.getBoundingClientRect().left;
        const containerLeft = container.getBoundingClientRect().left;
        const activeTabRight = activeTab.getBoundingClientRect().right;
        const containerRight = container.getBoundingClientRect().right;

        if (activeTabLeft < containerLeft) {
          container.scrollBy({ left: activeTabLeft - containerLeft, behavior: 'smooth' });
        } else if (activeTabRight > containerRight) {
          container.scrollBy({ left: activeTabRight - containerRight, behavior: 'smooth' });
        }
      }
    }
  }
}