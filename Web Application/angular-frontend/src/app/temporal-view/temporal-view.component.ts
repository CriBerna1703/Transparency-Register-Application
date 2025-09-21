import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, Input, Output, EventEmitter, OnChanges, SimpleChanges, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterService } from '../services/filter.service';
import { MeetingManager } from '../services/meeting-manager.service';
import { D3Service } from '../services/d3.service';
import { SelectionService } from '../services/selection.service';
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
  @Input() fullLabels: boolean = false;
  @Output() nodeSelected = new EventEmitter<{ id: string; type: string;}>();
  @Output() labelTextChange = new EventEmitter<string>();
  private meetingsSubscription: Subscription | undefined;
  private lobbyistHeight = 60;
  private representativeHeight = window.innerHeight * 0.3 + 60;
  private directorateHeight = window.innerHeight * 0.3 + 60;
  private meetingHeight = window.innerHeight * 0.15 + 60;
  private selectedNodes: Set<string> = new Set();
  private selectedInfoTab: { id: string; type: string } | null = null;
  private selectedHistogramTab: { id: string; type: string } | null = null;
  public activeMeetingNode: { color: string, count: number, textColor: string } | null = null;
  public activeRepresentativeAllocations: {
    name: string;
    directorates: { name: string; startYear: number | undefined; endYear: number | undefined }[];
    commissions: { name: string; startYear: number | undefined; endYear: number | undefined }[];
    cabinets: { name: string; startYear: number | undefined; endYear: number | undefined }[];
  } | null = null;
  public lobbyistDegreeThreshold: number = 1;
  public maxVisibleLobbyistDegree: number = 10; 

  private entityPositions = {
    lobbyist: this.lobbyistHeight,
    representative: this.representativeHeight,
    directorate: this.directorateHeight,
    cabinet: this.directorateHeight,
    meeting: this.meetingHeight,
  };

  private temporalViewSvg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;

  constructor(
    private filterService: FilterService,
    private meetingManager: MeetingManager,
    private el: ElementRef,
    private d3Service: D3Service,
    private cdr: ChangeDetectorRef,
    private selectionService: SelectionService,

  ) {}

  ngOnInit(): void {
    window.addEventListener('resize', () => {
      this.createVisualization();
    });
    this.meetingsSubscription = this.filterService.meetings$.subscribe(meetings => {
      const formattedMeetings: MeetingData[] = meetings.map(meeting => ({
        meeting_number: meeting.commission_meetings.meeting_number,
        lobbyist_id: meeting.commission_meetings.lobbyist_id,
        lobbyist_name: meeting.lobbyist_profile.organization_name,
        date: new Date(meeting.commission_meetings.meeting_date),
        participants: meeting.participants.map((p: RawParticipant): ParticipantData => ({
          representative_id: p.commission_representative.id,
          representative_name: p.commission_representative.name,
          directorate_id: p.directorate.id || "",
          directorate_name: p.directorate.name || "?",
          directorate_start_year: p.directorate.start_year || undefined,
          directorate_end_year: p.directorate.end_year || undefined,
          is_commissioner: p.directorate.id ? p.directorate.is_commissioner : false,
          cabinet_id: p.directorate.id ? p.commission_cabinet.id || "" : p.commission_cabinet.id || "DUMMY-ID",
          cabinet_name: p.commission_cabinet.name || "?",
          cabinet_start_year: p.commission_cabinet.start_year || undefined,
          cabinet_end_year: p.commission_cabinet.end_year || undefined,
        }))
      }));
    
      this.meetingManager.setMeetingsData(formattedMeetings);
      this.emitDateRange(formattedMeetings);
    });

    this.selectionService.activeInfoTab$.subscribe(tab => {
      if (tab && tab.type !== null) {
        this.selectedInfoTab = { id: tab.id ?? '', type: tab.type as string };
        this.updateSelectedNodes(this.selectedInfoTab);
      } else {
        this.selectedInfoTab = null;
        this.updateSelectedNodes(null);
      }
    });

    this.selectionService.activeHistogramTab$.subscribe(tab => {
      if (tab && tab.type !== null) {
        this.selectedHistogramTab = { id: tab.id ?? '', type: tab.type as string };
        this.updateSelectedNodes(this.selectedHistogramTab);
      } else {
        this.selectedHistogramTab = null;
        this.updateSelectedNodes(null);
      }
    });

    this.selectionService.selectedNodes$.subscribe(nodes => {
      this.selectedNodes = new Set(nodes.map(n => this.makeKey(n.id, n.type as any)));
      this.createVisualization();
    });

    this.d3Service.labelTextChange$.subscribe(text => {
      this.labelTextChange.emit(text);
    });

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startDate'] || changes['endDate']) {
      this.meetingManager.prepareGroupingData(this.meetingManager.getFilteredMeetingsByInterval(this.startDate, this.endDate));
    }
    if (changes['startDate'] || changes['endDate'] || changes['labelSize'] || changes['showRepresentatives'] || changes['zoomLevel'] || changes['fullLabels']) {
      this.updateMaxDegree();
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
    const labels = this.el.nativeElement.querySelectorAll('.label-lobbyist, .label-representative, .label-directorate, .label-cabinet');
    labels.forEach((label: HTMLElement) => {
      label.style.fontSize = `${this.labelSize}px`;
    });
  }

  private emitDateRange(meetings: MeetingData[]): void {
    if (meetings.length === 0) {
      this.dateRangeChange.emit({ hasMeetings: false });
      const currentYear = new Date().getFullYear();
      this.startDate = new Date(currentYear, 0, 1);
      this.endDate = new Date(this.startDate.getFullYear() + 1, this.startDate.getMonth(), 0);
      this.createVisualization();
      return;
    }
  
    const dates = meetings.map(d => d.date);
    const minDate = this.filterService.getCurrentFilters().date_from ? new Date(this.filterService.getCurrentFilters().date_from) : new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = this.filterService.getCurrentFilters().date_to ? new Date(this.filterService.getCurrentFilters().date_to) : new Date(Math.max(...dates.map(d => d.getTime())));
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

      this.temporalViewSvg = this.d3Service.createSvg(element, calculatedWidth, height, this.zoomLevel);
      this.d3Service.drawTimeline(this.temporalViewSvg, calculatedWidth, this.meetingHeight);
      this.d3Service.drawMonths(this.temporalViewSvg, calculatedWidth, this.meetingHeight, displayStartDate, displayEndDate);

      this.drawDottedLines(this.temporalViewSvg, calculatedWidth, height);
      const filteredMeetings = this.meetingManager.getFilteredMeetingsByInterval(this.startDate, this.endDate);
      this.drawMeetingNodes(this.temporalViewSvg, this.d3Service.getTimeScale(calculatedWidth, displayStartDate, displayEndDate), filteredMeetings);
      this.drawEntities(this.temporalViewSvg, 'lobbyist', calculatedWidth, displayStartDate, displayEndDate, this.lobbyistDegreeThreshold, filteredMeetings);
      if (this.showRepresentatives) {
        this.drawEntities(this.temporalViewSvg, 'representative', calculatedWidth, displayStartDate, displayEndDate, undefined, filteredMeetings);
      } else {
        this.drawEntities(this.temporalViewSvg, 'directorate', calculatedWidth, displayStartDate, displayEndDate, undefined, filteredMeetings);
        this.drawEntities(this.temporalViewSvg, 'cabinet', calculatedWidth, displayStartDate, displayEndDate, undefined, filteredMeetings);
      }
      this.temporalViewSvg.selectAll('.meeting-node').raise();
      const meetingIds = meetings.map(m => `meeting_${m.lobbyist_id}_${m.meeting_number}`);
      meetingIds.forEach(meetingId => {
        if (this.selectedNodes.has(this.makeKey(meetingId, 'meeting'))) {
          d3.selectAll(`.meeting-link-${meetingId}`).each(function () {
            d3.select(this).classed(`node-meeting-pinned`, true);
          });
        }
      });
      this.updateSelectedNodes(this.selectedInfoTab);
      this.updateSelectedNodes(this.selectedHistogramTab);
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
    entityType: 'lobbyist' | 'representative' | 'directorate' | 'cabinet',
    width: number,
    displayStartDate: Date,
    displayEndDate: Date,
    minDegree: number = 1,
    filteredMeetings: MeetingData[],
  ): void {
    const yPosition = this.entityPositions[entityType];
    const entityPositions = this.meetingManager.computeOptimizedNodePositions(entityType, width, this.startDate, this.endDate, displayStartDate, displayEndDate);

    const sortedEntities = Array.from(entityPositions.entries()).sort((a, b) => a[1] - b[1]);
    this.drawGroupingRectangles(svg, sortedEntities, filteredMeetings);

    sortedEntities.forEach(([id, xPosition], index, array) => {
      const entity = { id, type: entityType };
      const isGrouped = String(id).startsWith("grouped-");
      var entityName = isGrouped ? "Lobbyist Group" : this.meetingManager.getEntityName(id, entityType);
      if(entityType === 'cabinet' && id === 'DUMMY-ID') {
        entityName = "?";
      }

      this.drawConnections(svg, entity, xPosition, this.d3Service.getTimeScale(width, displayStartDate, displayEndDate), yPosition, filteredMeetings);
      let truncatedLength = 5;
      if (index > 0) {
        const prevX = array[index - 1][1];
        if (Math.abs(xPosition - prevX) < 50) {
          truncatedLength = 2;
        }
      }

      let isLabelFixed =
        this.selectedNodes.has(this.makeKey(entity.id, entityType)) ||
        this.selectedInfoTab?.id === entity.id ||
        this.selectedHistogramTab?.id === entity.id;

      const labelYPosition = entityType === 'lobbyist' ? yPosition - 20 : yPosition + 30;

      const labelGroup = svg.append("g")
        .attr("class", "label-group")
        .classed("label-visible", false)
        .classed("label-fixed", isLabelFixed)
        .classed(`node-${entity.type}-${entity.id}`, true);
      const backgroundRect = labelGroup.append("rect")
        .attr("fill", "rgba(255, 255, 255, 1)")
        .attr("rx", 4)
        .attr("ry", 4);

      if (entityType === 'cabinet' && entityName !== "?") {
        entityName = 'Cabinet of ' + entityName;
      }

      const label = labelGroup.append("text")
        .attr("x", xPosition)
        .attr("y", labelYPosition)
        .attr("data-original-text", entityName)
        .text(this.fullLabels ? entityName : entityName.substring(0, truncatedLength))
        .attr("font-size", `${this.labelSize}px`)
        .attr("fill", entityType === 'lobbyist' ? '#004b87' : entityType === 'representative' ? '#54c459' : entityType === 'directorate' ? '#3CB371' : '#29437aff')
        .attr("data-original-text", entityName)
        .attr("data-truncated", entityName.substring(0, truncatedLength))
        .attr("class", `label-text label-${entityType}`)
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
    
      const connectedMeetings = filteredMeetings
        .filter(d =>
          (entityType === 'lobbyist' && d.lobbyist_id === id) ||
          (entityType === 'representative' && d.participants.some(p => p.representative_id === id)) ||
          (entityType === 'directorate' && d.participants.some(p => p.directorate_id === id)) ||
          (entityType === 'cabinet' && d.participants.some(p => p.cabinet_id === id))
        )
        .map(d => `meeting-link-meeting_${d.lobbyist_id}_${d.meeting_number}`)
        .join(' ');

      const isDummyDirectorate = (entityType === 'directorate' || entityType === 'cabinet') && entityName === "?";

      const self = this;

      if (entityType === "lobbyist" && isGrouped) {

        const dateKey = id.replace("grouped-", "");
        const lobbyistMeetingCount = new Map<string, number>();

        filteredMeetings.forEach(meeting => {
          const { lobbyist_id } = meeting;
          lobbyistMeetingCount.set(lobbyist_id, (lobbyistMeetingCount.get(lobbyist_id) || 0) + 1);
        });

        const groupedLobbists = filteredMeetings
          .filter(d => d.date.toISOString().split("T")[0] === dateKey)
          .map(d => d.lobbyist_id)
          .filter(lobbyistId => lobbyistMeetingCount.get(lobbyistId) === 1); 
        const connectedMeetings = filteredMeetings
            .filter(d => groupedLobbists.includes(d.lobbyist_id))
            .map(d => `meeting-link-meeting_${d.lobbyist_id}_${d.meeting_number}`)
            .join(' ');
        const lobbyistNodeClasses = groupedLobbists
            .map(id => `node-lobbyist-${id} link-lobbyist-${id}`)
            .join(' ');
        const isGroupSelected = groupedLobbists.some(lobbyistId =>
          self.selectedNodes.has(self.makeKey(lobbyistId, 'lobbyist'))
        );

        const groupedNode = this.d3Service.drawGroupedNode(
          svg,
          xPosition,
          yPosition,
          10,
          '#e6c7e0',
          '#5b2c55',
          2,
          `node-${entityType} link-${entity.type}-${entity.id} ${connectedMeetings} ${lobbyistNodeClasses}`
        ).on("click", () => this.toggleGrouping(id.replace("grouped-", "")))
        .on('mouseover', function (this: SVGRectElement) {
          d3.select(this).classed('node-hover', true);
  
          labelGroup.classed("label-visible", true).raise();
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
              d3.select(this).raise().classed('node-hover', true);
          });
        })
        .on('mouseout', function (this: SVGRectElement) {
            d3.select(this).classed('node-hover', false);
            d3.selectAll(`.link-${entity.type}-${entity.id}`).each(function () {
                d3.select(this).classed('node-hover', false);
            });
            labelGroup.classed("label-visible", false);
            backgroundRect.style("display", "none");
        }).on('contextmenu', function (this: SVGCircleElement, event: MouseEvent) {
          event.preventDefault();
        });

        d3.selectAll(`.link-${entity.type}-${entity.id}`).each(function () {
          d3.select(this).classed(`${lobbyistNodeClasses}`, true);
        });

        if (isGroupSelected) {
          groupedNode
            .classed('node-lobbyist-pinned', true);
          d3.selectAll(`.link-${entity.type}-${entity.id}`).each(function () {
              d3.select(this).classed(`node-${entity.type}-pinned`, true);
          });
        }
      } else {
        const node = this.d3Service.drawNode(
          svg,
          xPosition,
          yPosition,
          8,
          entityType === 'lobbyist' ? '#ae58a3' : entityType === 'representative' ? '#F4D03F' : entityType === 'directorate' ? '#D35400' : '#55a4ffff',
          entityType === 'lobbyist' ? '#5b2c55' : entityType === 'representative' ? '#a77d00ff' : entityType === 'directorate' ? '#865a12ff' : '#3366a0ff',
          2,
          `node-${entityType} node-${entity.type}-${entity.id} link-${entity.type}-${entity.id} ${connectedMeetings} ${isDummyDirectorate ? 'dummy-directorate' : ''}`
        ).on('click', () => this.onNodeClick(entity))
        .on('mouseover', function (this: SVGCircleElement) {
          d3.selectAll('.node-hover').each(function () {
            d3.select(this).classed('node-hover', false);
          });
          d3.selectAll(`.node-${entity.type}-${entity.id}`).each(function () {
            d3.select(this).classed('node-hover', true);
          });
  
          labelGroup.classed("label-visible", true).raise();
          label.text(entityName);
          self.labelTextChange.emit(entityName);

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
  
          d3.selectAll(`.link-${entity.type}-${entity.id}`).each(function () {
            d3.select(this).classed('node-hover', true);
          });

          if (entityType === 'representative') {
            const repName = entityName;

            const allocations = self.meetingManager.representativeAllocations.get(entity.id);
            if (allocations) {
              const directoratesArray = Array.from(allocations.directorates.entries()).map(([name, d]) => ({
                name,
                startYear: d.startYear,
                endYear: d.endYear,
                isCommissioner: d.isCommissioner
              }));

              self.activeRepresentativeAllocations = {
                name: repName,
                commissions: directoratesArray.filter(d => d.isCommissioner),
                directorates: directoratesArray.filter(d => !d.isCommissioner),
                cabinets: Array.from(allocations.cabinets.entries()).map(([name, c]) => ({
                  name,
                  startYear: c.startYear,
                  endYear: c.endYear
                }))
              };
            } else {
              self.activeRepresentativeAllocations = null;
            }
          }
        })
        .on('mouseout', function (this: SVGCircleElement) {
          d3.selectAll('.node-hover').each(function () {
            d3.select(this).classed('node-hover', false);
          });

          self.labelTextChange.emit('');

          if(!self.fullLabels) {
            label.text(entityName.substring(0, truncatedLength));
          }

          if (!isLabelFixed) {
            labelGroup.classed("label-visible", false);
            backgroundRect.style("display", "none");
          } else {
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
          if (entityType === 'representative') {
            self.activeRepresentativeAllocations = null;
          }
        })
        .on('contextmenu', function (this: SVGCircleElement, event: MouseEvent) {
          event.preventDefault();
          isLabelFixed = !isLabelFixed;

          labelGroup.classed("label-fixed", isLabelFixed);
          label.text(isLabelFixed && !self.fullLabels ? entityName.substring(0, truncatedLength) : entityName);

          d3.selectAll(`.node-${entity.type}-${entity.id}`).each(function () {
            d3.select(this).classed(`node-${entity.type}-pinned`, isLabelFixed);
          });
          const key = self.makeKey(entity.id, entity.type);
          if (isLabelFixed) {
            self.selectedNodes.add(key);
            self.selectionService.selectNode(entity);
          } else {
            self.selectedNodes.delete(key);
            self.selectionService.deselectNode(entity);
          }
        });

        if (entityType === 'representative') {
          const allocations = self.meetingManager.getAllocationsInRange(
            entity.id,
            displayStartDate.getFullYear(),
            displayEndDate.getFullYear()
          );

          if (allocations.cabinets.length > 0) {
            node.classed('node-cabinet-associated', true);
          }

          if (allocations.directorates.length > 0) {
            if (allocations.directorates.some(d => d.isCommissioner)) {
              node.classed('node-commissioner', true);
            }
          }
        } else if (entityType === 'directorate') {
          if (self.meetingManager.directoratesWithCommissioners.has(entity.id)) {
            node.classed('node-commissioner', true);
          }
        }


        if (this.selectedNodes.has(this.makeKey(entity.id, entityType))) {
          d3.selectAll(`.node-${entity.type}-${entity.id}`).each(function () {
            d3.select(this).classed(`node-${entity.type}-pinned`, isLabelFixed);
          });
        }
      }
    });
  }

  private drawConnections(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    entity: { id: string; type: string },
    cx1: number,
    timeScale: d3.ScaleTime<number, number>,
    yStart: number,
    filteredMeetings: MeetingData[]
  ) {
    const isGrouped = String(entity.id).startsWith("grouped-");
    const dateKey = isGrouped ? entity.id.replace("grouped-", "") : null;

    filteredMeetings.forEach(d => {
        if (isGrouped) {
            if (d.date.toISOString().split("T")[0] !== dateKey) {
                return;
            }
        } else {
            if (
                (entity.type === 'lobbyist' && d.lobbyist_id !== entity.id) ||
                (entity.type === 'representative' && !d.participants.some(p => p.representative_id === entity.id)) ||
                (entity.type === 'directorate' && !d.participants.some(p => p.directorate_id === entity.id)) ||
                (entity.type === 'cabinet' && !d.participants.some(p => p.cabinet_id === entity.id))
            ) {
                return;
            }
        }
        const cx2 = timeScale(d.date);
        const cy2 = this.entityPositions.meeting;
        const meetingId = `meeting_${d.lobbyist_id}_${d.meeting_number}`;
  
        const arcLength = Math.abs(cx2 - cx1);
        const controlPointOffsetEntity = 50;
        const controlPointOffsetMeeting = Math.min(50 + arcLength / 10, 100);
        const verticalSegmentLengthMeeting = Math.min(15 + arcLength / 100, 50);
  
        const path = d3.path();
        path.moveTo(cx1, yStart);
  
        if (entity.type === 'representative' || entity.type === 'directorate' || entity.type === 'cabinet') {
          path.lineTo(cx1, yStart - 15); // Vertical line upwards
          path.bezierCurveTo(cx1, yStart - 15 - controlPointOffsetEntity, cx2, cy2 + controlPointOffsetMeeting, cx2, cy2 + verticalSegmentLengthMeeting); // Curva di Bézier verso il basso
        } else {
          path.lineTo(cx1, yStart + 15); // Vertical line down
          path.bezierCurveTo(cx1, yStart + 15 + controlPointOffsetEntity, cx2, cy2 - controlPointOffsetMeeting, cx2, cy2 - verticalSegmentLengthMeeting); // Curva di Bézier verso l'alto
        }
  
        path.lineTo(cx2, cy2);
        const self = this;
        this.d3Service.drawConnection(svg, path.toString(), entity, meetingId)
          .on('click', () => {if(!isGrouped) this.onNodeClick({ id: meetingId, type: 'meeting' })})
          .on('contextmenu', function (this: SVGPathElement, event: MouseEvent) {
            event.preventDefault();
            
            const key = self.makeKey(meetingId, 'meeting');
            let isMeetingPinned = self.selectedNodes.has(key);
            isMeetingPinned = !isMeetingPinned;
            d3.selectAll(`.meeting-link-${meetingId}`).each(function () {
              d3.select(this).classed('node-meeting-pinned', isMeetingPinned);
            });
            if (isMeetingPinned) {
              self.selectedNodes.add(key);
              self.selectionService.selectNode({ id: meetingId, type: 'meeting' });
            } else {
              self.selectedNodes.delete(key);
              self.selectionService.deselectNode({ id: meetingId, type: 'meeting' });
            }
          });
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
      const textColor = this.isDarkColor(nodeColor) ? 'white' : 'black';
      const entityLinks = meetings.flatMap(d =>
        d.participants.flatMap(p => [
          `node-representative-${p.representative_id}`,
          `node-directorate-${p.directorate_id}`,
          `node-cabinet-${p.cabinet_id}`,
          `link-representative-${p.representative_id}`,
          `link-directorate-${p.directorate_id}`,
          `link-cabinet-${p.cabinet_id}`
        ]).concat([
          `node-lobbyist-${d.lobbyist_id}`,
          `link-lobbyist-${d.lobbyist_id}`,
          `link-lobbyist-grouped-${date}`
        ])
      );
      const self = this;
      const classList = [`meeting-node`, ...meetingIds.map(id => `meeting-link-${id}`), ...entityLinks].join(' ');
      const node = this.d3Service.drawMeetingNode(
        svg,
        new Date(date),
        xPosition,
        yPosition,
        10,
        nodeColor,
        '#000',
        2,
        classList,
        meetingIds
      )
      .on('click', () => {
        meetings.forEach((meeting, index) => {
          setTimeout(() => {
            const meetingId = `meeting_${meeting.lobbyist_id}_${meeting.meeting_number}`;
            this.onNodeClick({ id: meetingId, type: 'meeting' });
          }, index * 10);
        });
      })
      .on('mouseover', () => {
        this.activeMeetingNode = {
          color: nodeColor,
          count: meetingCount,
          textColor: textColor
        };
        d3.selectAll('.node-hover').each(function () {
          d3.select(this).classed('node-hover', false);
        });
        meetingIds.forEach(meetingId => {
          d3.selectAll(`.meeting-link-${meetingId}`).each(function () {
            d3.select(this).raise();
          });
      
          d3.selectAll(`.meeting-link-${meetingId}`).each(function () {
            d3.select(this).classed('node-hover', true);
          });
        });
        this.cdr.detectChanges();
      })
      .on('mouseout', () => {
        d3.selectAll('.node-hover').each(function () {
            d3.select(this).classed('node-hover', false);
          });
      })
      .on('contextmenu', function (this: SVGCircleElement, event: MouseEvent) {
        event.preventDefault();
        const meetingKeys = meetingIds.map(id => self.makeKey(id, 'meeting'));
        const allPinned = meetingKeys.every(key => self.selectedNodes.has(key));

        if (allPinned) {
          meetingIds.forEach(meetingId => {
            d3.selectAll(`.meeting-link-${meetingId}`).each(function () {
              d3.select(this).classed('node-meeting-pinned', false);
            });
            self.selectedNodes.delete(self.makeKey(meetingId, 'meeting'));
            self.selectionService.deselectNode({ id: meetingId, type: 'meeting' });
          });
        } else {
          meetingIds.forEach(meetingId => {
            const key = self.makeKey(meetingId, 'meeting');
            if (!self.selectedNodes.has(key)) {
              d3.selectAll(`.meeting-link-${meetingId}`).each(function () {
                d3.select(this).classed('node-meeting-pinned', true);
              });
              self.selectedNodes.add(key);
              self.selectionService.selectNode({ id: meetingId, type: 'meeting' });
            }
          });
        }
      });
    });
  }
  
  private drawDottedLines(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, width: number, height: number): void {
    const yPositions = Object.values(this.entityPositions);
    yPositions.forEach(yPosition => {
      this.d3Service.drawDottedLine(svg, 50, yPosition, width - 50, yPosition);
    });
  }

  private onNodeClick(entity: { id: string; type: string }): void {
    this.nodeSelected.emit(entity);
  }
  

  private getMaxNodesInCurrentView(meetings: MeetingData[], startDate: Date, endDate: Date): number {
    const visibleLobbyists = new Set<string>();
    const visibleRepresentatives = new Set<string>();
    const visibleDirectorates = new Set<string>();
    const visibleCabinets = new Set<string>();

    meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.date);
      if (meetingDate >= startDate && meetingDate <= endDate) {
        if (meeting.lobbyist_id) visibleLobbyists.add(meeting.lobbyist_id);
        meeting.participants.forEach(p => {
          if (p.representative_id) visibleRepresentatives.add(p.representative_id);
          if (p.directorate_id) visibleDirectorates.add(p.directorate_id);
          if (p.cabinet_id) visibleCabinets.add(p.cabinet_id);
        });
      }
    });

    return Math.max(visibleLobbyists.size, visibleRepresentatives.size, visibleDirectorates.size, visibleCabinets.size);
  }

  private getVisualizationDimensions() {
    return {
      width: window.innerWidth * 0.9,
      height: window.innerHeight * 0.4
    };
  }

  private isDarkColor(color: string): boolean {
    const rgb = d3.color(color);
    if (!rgb) return false;
    const luminance = 0.299 * rgb.rgb().r + 0.587 * rgb.rgb().g + 0.114 * rgb.rgb().b;
    return luminance < 128;
  }

  private toggleGrouping(dateKey: string) {
    const currentState = this.meetingManager.groupedDates.get(dateKey);
    this.meetingManager.groupedDates.set(dateKey, !currentState);
    this.createVisualization();
  }

  private regroupNodes(dateKey: string): void {
    d3.selectAll(`.node-lobbyist.link-lobbyist-${dateKey}`)
      .transition()
      .duration(300)
      .style("opacity", 0)
      .remove(); 
  
    this.meetingManager.groupedDates.set(dateKey, true);
    this.createVisualization();
  }

  private drawGroupingRectangles(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    sortedEntities: [string, number][],
    filteredMeetings: MeetingData[]
  ): void {
    const groupsToDraw = new Map<string, { minX: number; maxX: number; minY: number; maxY: number; lobbyists: string[] }>();
  
    const lobbyistMeetingCount = new Map<string, number>();
    filteredMeetings.forEach(meeting => {
      lobbyistMeetingCount.set(meeting.lobbyist_id, (lobbyistMeetingCount.get(meeting.lobbyist_id) || 0) + 1);
    });
  
    const validGroups = new Map<string, Set<string>>();
    filteredMeetings.forEach(meeting => {
      const dateKey = meeting.date.toISOString().split("T")[0];
  
      if (this.meetingManager.groupedDates.get(dateKey) === false) {
        if (lobbyistMeetingCount.get(meeting.lobbyist_id) === 1) {
          if (!validGroups.has(dateKey)) {
            validGroups.set(dateKey, new Set());
          }
          validGroups.get(dateKey)!.add(meeting.lobbyist_id);
        }
      }
    });
  
    validGroups.forEach((lobbyists, dateKey) => {
      if (lobbyists.size > 1) {
        groupsToDraw.set(dateKey, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, lobbyists: Array.from(lobbyists) });
      }
    });
  
    sortedEntities.forEach(([id, xPosition]) => {
      groupsToDraw.forEach((group, dateKey) => {
        if (group.lobbyists.includes(id)) {
          group.minX = Math.min(group.minX, xPosition);
          group.maxX = Math.max(group.maxX, xPosition);
          group.minY = Math.min(group.minY, this.entityPositions.lobbyist - 15);
          group.maxY = Math.max(group.maxY, this.entityPositions.lobbyist + 15);
        }
      });
    });
  
    groupsToDraw.forEach((group, dateKey) => {
      if (group.lobbyists.length < 2 || group.minX === Infinity || group.maxX === -Infinity) {
        return;
      }
  
      const padding = 10;  
      svg.append("rect")
      .attr("x", group.minX - padding)
      .attr("y", group.minY - padding)
      .attr("width", group.maxX - group.minX + 2 * padding)
      .attr("height", group.maxY - group.minY + 2 * padding)
      .attr("fill", "#f3e3ef")
      .attr("stroke", "#ff7f0e")
      .attr("stroke-width", 2)
      .attr("rx", 8)
      .attr("class", `group-box group-box-${dateKey}`)
      .style("cursor", "pointer")
      .style("pointer-events", "all")
      .on("click", () => this.regroupNodes(dateKey));
    
      });
  }

  public updateVisualization(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.lobbyistDegreeThreshold = Number(inputElement.value);
    this.meetingManager.lobbyistDegreeThreshold = this.lobbyistDegreeThreshold;
    this.createVisualization();
  }

  private updateMaxDegree(): void {
    this.maxVisibleLobbyistDegree = this.meetingManager.maxVisibleLobbyistDegree;
    this.lobbyistDegreeThreshold = Math.min(this.lobbyistDegreeThreshold, this.maxVisibleLobbyistDegree);
    this.meetingManager.lobbyistDegreeThreshold = this.lobbyistDegreeThreshold;
  }

  private updateSelectedNodes(selectedTab: { id: string; type: string } | null): void {
    if (!selectedTab) return;

    const deselectMap: Record<string, string[]> = {
      lobbyist: ['.node-lobbyist-selected', '.meeting-link-selected'],
      meeting: ['.node-lobbyist-selected', '.meeting-link-selected'],
      representative: ['.node-representative-selected', '.node-directorate-selected'],
      directorate: ['.node-representative-selected', '.node-directorate-selected'],
      cabinet: ['.node-cabinet-selected'],
      'lobbyist-meeting': ['.node-lobbyist-selected', '.meeting-link-selected'],
      'representative-directorate-cabinet': ['.node-representative-selected', '.node-directorate-selected', '.node-cabinet-selected']
    };

    const selectMap: Record<string, ((id: string) => string) | null> = {
      lobbyist: id => `.node-lobbyist-${id}`,
      meeting: id => `.meeting-link-${id}`,
      representative: id => this.showRepresentatives ? `.node-representative-${id}` : '',
      directorate: id => !this.showRepresentatives ? `.node-directorate-${id}` : '',
      cabinet: id => !this.showRepresentatives ? `.node-cabinet-${id}` : '',
      'lobbyist-meeting': null,
      'representative-directorate-cabinet': null
    };

    const deselectors = deselectMap[selectedTab.type];
    if (deselectors) {
      deselectors.forEach(selector => {
        this.temporalViewSvg?.selectAll(selector).classed(selector.replace('.', ''), false);
      });
    }

    const selectorBuilder = selectMap[selectedTab.type];
    if (selectorBuilder) {
      const selector = selectorBuilder(selectedTab.id);
      if (selector) {
        const classToAdd = selector.replace('.', '').replace(`-${selectedTab.id}`, '-selected');
        this.temporalViewSvg?.selectAll(selector).classed(classToAdd, true);
      }
    }
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private makeKey(
    id: string,
    type: 'lobbyist' | 'representative' | 'directorate' | 'cabinet' | 'meeting'
  ): string {
    return `${type}:${id}`;
  }
}

export interface RawParticipant {
  commission_representative: {
    id: string;
    name: string;
  };
  directorate: {
    id?: string;
    name?: string;
    start_year?: number;
    end_year?: number;
    is_commissioner?: boolean;
  };
  commission_cabinet: {
    id?: string;
    name?: string;
    start_year?: number;
    end_year?: number;
  };
}

export interface ParticipantData {
  representative_id: string;
  representative_name: string;
  directorate_id: string;
  directorate_name: string;
  directorate_start_year?: number;
  directorate_end_year?: number;
  is_commissioner?: boolean;
  cabinet_id: string;
  cabinet_name: string;
  cabinet_start_year?: number;
  cabinet_end_year?: number;
}

export interface MeetingData {
  meeting_number: number;
  lobbyist_id: string;
  lobbyist_name: string;
  date: Date;
  participants: ParticipantData[];
}

