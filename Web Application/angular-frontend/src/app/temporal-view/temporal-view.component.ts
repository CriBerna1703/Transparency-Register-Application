import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterService } from '../services/filter.service';
import { MeetingManager } from '../services/meeting-manager.service';
import { D3Service } from '../services/d3.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-temporal-view',
  imports: [CommonModule, FormsModule],
  templateUrl: './temporal-view.component.html',
  styleUrls: ['./temporal-view.component.css']
})
export class TemporalViewComponent implements OnInit, OnDestroy, OnChanges {
  @Input() startDate: Date = new Date();
  @Input() endDate: Date = new Date();
  @Output() dateRangeChange = new EventEmitter<{ minDate?: Date, maxDate?: Date , hasMeetings: boolean}>();
  @Input() labelSize: number = 14;
  @Input() zoomLevel: number = 100;
  @Input() showRepresentatives: boolean = true;
  @Output() nodeSelected = new EventEmitter<{ id: string; type: string;}>();
  private meetingsSubscription: Subscription | undefined;
  private lobbyistHeight = 60;
  private representativeHeight = window.innerHeight * 0.3 + 60;
  private directorateHeight = window.innerHeight * 0.3 + 60;
  private meetingHeight = window.innerHeight * 0.15 + 60;
  private selectedNodes: Set<string> = new Set();

  private entityPositions = {
    lobbyist: this.lobbyistHeight,
    representative: this.representativeHeight,
    directorate: this.directorateHeight,
    meeting: this.meetingHeight,
  };

  constructor(
    private filterService: FilterService,
    private meetingManager: MeetingManager,
    private el: ElementRef,
    private d3Service: D3Service,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    window.addEventListener('resize', () => {
      this.createVisualization();
    });
    this.meetingsSubscription = this.filterService.meetings$.subscribe(meetings => {
      const formattedMeetings = meetings.map(meeting => ({
        meeting_number: meeting.meeting_number,
        lobbyist_name: meeting.Lobbyist.organization_name,
        date: new Date(meeting.meeting_date),
        representative_name: meeting.CommissionRepresentative.name,
        lobbyist_id: meeting.lobbyist_id,
        representative_id: meeting.CommissionRepresentative.id,
        directorate_id: meeting.CommissionRepresentative.RepresentativeAllocations?.[0]?.Directorate?.id || "",
        directorate_name: meeting.CommissionRepresentative.RepresentativeAllocations?.[0]?.Directorate?.name || "?"
      }));
    
      this.meetingManager.setMeetingsData(formattedMeetings);
      this.emitDateRange(formattedMeetings);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startDate'] || changes['endDate'] || changes['labelSize'] || changes['showRepresentatives'] || changes['zoomLevel']) {
      this.createVisualization();
    }
  }

  ngOnDestroy(): void {
    if (this.meetingsSubscription) {
      this.meetingsSubscription.unsubscribe();
    }
  }

  public onResize(): void {
    this.createVisualization();
  }

  public onLabelSizeChange(event: Event): void {
    this.labelSize = (event.target as HTMLInputElement).valueAsNumber;
    this.updateLabelSizes();
  }

  private updateLabelSizes(): void {
    const labels = this.el.nativeElement.querySelectorAll('.label-lobbyist, .label-representative, .label-directorate');
    labels.forEach((label: HTMLElement) => {
      label.style.fontSize = `${this.labelSize}px`;
    });
  }

  private emitDateRange(meetings: MeetingData[]): void {
    if (meetings.length === 0) {
      this.dateRangeChange.emit({ hasMeetings: false });
      this.startDate = new Date(0);
      this.endDate = new Date(this.startDate.getFullYear() + 1, this.startDate.getMonth(), 0);
      this.createVisualization();
      return;
    }
  
    const dates = meetings.map(d => d.date);
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    this.dateRangeChange.emit({ minDate, maxDate, hasMeetings: true });
  }

  public createVisualization(): void {
    const element = this.el.nativeElement.querySelector('#visualization');
    const { width, height } = this.getVisualizationDimensions();
  
    d3.select(element).selectAll('*').remove();
  
    this.meetingManager.getMeetingsData().subscribe(meetings => {
      if (!meetings || meetings.length === 0) {
        this.resetVisualization(element, width, height);
        return;
      }
  
      const displayStartDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), 1);
      const displayEndDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth() + 1, 0);

      const maxNodesPerRow = this.getMaxNodesInCurrentView(meetings, this.startDate, this.endDate);
      const minNodeSpacing = 20;
      const calculatedWidth = Math.max(width, maxNodesPerRow * minNodeSpacing);

      const svg = this.d3Service.createSvg(element, calculatedWidth, height, this.zoomLevel);
      this.d3Service.drawTimeline(svg, calculatedWidth, this.meetingHeight);  
      this.d3Service.drawMonths(svg, calculatedWidth, this.meetingHeight, displayStartDate, displayEndDate);
  
      this.drawDottedLines(svg, calculatedWidth, height);
      this.drawEntities(svg, 'lobbyist', calculatedWidth, displayStartDate, displayEndDate);
      if (this.showRepresentatives) {
        this.drawEntities(svg, 'representative', calculatedWidth, displayStartDate, displayEndDate);
      } else {
        this.drawEntities(svg, 'directorate', calculatedWidth, displayStartDate, displayEndDate);
      }
    });
  }

  private resetVisualization(element: HTMLElement, width: number, height: number): void {
    const displayStartDate = new Date(this.startDate.getFullYear(), this.startDate.getMonth(), 1);
    const displayEndDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth() + 1, 0);
    const svg = this.d3Service.createSvg(element, width, height, this.zoomLevel);
    this.drawDottedLines(svg, width, height);
    this.d3Service.drawTimeline(svg, width, this.meetingHeight);
    this.d3Service.drawMonths(svg, width, this.meetingHeight, displayStartDate, displayEndDate);
  }

  private drawEntities(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    entityType: 'lobbyist' | 'representative' | 'directorate',
    width: number,
    displayStartDate: Date,
    displayEndDate: Date
  ): void {
    const yPosition = this.entityPositions[entityType];
    const filteredMeetings = this.meetingManager.getFilteredMeetingsByInterval(this.startDate, this.endDate);
    const entityPositions = this.meetingManager.computeOptimizedNodePositions(entityType, width, this.startDate, this.endDate, displayStartDate, displayEndDate);

    entityPositions.forEach((xPosition: number, id: string) => {
      const entity = { id, type: entityType };
      const entityName = this.meetingManager.getEntityName(id, entityType);

      this.drawConnections(svg, entity, xPosition, this.d3Service.getTimeScale(width, displayStartDate, displayEndDate), yPosition, filteredMeetings);

      const labelYPosition = entityType === 'lobbyist' ? yPosition - 20 : yPosition + 30;

      const labelGroup = svg.append("g").style("opacity", 0);
      const backgroundRect = labelGroup.append("rect")
        .attr("fill", "rgba(255, 255, 255, 1)")
        .attr("rx", 4)
        .attr("ry", 4);
      const label = labelGroup.append("text")
        .attr("x", xPosition)
        .attr("y", labelYPosition)
        .text(this.truncateLabel(entityName))
        .attr("font-size", `${this.labelSize}px`)
        .attr("fill", entityType === 'lobbyist' ? '#004b87' : entityType === 'representative' ? '#80EF80' : '#3CB371')
        .attr("class", `label-${entityType}`)
        .style("pointer-events", "none")        
        .style('padding', '2px 5px')
        .style('border-radius', '4px')
        .attr('text-anchor', 'middle');
      const labelNode = label.node();
        if (labelNode) {
          const bbox = labelNode.getBBox();
          backgroundRect
            .attr("x", bbox.x - 5)
            .attr("y", bbox.y - 2)
            .attr("width", bbox.width + 10)
            .attr("height", bbox.height + 4);
        }

      let isLabelFixed = this.selectedNodes.has(entity.id);
  
      const connectedMeetings = filteredMeetings
        .filter(d => 
          (entityType === 'lobbyist' && d.lobbyist_id === id) ||
          (entityType === 'representative' && d.representative_id === id) ||
          (entityType === 'directorate' && d.directorate_id === id)
        )
        .map(d => `meeting-link-meeting_${d.lobbyist_id}_${d.meeting_number}`)
        .join(' ');

      const self = this;

      const node = this.d3Service.drawNode(
        svg,
        xPosition,
        yPosition,
        10,
        entityType === 'lobbyist' ? '#ae58a3' : entityType === 'representative' ? '#80EF80' : '#3CB371',
        entityType === 'lobbyist' ? '#5b2c55' : entityType === 'representative' ? '#1bd41b' : '#297a4d',
        2,
        `node-${entityType} link-${entity.type}-${entity.id} ${connectedMeetings}`
      ).on('click', () => this.onNodeClick(entity))
        .on('mouseover', function (this: SVGCircleElement) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 15)
            .attr('stroke', '#ff7f0e');
  
            labelGroup.style("opacity", 1);
            labelGroup.raise();
            label.text(entityName);

            const bbox = label.node()?.getBBox();
            if (bbox) {
              backgroundRect
                .attr("x", bbox.x - 5)
                .attr("y", bbox.y - 2)
                .attr("width", bbox.width + 10)
                .attr("height", bbox.height + 4)
                .style("display", "block");
            }
          
          d3.selectAll(`.link-${entity.type}-${entity.id}`).each(function () {
            d3.select(this).raise();
          });
  
          d3.selectAll(`.link-${entity.type}-${entity.id}`)
            .transition()
            .duration(200)
            .attr('stroke', '#ff7f0e')
            .attr('stroke-width', 4);
        })
        .on('mouseout', function (this: SVGCircleElement) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 10)
            .attr('stroke', '#000');
  
            if (!isLabelFixed) {
              labelGroup.style("opacity", 0);
              backgroundRect.style("display", "none");
            } else {
              label.text(entityName.substring(0, 10) + "...");
              const bbox = label.node()?.getBBox();
              if (bbox) {
                backgroundRect
                  .attr("x", bbox.x - 5)
                  .attr("y", bbox.y - 2)
                  .attr("width", bbox.width + 10)
                  .attr("height", bbox.height + 4)
                  .style("display", "block");
              }
            }
            self.d3Service.resetStrokes();            
        })
        .on('contextmenu', function (this: SVGCircleElement, event: MouseEvent) {
          event.preventDefault();
          isLabelFixed = !isLabelFixed;
        
          if (isLabelFixed) {
            label.text(entityName.substring(0, 10) + "...");
            d3.select(this)
              .attr('stroke', '#FF00FF')
              .attr('stroke-width', 4)
              .attr('stroke-dasharray', '5,5');
        
            self.selectedNodes.add(entity.id);
          } else {
            labelGroup.style("opacity", 0);
            d3.select(this)
              .attr('stroke', '#000')
              .attr('stroke-width', 2)
              .attr('stroke-dasharray', '');
        
            self.selectedNodes.delete(entity.id);
          }
        });

        if (isLabelFixed) {
          labelGroup.style("opacity", 1);
          label.text(entityName.substring(0, 10) + "...");
          node.attr('stroke', '#FF00FF')
              .attr('stroke-width', 4)
              .attr('stroke-dasharray', '5,5');
        }        

    });
  
    this.drawMeetingNodes(svg, this.d3Service.getTimeScale(width, displayStartDate, displayEndDate), filteredMeetings);
  }

  private drawConnections(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    entity: { id: string; type: string },
    cx1: number,
    timeScale: d3.ScaleTime<number, number>,
    yStart: number,
    filteredMeetings: MeetingData[]
  ) {
    filteredMeetings.forEach(d => {
      if (
        (entity.type === 'lobbyist' && d.lobbyist_id === entity.id) ||
        (entity.type === 'representative' && d.representative_id === entity.id) ||
        (entity.type === 'directorate' && d.directorate_id === entity.id)
      ) {
        const cx2 = timeScale(d.date);
        const cy2 = this.entityPositions.meeting;
        const meetingId = `meeting_${d.lobbyist_id}_${d.meeting_number}`;
  
        const arcLength = Math.abs(cx2 - cx1);
        const controlPointOffsetEntity = 50;
        const controlPointOffsetMeeting = Math.min(50 + arcLength / 10, 100);
        const verticalSegmentLengthMeeting = Math.min(15 + arcLength / 100, 50);
  
        const path = d3.path();
        path.moveTo(cx1, yStart);
  
        if (entity.type === 'representative' || entity.type === 'directorate') {
          path.lineTo(cx1, yStart - 15); // Vertical line upwards
          path.bezierCurveTo(cx1, yStart - 15 - controlPointOffsetEntity, cx2, cy2 + controlPointOffsetMeeting, cx2, cy2 + verticalSegmentLengthMeeting); // Curva di Bézier verso il basso
        } else {
          path.lineTo(cx1, yStart + 15); // Vertical line down
          path.bezierCurveTo(cx1, yStart + 15 + controlPointOffsetEntity, cx2, cy2 - controlPointOffsetMeeting, cx2, cy2 - verticalSegmentLengthMeeting); // Curva di Bézier verso l'alto
        }
  
        path.lineTo(cx2, cy2);
  
        this.d3Service.drawConnection(svg, path.toString(), entity, meetingId)
          .on('click', () => this.onNodeClick({ id: meetingId, type: 'meeting' }));
      }
    });
  }

  private drawMeetingNodes(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    timeScale: d3.ScaleTime<number, number>,
    filteredMeetings: MeetingData[]
  ): void {
    const yPosition = this.entityPositions.meeting;
    const meetingsByDate = new Map<string, MeetingData[]>(); 
  
    filteredMeetings.forEach(d => {
      const key = d.date.toISOString().split('T')[0];
      if (!meetingsByDate.has(key)) {
        meetingsByDate.set(key, []);
      }
      meetingsByDate.get(key)?.push(d);
    });

    const maxMeetings = Math.max(...Array.from(meetingsByDate.values()).map(d => d.length));
    const colorScale = d3.scaleLinear<string>()
    .domain([1, maxMeetings])
    .range(["#ADD8E6", "#00008B"]);

  
    meetingsByDate.forEach((meetings, date) => {
      const xPosition = timeScale(new Date(date));
      const meetingIds = meetings.map(d => `meeting_${d.lobbyist_id}_${d.meeting_number}`);
      const meetingCount = meetings.length;
      const nodeColor = colorScale(meetings.length);
      const entityLinks = meetings.flatMap(d => [
        `link-lobbyist-${d.lobbyist_id}`,
        `link-representative-${d.representative_id}`,
        `link-directorate-${d.directorate_id}`
      ]);
  
      const classList = [`meeting-node`, ...meetingIds.map(id => `meeting-link-${id}`), ...entityLinks].join(' ');
      const node = this.d3Service.drawMeetingNode(
        svg,
        xPosition,
        yPosition,
        10,
        nodeColor,
        '#000',
        2,
        classList,
        meetingIds,
        meetingCount
      )
      .on('click', () => {
        meetings.forEach((meeting, index) => {
          setTimeout(() => {
            const meetingId = `meeting_${meeting.lobbyist_id}_${meeting.meeting_number}`;
            this.onNodeClick({ id: meetingId, type: 'meeting' });
          }, index * 10);
        });
      });
    });
  }
  

  private drawDottedLines(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, width: number, height: number): void {
    const yPositions = Object.values(this.entityPositions);
    yPositions.forEach(yPosition => {
      this.d3Service.drawDottedLine(svg, 50, yPosition, width - 50, yPosition);
    });
  }

  private truncateLabel(label: string): string {
    return label.length > 15 ? label.substring(0, 15) + "..." : label;
  }

  private onNodeClick(entity: { id: string; type: string }): void {
    this.nodeSelected.emit(entity);
  }
  

  private getMaxNodesInCurrentView(meetings: MeetingData[], startDate: Date, endDate: Date): number {
    const visibleLobbyists = new Set<string>();
    const visibleRepresentatives = new Set<string>();
    const visibleDirectorates = new Set<string>();
  
    meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.date);
      if (meetingDate >= startDate && meetingDate <= endDate) {
        if (meeting.lobbyist_id) visibleLobbyists.add(meeting.lobbyist_id);
        if (meeting.representative_id) visibleRepresentatives.add(meeting.representative_id);
        if (meeting.directorate_id) visibleDirectorates.add(meeting.directorate_id);
      }
    });
  
    return Math.max(visibleLobbyists.size, visibleRepresentatives.size, visibleDirectorates.size);
  }

  private getVisualizationDimensions() {
    return {
      width: window.innerWidth * 0.9,
      height: window.innerHeight * 0.4
    };
  }
}

export interface MeetingData {
  meeting_number: number;
  lobbyist_id: string;
  lobbyist_name: string;
  date: Date;
  representative_id: string; 
  representative_name: string; 
  directorate_id: string; 
  directorate_name: string; 
}
