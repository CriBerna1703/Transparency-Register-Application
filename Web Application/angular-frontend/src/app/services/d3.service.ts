import { Injectable } from '@angular/core';
import { SelectedNode } from './selection.service';
import { Subject } from 'rxjs';
import * as d3 from 'd3';
import { CheckboxRequiredValidator } from '@angular/forms';

export interface ForceGraphOptions {
  width?: number;
  height?: number;
  zoomLevel?: number;
  minSim?: number; 
  maxSim?: number;
  SelectedNode?: SelectedNode[];
  DraggableNode?: { id: string; type: 'lobbyist' }[];
  onNodeClick?: (d: any) => void;
  onLinkLeftClick?: (link: any) => void;
  onNodeRightClick?: (d: any) => void;
}

interface Link {
  source: string;
  target: string;
  similarity: number;
  __invisible?: boolean; 
  strength?: number;     
}


@Injectable({
  providedIn: 'root'
})
export class D3Service {

  public labelTextChange$ = new Subject<string>();

  emitLabelText(text: string): void {
    this.labelTextChange$.next(text);
  }
  createSvg(element: HTMLElement, width: number, height: number, zoomLevel: number){
    return d3.select(element)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('height', '100%')
    .style('width', `${zoomLevel}%`);
  }

  drawHistogram(container: HTMLElement, data: number[], labels: string[], width: number, height: number, maxDegree?: number): void {
    d3.select(container).select('svg').remove();

    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const baseFontSize = 20;
    const scaledFontSize = baseFontSize + (width - 1000) / 100;

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${width > 1000 ? height + (width - 1000) / 25 : height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .style('height', '98%');

    const x = d3.scaleBand()
      .domain(labels)
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const yMax = maxDegree ? Math.max(maxDegree, d3.max(data) as number || 1) : d3.max(data) as number || 1;

    const y = d3.scaleLinear()
      .domain([0, yMax])
      .range([height - margin.bottom, margin.top]);

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .style('font-size', `${baseFontSize}px`);

    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (_, i) => x(labels[i]) as number)
      .attr('y', d => y(d))
      .attr('width', x.bandwidth())
      .attr('height', d => Math.max(0, y(0) - y(d)))
      .attr('fill', '#007bff');

    svg.selectAll('.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (_, i) => (x(labels[i]) as number) + x.bandwidth() / 2)
      .attr('y', d => y(d) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', `${baseFontSize}px`)
      .style('fill', 'black')
      .text(d => d > 0 ? d : '');
    
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
      .attr('transform', 'rotate(-30)')
      .style('text-anchor', 'end')
      .style('font-size', `${scaledFontSize}px`);

  }


  drawTimeline(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, width: number, height: number): void {
    svg.append('line')
      .attr('x1', 50)
      .attr('x2', width - 50)
      .attr('y1', height)
      .attr('y2', height)
      .attr('stroke', '#d3d3d3')
      .attr('stroke-width', 2);

    svg.append('polygon')
      .attr('points', `${width - 45},${height - 5} ${width - 35},${height} ${width - 45},${height + 5}`)
      .attr('fill', '#d3d3d3');
  }

  drawMonths(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    width: number,
    height: number,
    startDate: Date,
    endDate: Date
  ): void {
    const timeScale = this.getTimeScale(width, startDate, endDate);
    const months = d3.timeMonths(startDate, endDate);

    svg.selectAll('.month-bg')
      .data(months)
      .enter()
      .append('rect')
      .attr('x', d => timeScale(d))
      .attr('y', height - 10)
      .attr('width', (d, i) => this.getMonthWidth(timeScale, months, d, i))
      .attr('height', 20)
      .attr('fill', (d, i) => (i % 2 === 0 ? '#ffffda' : '#fff4cb'));

    svg.selectAll('.month-label')
      .data(months)
      .enter()
      .append('text')
      .attr('x', d => timeScale(d) + (timeScale(new Date(d.getTime() + 2592000000)) - timeScale(d)) / 2)
      .attr('y', height + 20)
      .attr('text-anchor', 'middle')
      .text(d => d3.timeFormat('%b')(d))
      .attr('font-size', '16px')
      .attr('fill', '#000');

    const yearChangePoints: { x: number; year: number }[] = [];

    for (let i = 0; i < months.length - 1; i++) {
      const curr = months[i];
      const next = months[i + 1];
      if (curr.getFullYear() !== next.getFullYear()) {
        const x = timeScale(next);
        yearChangePoints.push({ x, year: next.getFullYear() });

        // Linea di separazione verticale tratteggiata
        svg.append('line')
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', 0)
          .attr('y2', 2 * height)
          .attr('stroke', '#888')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4,2')
          .attr('class', 'year-change-bar');
      }
    }

    yearChangePoints.unshift({ x: 0, year: startDate.getFullYear() });
    yearChangePoints.push({ x: timeScale(new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 1)), year: endDate.getFullYear() });

    for (let i = 0; i < yearChangePoints.length - 1; i++) {
      const midX = (yearChangePoints[i].x + yearChangePoints[i + 1].x) / 2;
      const labelYear = yearChangePoints[i].year;

      svg.append('text')
        .attr('x', midX)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#444')
        .text(labelYear);
      
      svg.append('text')
        .attr('x', midX)
        .attr('y', 2 * height - 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#444')
        .text(labelYear);
    }
  }


  getTimeScale(width: number, startDate: Date, endDate: Date, scalePercentage: number = 1): d3.ScaleTime<number, number> {
    const adjustedWidth = width * scalePercentage;
    return d3.scaleTime()
      .domain([startDate, endDate])
      .range([50, adjustedWidth - 50]);
  }
  

  getMonthWidth(timeScale: d3.ScaleTime<number, number>, months: Date[], d: Date, i: number): number {
    if (i < months.length - 1) {
      return timeScale(months[i + 1]) - timeScale(d);
    } else {
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      return timeScale(nextMonth) - timeScale(d);
    }
  }

  drawMeetingNode(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    date: Date,
    x: number,
    y: number,
    size: number,
    fill: string,
    stroke: string,
    strokeWidth: number,
    className: string,
    meetingIds: string[]
  ) {
    let node: any;
  
    node = svg.append('rect')
      .attr('x', x - size / 2)
      .attr('y', y - size / 2)
      .attr('width', size)
      .attr('height', size)
      .attr('fill', fill)
      .attr('stroke', stroke)
      .attr('stroke-width', strokeWidth)
      .attr('class', className)
      .style('cursor', 'pointer');
      
    node.append('title')
    .text(`${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`);

    return node;
  }

  drawNode(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    x: number,
    y: number,
    size: number,
    fill: string,
    stroke: string,
    strokeWidth: number,
    className: string
  ) {
    let node: any;
    node = svg.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', size)
      .attr('fill', fill)
      .attr('stroke', stroke)
      .attr('stroke-width', strokeWidth)
      .attr('class', className);
    
    if (className.includes('dummy-directorate')) {
      node.attr('fill', '#c9d7d3')
          .attr('stroke', '#e52b50');
    }

    return node;
  }

  drawGroupedNode(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    x: number,
    y: number,
    size: number,
    fill: string,
    stroke: string,
    strokeWidth: number,
    className: string
  ) {
    let node: any;
    node = svg.append('rect')
      .attr('r', size)
      .attr('fill', fill)
      .attr('stroke', stroke)
      .attr('stroke-width', strokeWidth)
      .attr("x", x - 10)
      .attr("y", y - 10)
      .attr("width", 20)
      .attr("height", 20)
      .attr("rx", 5)
      .attr("ry", 5)
      .style("cursor", "pointer")
      .attr('class', className);

    return node;
  }

  drawLabel(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, x: number, y: number, text: string, fontSize: string, fill: string, className: string) {
    return svg.append('text')
      .attr('x', x)
      .attr('y', y)
      .attr('text-anchor', 'middle')
      .text(text)
      .attr('font-size', fontSize)
      .attr('fill', fill)
      .attr('class', className);
  }

  drawConnection(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, path: string, entity: { id: string; type: string }, meetingId: string) {
    let self = this;
    return svg.append('path')
      .attr('d', path)
      .attr('stroke', '#cdcdcd')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('class', `link node-${entity.type}-${entity.id} link-${entity.type} link-${entity.type}-${entity.id} meeting-link-${meetingId}`)
      .on('mouseover', function () {
        d3.selectAll('.node-hover').each(function () {
          d3.select(this).classed('node-hover', false);
        });
        d3.selectAll(`.meeting-link-${meetingId}`).each(function () {
          d3.select(this).classed('node-hover', true);
        });
      })
      .on('mouseout', function () {
        d3.selectAll('.node-hover').each(function () {
          d3.select(this).classed('node-hover', false);
        });
      });
  }

  drawDottedLine(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, x1: number, y1: number, x2: number, y2: number) {
    return svg.append('line')
      .attr('x1', x1)
      .attr('x2', x2)
      .attr('y1', y1)
      .attr('y2', y2)
      .attr('stroke', '#d3d3d3')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5');
  }

  // resetStrokes(){
  //   d3.selectAll(`.link`)
  //     .transition()
  //     .duration(200)
  //     .attr('stroke', '#cdcdcd')
  //     .attr('stroke-width', 2);

  //   d3.selectAll(`.node-lobbyist:not(.node-selected)`)
  //     .transition()
  //     .duration(200)
  //     .attr('stroke', '#5b2c55')
  //     .attr('stroke-width', 2);
  
  //   d3.selectAll(`.node-representative:not(.node-selected)`)
  //     .transition()
  //     .duration(200)
  //     .attr('stroke', '#1bd41b')
  //     .attr('stroke-width', 2);
  
  //   d3.selectAll(`.node-directorate:not(.node-selected)`)
  //     .transition()
  //     .duration(200)
  //     .attr('stroke', '#297a4d')
  //     .attr('stroke-width', 2);
    
  //   d3.selectAll(`.meeting-node`)
  //     .transition()
  //     .duration(200)
  //     .attr('stroke', '#000')
  //     .attr('stroke-width', 2);

  //   d3.selectAll(`.label`)
  //     .transition()
  //     .duration(200)
  //     .attr('fill', 'white')
  //     .attr('font-size', '10px')
  //     .style('opacity', 0);
    
  //   d3.selectAll(`.node-selected`)
  //     .transition()
  //     .duration(200)
  //     .attr('stroke', '#ff7f0e')
  //     .attr('stroke-width', 2);

  //   d3.selectAll(`.node-directorate.dummy-directorate:not(.node-selected)`)
  //     .transition()
  //     .duration(200)
  //     .attr('stroke', '#e52b50')
  //     .attr('stroke-width', 2);

  //   this.redrawLabels();
  // }

  redrawLabels() {
    const labels = d3.selectAll('.label-fixed').nodes() as SVGTextElement[];

    labels.sort((a, b) => {
      const ax = (a as SVGTextElement).getBBox().x;
      const bx = (b as SVGTextElement).getBBox().x;
      return ax - bx;
    });
  
    labels.forEach((label, index) => {
      d3.select(label)
        .raise();
    });
  }

  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private zoomGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private zoomBehavior: d3.ZoomBehavior<Element, unknown> | null = null;
  private nodeGroup: d3.Selection<SVGGElement, any, SVGGElement, unknown> | null = null;
  private simulation: d3.Simulation<any, any> | null = null;
  private lassoStart: [number, number] | null = null;
  private lassoRect: d3.Selection<SVGRectElement, unknown, null, undefined> | null = null;
  private linkSelection: d3.Selection<SVGLineElement, any, SVGGElement, unknown> | null = null;
  private originalElement: HTMLElement | null = null;
  private originalNodes: any[] = [];
  private originalLinks: any[] = [];
  public simulationRunning: boolean = true;
  private originalOptions: ForceGraphOptions | undefined;
  private isRightPanning: boolean = false;
  private lastMousePosition: [number, number] | null = null;

  private labelFontSize: number = 60;
  private NodeSize: number = 20;

  drawForceGraph(
    element: HTMLElement,
    nodes: any[],
    links: any[],
    options: ForceGraphOptions
  ): void {
    let self = this;
    this.originalElement = element;
    this.originalOptions = options;
    const width = options?.width ?? 1000;
    const height = options?.height ?? 600;

    const existingSvg = d3.select(element).select('svg');
    const previousZoomTransform = !existingSvg.empty()
      ? d3.zoomTransform(existingSvg.node() as Element)
      : null;

    existingSvg.remove();

    const repNodes = this.prepareGraphLayout(nodes, links, width, height, options);

    this.originalNodes = [...nodes]; 
    this.originalLinks = JSON.parse(JSON.stringify(links));


    this.initSvg(element, width, height);
    this.createLinks(links, options);
    this.createNodes(nodes, options); 

    this.setupSimulation(nodes, links, repNodes);
    if(this.simulation) {
      this.simulation.on('tick', () => this.onTick());
    }
    // Centra grafo o ripristina zoom
    if (previousZoomTransform) {
      this.svg?.call(this.zoomBehavior!.transform as any, previousZoomTransform);
    } else {
      this.centerGraph();
    }

    this.centerGraph();

  }

    public centerGraph(): void {
    if (!this.svg || !this.zoomBehavior || !this.originalElement || !this.originalOptions) return;

    // Aspetta un po' che la simulazione si assesti prima di centrare
    setTimeout(() => {
      const visible = this.originalNodes.filter(n => !n.invisible && n.x != null && n.y != null);
      if (!visible.length) return;

      const [xMin, xMax] = d3.extent(visible, d => d.x!) as [number, number];
      const [yMin, yMax] = d3.extent(visible, d => d.y!) as [number, number];

      const centerX = (xMin + xMax) / 2;
      const centerY = (yMin + yMax) / 2;

      const width = this.originalElement!.clientWidth;
      const height = this.originalElement!.clientHeight;

      const svgCenterX = width / 2;
      const svgCenterY = height / 2;

      const zoomLevel = this.originalOptions!.zoomLevel ?? 0.3;

      const transform = d3.zoomIdentity
        .translate(svgCenterX - centerX * zoomLevel, svgCenterY - centerY * zoomLevel)
        .scale(zoomLevel);

      // Anima il cambio di trasformazione
      this.svg!.transition()
        .duration(2000) 
        .ease(d3.easeCubicInOut)
        .call(this.zoomBehavior!.transform as any, transform);
    }, 250); // attesa iniziale (regolabile)
  }

  public setLabelFontSize(size: number): void {
    this.labelFontSize = size;
    this.zoomGroup?.selectAll('.label-layer text')
      .style('font-size', `${size}px`); 
  }

  public setNodeSize(size: number): void {
    this.NodeSize = size;
    this.nodeGroup?.select('circle')
      .attr('r', (d: any) => d.invisible ? 0 : this.NodeSize);
  }


  public updateForceGraphStyles(selectedLink?: { source: string; target: string }): void {
    if (!this.zoomGroup) return;

    this.zoomGroup.selectAll('line')
      .attr('stroke', (d: any) => {
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;

        const isSelectedLink = selectedLink &&
          ((selectedLink.source === sourceId && selectedLink.target === targetId) ||
          (selectedLink.source === targetId && selectedLink.target === sourceId));

        return isSelectedLink ? 'red' : this.getLinkColor(d.similarity);
      });
  }


  private getLinkColor(sim: number): string {
    const shades = ['#d7f9e5', '#94e8b1', '#4ac873', '#23974b', '#085c28'];
    if (sim < 0.20) return shades[0];
    if (sim < 0.40) return shades[1];
    if (sim < 0.60) return shades[2];
    if (sim < 0.80) return shades[3];
    return shades[4];
  }

  public getConnectedComponents(nodes: any[], links: any[]) {
    const visited = new Set<string>();
    const components: string[][] = [];
    const adjacency = new Map<string, string[]>();

    nodes.forEach(n => adjacency.set(n.id, []));
    links.forEach(l => {
      const source = typeof l.source === 'object' ? l.source.id : l.source;
      const target = typeof l.target === 'object' ? l.target.id : l.target;
      adjacency.get(source)?.push(target);
      adjacency.get(target)?.push(source);
    });

    for (const node of nodes) {
      if (visited.has(node.id)) continue;
      const stack = [node.id];
      const component: string[] = [];
      while (stack.length) {
        const id = stack.pop()!;
        if (visited.has(id)) continue;
        visited.add(id);
        component.push(id);
        adjacency.get(id)?.forEach(nei => !visited.has(nei) && stack.push(nei));
      }
      components.push(component);
    }

      return components;
    }

    private prepareGraphLayout(nodes: any[], links: any[], width: number, height: number, options: ForceGraphOptions, preservePosition = false): any[] {
       const degreeMap = new Map<string, number>();

        // Calcola i gradi dei nodi
        links.forEach(link => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          degreeMap.set(sourceId, (degreeMap.get(sourceId) || 0) + 1);
          degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
        });

        nodes.forEach(node => {
          node.degree = degreeMap.get(node.id) || 0;
        });

        // Trova le componenti connesse
        const components = this.getConnectedComponents(nodes, links);
        const nonTrivialComponents: string[][] = [];
        const isolatedNodes: any[] = [];

        components.forEach(comp => {
          const hasEdges = comp.some(id => (degreeMap.get(id) ?? 0) > 0);
          if (hasEdges) nonTrivialComponents.push(comp);
          else isolatedNodes.push(...comp.map(id => nodes.find(n => n.id === id)!));
        });

        const repNodes: any[] = [];

        // Nodo centrale invisibile (crealo solo se non esiste già)
        let wCentral = nodes.find(n => n.id === 'w_central');
        if (!wCentral) {
          wCentral = {
            id: 'w_central',
            name: 'central',
            invisible: true,
            fx: width / 2 + 500,
            fy: height / 2 + 500
          };
          nodes.push(wCentral);
        }

        // Collega i rappresentanti dei componenti a w_central
        nonTrivialComponents.forEach(comp => {
          const representative = comp
            .map(id => nodes.find(n => n.id === id)!)
            .reduce((max, curr) => (curr.degree > max.degree ? curr : max));

          repNodes.push(representative);

          // Evita duplicazione dei link invisibili
          if (!links.some(l =>
            (l.source === 'w_central' || (typeof l.source === 'object' && l.source.id === 'w_central')) &&
            (l.target === representative.id || (typeof l.target === 'object' && l.target.id === representative.id))
          )) {
            links.push({
              source: 'w_central',
              target: representative.id,
              __invisible: true,
              strength: 0.15
            });
          }
        });

        // Collega nodi isolati direttamente a w_central
        if (isolatedNodes.length > 0) {
          isolatedNodes.forEach((n, i) => {
            if (!links.some(l =>
              (l.source === 'w_central' || (typeof l.source === 'object' && l.source.id === 'w_central')) &&
              (l.target === n.id || (typeof l.target === 'object' && l.target.id === n.id))
            )) {
              links.push({
                source: 'w_central',
                target: n.id,
                __invisible: true,
                strength: 1.0
              });
            }

            if (!preservePosition || n.x == null || n.y == null) {
              const angle = (2 * Math.PI * i) / isolatedNodes.length;
              const radius = 80;
              n.x = wCentral.fx + radius * Math.cos(angle);
              n.y = wCentral.fy + radius * Math.sin(angle);
            }
          });
        }

        // Posizionamento dei rappresentanti in cerchio
        const angleStep = (2 * Math.PI) / Math.max(repNodes.length, 1);
        const radiusBase = Math.min(width, height) / 3;
        const radiusBoost = 200;

        repNodes.forEach((node, i) => {
          if (!preservePosition || node.x == null || node.y == null) {
            const radius = radiusBase + radiusBoost;
            const angle = i * angleStep;
            node.x = wCentral.fx + radius * Math.cos(angle);
            node.y = wCentral.fy + radius * Math.sin(angle);
          }
        });


        // Posiziona i nodi vicino ai rappresentanti
        nonTrivialComponents.forEach((comp, i) => {
          const representative = repNodes[i];
          comp.forEach(id => {
            const node = nodes.find(n => n.id === id);
            if (node && node.degree > 0 && node.id !== representative.id) {
              if (!preservePosition || node.x == null || node.y == null) {
                node.x = representative.x + Math.random() * 10;
                node.y = representative.y + Math.random() * 10;
              }
            }
          });
        });

        return repNodes;
      }

    private initSvg(element: HTMLElement, width: number, height: number): void {
      const existingSvg = d3.select(element).select('svg');
      const previousZoomTransform = !existingSvg.empty()
        ? d3.zoomTransform(existingSvg.node() as Element)
        : null;

      existingSvg.remove();

      this.svg = d3.select(element)
        .append('svg')
        .attr('width', width)
        .attr('class', 'force-graph')
        .attr('height', height)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('viewBox', `0 0 ${width} ${height}`);

      this.zoomGroup = this.svg.append('g');

      this.setupZoom();

      if (previousZoomTransform) {
        this.svg.call(this.zoomBehavior!.transform as any, previousZoomTransform);
      }

      this.setupLasso();
      this.setupRightClickPan();
    }


    private setupZoom(): void {
      this.zoomBehavior = d3.zoom<Element, unknown>()
        .filter(event => event.type === 'wheel' || (event.type === 'mousedown' && event.button === 2))
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          if (this.zoomGroup) {
            this.zoomGroup.attr('transform', event.transform);
          }
        });

      this.svg!.call(this.zoomBehavior as any);
    }

    private setupLasso(): void {
      this.svg!
        .on('mousedown.lasso', (event) => {
          if (event.button !== 0) return;

          event.preventDefault();

          const transform = d3.zoomTransform(this.svg!.node()!);
          const [rawX, rawY] = d3.pointer(event);
          const x = (rawX - transform.x) / transform.k;
          const y = (rawY - transform.y) / transform.k;
          this.lassoStart = [x, y];

          this.lassoRect = this.zoomGroup!.append('rect')
            .attr('x', x)
            .attr('y', y)
            .attr('width', 0)
            .attr('height', 0)
            .attr('fill', 'rgba(100, 100, 255, 0.1)')
            .attr('stroke', '#3366cc')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '4,2');

          const onMouseMove = (event: MouseEvent) => this.updateLasso(event);
          const onMouseUp = (event: MouseEvent) => this.finalizeLasso(event, onMouseMove, onMouseUp);

          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        })
        .on('contextmenu', event => event.preventDefault());
    }

    private updateLasso(event: MouseEvent): void {
      if (!this.lassoStart || !this.svg) return;
      const transform = d3.zoomTransform(this.svg.node()!);
      const [rawX, rawY] = d3.pointer(event, this.svg.node()!);
      const x1 = (rawX - transform.x) / transform.k;
      const y1 = (rawY - transform.y) / transform.k;
      const [x0, y0] = this.lassoStart;
      const x = Math.min(x0, x1);
      const y = Math.min(y0, y1);
      const width = Math.abs(x1 - x0);
      const height = Math.abs(y1 - y0);
      this.lassoRect!
        .attr('x', x)
        .attr('y', y)
        .attr('width', width)
        .attr('height', height);
    }

    private finalizeLasso(event: MouseEvent, onMove: any, onUp: any): void {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      if (!this.lassoRect || !this.nodeGroup) return;

      const x = +this.lassoRect.attr('x');
      const y = +this.lassoRect.attr('y');
      const width = +this.lassoRect.attr('width');
      const height = +this.lassoRect.attr('height');

      const selected: any[] = [];
      this.nodeGroup.each(function (d: any) {
        if (d.invisible) return;
        if (d.x >= x && d.x <= x + width && d.y >= y && d.y <= y + height) {
          selected.push(d);
        }
      });

      this.nodeGroup.each(function (d: any) {
        d3.select(this).classed('node-lobbyist-draggable', selected.includes(d));
      });

      this.lassoRect.remove();
      this.lassoRect = null;
      this.lassoStart = null;

      this.applyGroupDrag(selected);
    }

    private setupRightClickPan(): void {
      this.svg!
        .on('mousedown', (event) => {
          if (event.button === 2) {
            this.isRightPanning = true;
            this.lastMousePosition = [event.clientX, event.clientY];
          }
        })
        .on('mousemove', (event) => {
          if (this.isRightPanning && this.lastMousePosition) {
            const [lx, ly] = this.lastMousePosition;
            const dx = event.clientX - lx;
            const dy = event.clientY - ly;
            const currentTransform = d3.zoomTransform(this.svg!.node()!);
            const newTransform = currentTransform.translate(dx, dy);
            this.svg!.call(this.zoomBehavior!.transform as any, newTransform);
            this.lastMousePosition = [event.clientX, event.clientY];
          }
        })
        .on('mouseup', (event) => {
          if (event.button === 2) {
            this.isRightPanning = false;
            this.lastMousePosition = null;
          }
        });
    }


    private createLinks(links: any[], options: ForceGraphOptions): void {
      const linkGroup = this.zoomGroup!.append('g').classed('links', true);

      this.linkSelection = linkGroup
        .selectAll('line')
        .data(links.filter((d: any) => !d.__invisible), (d: any) => {
          const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
          const targetId = typeof d.target === 'object' ? d.target.id : d.target;
          return `${sourceId}-${targetId}`;
        })
        .enter()
        .append('line')
        .attr('stroke-width', 8)
        .attr('stroke', (d: any) => this.getLinkColor(d.similarity))
        .on('click', (event, d) => {
          event.preventDefault();
          event.stopPropagation();
          options?.onLinkLeftClick?.(d);
        });
    }



    private createNodes(nodes: any[], options: ForceGraphOptions): void {
      this.nodeGroup = this.zoomGroup!.append('g')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .call(this.defaultNodeDrag());

      const self = this;

      this.nodeGroup.append('circle')
        .attr('r', d => d.invisible ? 0 : 15)
        .attr('fill', d => {
          if (d.id === 'w_central') return 'red'; // nodo centrale rosso
          return d.invisible ? 'none' : '#ae58a3';
        })
        .attr('stroke', d => {
          if (d.id === 'w_central') return 'darkred'; // bordo più scuro
          return d.invisible ? 'none' : '#5b2c55';
        })
        .attr('stroke-width', 2)
        .attr('data-id', d => d.id)
        .attr('class', d => `node-lobbyist node-lobbyist-${d.id}`);

      const labelLayer = this.zoomGroup!.append('g').attr('class', 'label-layer');

      labelLayer.selectAll('text')
        .data(nodes)
        .enter()
        .append('text')
        .text(d => d.name)
        .attr('text-anchor', 'middle')
        .attr('dy', '-10')
        .attr('class', d => `node-label node-lobbyist-${d.id}`)
        .attr('fill', '#004b87')
        .attr('stroke', 'white')
        .attr('stroke-width', 8)
        .attr('stroke-linejoin', 'round')
        .attr('paint-order', 'stroke')
        .style('font-size', `${this.labelFontSize}px`)
        //.style('font-weight', 'bold')
        .style('display', 'none');


      this.nodeGroup
        .on('click', (event, d) => {
          event.stopPropagation();
          options?.onNodeClick?.(d);
        })
        .on('mouseover', function (event, d) {
          if (d3.select(this).classed('node-lobbyist-pinned')) return;
          d3.selectAll('.node-hover').classed('node-hover', false);
          d3.selectAll(`.node-lobbyist-${d.id}`).classed('node-hover', true);
          d3.selectAll(`.link-lobbyist-${d.id}`).classed('node-hover', true);
          self.emitLabelText(d.name);
          d3.select(self.svg!.node()!).selectAll('line').each(function (l: any) {
            const sid = typeof l.source === 'object' ? l.source.id : l.source;
            const tid = typeof l.target === 'object' ? l.target.id : l.target;
            if (sid === d.id || tid === d.id) {
              d3.select(this).classed('link-hover', true);
            }
          });
        })
        .on('mouseout', function (event, d) {
          d3.selectAll('.node-hover').classed('node-hover', false);
          self.emitLabelText('');
          d3.select(self.svg!.node()!).selectAll('line').each(function (l: any) {
            const sid = typeof l.source === 'object' ? l.source.id : l.source;
            const tid = typeof l.target === 'object' ? l.target.id : l.target;
            if (sid === d.id || tid === d.id) {
              d3.select(this).classed('link-hover', false);
            }
          });
        })
        .on('contextmenu', function (event, d) {
          event.preventDefault();
          event.stopPropagation();
          const isPinned = d3.select(this).classed('node-lobbyist-pinned');
          d3.selectAll(`.node-lobbyist-${d.id}`).classed('node-lobbyist-pinned', !isPinned);
          options?.onNodeRightClick?.(d);
        });
    }

    private setupSimulation(
      nodes: any[],
      links: any[],
      repNodes: any[]
    ): void {
      this.simulation = d3.forceSimulation(nodes)
        .alpha(1)
        .alphaDecay(0.01)
        .alphaMin(0.005)
        .velocityDecay(0.7)

        // Link force
        .force('link', d3.forceLink(links)
          .id((d: any) => d.id)
          .strength((d: any) => d.strength ?? 0.05)
          .distance((d: any) =>
            d.__invisible ? 100 : Math.max(100, 300 - (d.similarity ?? 0) * 200)
          )
        )

        // Repulsione generale
        .force('charge', d3.forceManyBody().strength((d: any) => {
          return (!d.invisible && d.id !== 'w_central') ? -50 : 0;
        }))

        // Collisioni
        .force('collide', d3.forceCollide((d: any) => {
          if (d.invisible && d.id !== 'w_central') return 0;
          return d.degree === 0 ? 30 : 40;
        }).strength(0.5))

        // Forza custom: respingere i rappresentanti
        .force('repelRepresentatives', this.createRepulsionForce(repNodes))

        .force('repelFromCentral', this.createCentralRepulsionForce());


      this.simulation.restart();
    }

    private createRepulsionForce(repNodes: any[]): d3.Force<any, any> {
      const force = (alpha: number) => {
        for (let i = 0; i < repNodes.length; i++) {
          for (let j = i + 1; j < repNodes.length; j++) {
            const a = repNodes[i];
            const b = repNodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist2 = dx * dx + dy * dy + 0.01;
            const force = 5000 / dist2;
            const fx = dx * force;
            const fy = dy * force;

            a.vx += fx * alpha;
            a.vy += fy * alpha;
            b.vx -= fx * alpha;
            b.vy -= fy * alpha;
          }
        }
      };

      // For compatibility with D3's expectations
      (force as any).initialize = () => {};
      return force;
    }


    private createCentralRepulsionForce(): d3.Force<any, any> {
      const force = (alpha: number) => {
        const nodes = this.simulation?.nodes() ?? [];
        const central = nodes.find(n => n.id === 'w_central');
        if (!central || central.fx == null || central.fy == null) return;

        for (const node of nodes) {
          if (node.id === 'w_central' || node.invisible) continue;
          if (node.degree === 0) continue;

          const dx = node.x - central.fx;
          const dy = node.y - central.fy;
          const dist2 = dx * dx + dy * dy + 0.01;
          const repulsion = 5000 / dist2;

          node.vx += dx * repulsion * alpha;
          node.vy += dy * repulsion * alpha;
        }
      };

      (force as any).initialize = () => {};
      return force;
    }


    private onTick(): void {
      if (!this.simulation) return;

      // 1. Aggiorna posizione link
      this.linkSelection?.attr('x1', (d: any) => this.getNodePosition(d.source)?.x ?? 0)
                        .attr('y1', (d: any) => this.getNodePosition(d.source)?.y ?? 0)
                        .attr('x2', (d: any) => this.getNodePosition(d.target)?.x ?? 0)
                        .attr('y2', (d: any) => this.getNodePosition(d.target)?.y ?? 0);

      // 2. Muovi gruppi dei nodi
      this.nodeGroup?.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

      this.zoomGroup!.selectAll('.label-layer text')
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y - 10)


    }

    public setSimulationRunning(running: boolean): void {
      if (!this.simulation) return;

      this.simulationRunning = running;

      if (running) {
        const filteredLinks = this.linkSelection?.data().map((d: any) => ({
          ...d,
          source: typeof d.source === 'object' ? d.source.id : d.source,
          target: typeof d.target === 'object' ? d.target.id : d.target
        })) ?? [];

        this.originalNodes = this.simulation.nodes();

        const repNodes = this.prepareGraphLayout(
          this.originalNodes,
          filteredLinks,
          this.originalElement!.clientWidth,
          this.originalElement!.clientHeight,
          this.originalOptions!,
          true // ← conserva posizione
        );

        this.simulation
          .force('charge', d3.forceManyBody().strength((d: any) => {
            return (!d.invisible && d.id !== 'w_central') ? -50 : 0;
          }))
          .force('link', d3.forceLink(filteredLinks)
            .id((d: any) => d.id)
            .strength((d: any) => d.strength ?? 0.05)
            .distance((d: any) =>
              d.__invisible ? 100 : Math.max(100, 300 - (d.similarity ?? 0) * 200)
            )
          )
          .force('collide', d3.forceCollide((d: any) => {
            if (d.invisible && d.id !== 'w_central') return 0;
            return d.degree === 0 ? 30 : 40;
          }).strength(0.5))
          .force('repelRepresentatives', this.createRepulsionForce(repNodes))
          .force('repelFromCentral', this.createCentralRepulsionForce());

        this.simulation.nodes().forEach((node: any) => {
          if (node.id === 'w_central') {
            node.fx = this.originalNodes.find(n => n.id === 'w_central')?.fx;
            node.fy = this.originalNodes.find(n => n.id === 'w_central')?.fy;
          } else {
            node.fx = null;
            node.fy = null;
          }
        });

        this.simulation.alpha(1.0).restart();

        this.updateNodeSelection(this.originalOptions?.SelectedNode ?? []);
        this.setLabelFontSize(this.labelFontSize);
      } else {
        // Salva stato e ferma la simulazione
        this.simulation.stop();

        this.simulation.force('charge', null);
        this.simulation.force('link', null);
        this.simulation.force('collide', null);
        this.simulation.force('repelRepresentatives', null);
        this.simulation.force('repelFromCentral', null);

        // Azzera velocità dei nodi
        this.simulation.nodes().forEach((node: any) => {
          node.vx = 0;
          node.vy = 0;
        });

        if (this.originalOptions) {
          const selected: { id: string; type: 'lobbyist' }[] = [];
          const draggable: { id: string; type: 'lobbyist' }[] = [];

          this.nodeGroup?.each((d: any, i, nodes) => {
            const g = d3.select(nodes[i]);
            if (g.classed('node-lobbyist-pinned')) {
              selected.push({ id: d.id, type: 'lobbyist' });
            }
            if (g.classed('node-lobbyist-draggable')) {
              draggable.push({ id: d.id, type: 'lobbyist' });
            }
          });

          this.originalOptions.SelectedNode = selected;
          this.originalOptions.DraggableNode = draggable;


        }
      }
    }

    public updateNodeSelection(selectedNodes: SelectedNode[]): void {
      const selectedIds = new Set(selectedNodes.map(n => n.id));

      this.nodeGroup?.each(function (d: any) {
        const isSelected = selectedIds.has(d.id);
        const group = d3.select(this);

        group.classed('node-lobbyist-pinned', isSelected);

        group.select('circle')
          .attr('stroke', isSelected ? '#ff7f0e' : '#5b2c55')
          .attr('stroke-width', isSelected ? 3 : 2);

        group.select('text')
          .text(d.name)
          .style('display', isSelected ? 'block' : 'none');
      });


      this.zoomGroup?.selectAll('line')
        .each(function (l: any) {
          const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
          const targetId = typeof l.target === 'object' ? l.target.id : l.target;

          const isLinkedToSelected = selectedIds.has(sourceId) || selectedIds.has(targetId);
          d3.select(this).classed('link-pinned', isLinkedToSelected);
        });
    }

    private applyGroupDrag(draggableNodes: any[]): void {
      const dragGroup = d3.drag<SVGGElement, any>()
        .on('start', (event, d) => {
          if (!event.active) this.simulation?.alphaTarget(0.3).restart();
          for (const n of draggableNodes) {
            n.__initialX = n.x;
            n.__initialY = n.y;
          }
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          const dx = event.x - d.__initialX;
          const dy = event.y - d.__initialY;
          for (const n of draggableNodes) {
            n.fx = n.__initialX + dx;
            n.fy = n.__initialY + dy;
          }
        })
        .on('end', (event, d) => {
          if (!event.active) this.simulation?.alphaTarget(0);
          for (const n of draggableNodes) {
            if (!this.simulationRunning) {
              n.fx = n.x;
              n.fy = n.y;
              n.vx = 0;
              n.vy = 0; 
            } else {
              n.fx = null;
              n.fy = null;
            }
            delete n.__initialX;
            delete n.__initialY;
          }
          this.nodeGroup?.each((d: any, i, nodes) => {
            const nodeSel = d3.select(nodes[i]);
            if (draggableNodes.includes(d)) {
              nodeSel
                .classed('node-lobbyist-draggable', false)
                .call(this.defaultNodeDrag());
            }
          });
        });
      this.nodeGroup?.each((d: any, i, nodes) => {
        const node = d3.select(nodes[i]);
        if (draggableNodes.includes(d)) {
          node.call(dragGroup);
        } else {
          node.call(this.defaultNodeDrag());
        }
      });
    }

    private defaultNodeDrag(): d3.DragBehavior<SVGGElement, any, any> {
      return d3.drag<SVGGElement, any>()
        .on('start', (event, d) => {
          if (!event.active) this.simulation?.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) this.simulation?.alphaTarget(0);
          if (!this.simulationRunning) {
            d.fx = d.x;
            d.fy = d.y;
            d.vx = 0;
            d.vy = 0;
          } else {
            d.fx = null;
            d.fy = null;
          }
        });
    }

    public updateGraphLinksOnly(links: Link[]): void {
      if (!this.zoomGroup) {
        console.warn('zoomGroup non inizializzato');
        return;
      }

      const visibleLinks = links.filter(l => !l.__invisible);

      // Trova o crea il gruppo dei link
      let linkGroup = this.zoomGroup.select<SVGGElement>('g.links');
      if (linkGroup.empty()) {
        linkGroup = this.zoomGroup.append('g').classed('links', true);
      }

      // D3 data binding
      const linkSelection = linkGroup
        .selectAll<SVGLineElement, any>('line')
        .data(visibleLinks, (d: any) => {
          const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
          const targetId = typeof d.target === 'object' ? d.target.id : d.target;
          return `${sourceId}-${targetId}`;
        });

      // Rimuove link vecchi
      linkSelection.exit().remove();

      // Aggiunge nuovi link
      const newLinks = linkSelection.enter()
        .append('line')
        .attr('stroke-width', 8)
        .attr('stroke', (d: any) => this.getLinkColor(d.similarity))
        .on('click', (event, d) => {
          event.preventDefault();
          event.stopPropagation();
          this.originalOptions?.onLinkLeftClick?.(d);
        });

      // Merge: aggiorna tutti
      this.linkSelection = linkSelection.merge(newLinks as any);
      this.linkSelection
        .attr('stroke', (d: any) => this.getLinkColor(d.similarity));

      // Aggiorna coordinate dei link
      this.linkSelection
        .attr('x1', (d: any) => this.getNodePosition(d.source)?.x ?? 0)
        .attr('y1', (d: any) => this.getNodePosition(d.source)?.y ?? 0)
        .attr('x2', (d: any) => this.getNodePosition(d.target)?.x ?? 0)
        .attr('y2', (d: any) => this.getNodePosition(d.target)?.y ?? 0);

      // Salva links se la simulazione è ferma
      if (!this.simulationRunning) {
        this.originalLinks = JSON.parse(JSON.stringify(links));
      }


    }

    private getNodePosition(nodeRef: any): { x: number; y: number } | null {
      const id = typeof nodeRef === 'object' ? nodeRef.id : nodeRef;
      const node = this.originalNodes.find(n => n.id === id);
      return node?.x != null && node?.y != null ? { x: node.x, y: node.y } : null;
    }

    public recomputeGraphStructure(): void {
      if (!this.simulation || !this.originalElement || !this.originalOptions) return;

      // Usa i link attivi aggiornati
      const filteredLinks = this.linkSelection?.data().map((d: any) => ({
        ...d,
        source: typeof d.source === 'object' ? d.source.id : d.source,
        target: typeof d.target === 'object' ? d.target.id : d.target
      })) ?? [];

      // Usa direttamente originalNodes, NON cloni
      const repNodes = this.prepareGraphLayout(
        this.originalNodes,
        filteredLinks,
        this.originalElement.clientWidth,
        this.originalElement.clientHeight,
        this.originalOptions,
        true // preservePosition
      );

      // Aggiorna forze
      this.simulation.force('repelRepresentatives', this.createRepulsionForce(repNodes));
      this.simulation.force('link', d3.forceLink(filteredLinks)
        .id((d: any) => d.id)
        .strength((d: any) => d.strength ?? 0.1)
        .distance((d: any) =>
          d.__invisible ? 100 : Math.max(100, 300 - (d.similarity ?? 0) * 200)
        )
      );

      // Riavvia simulazione
      this.simulation.alpha(1).restart();


    }


    public setOriginalLinks(links: any[]): void {
      this.originalLinks = [...links];
    }

  public centerAfterSimulation(): void {
    if (!this.svg || !this.zoomBehavior || !this.originalElement || !this.originalOptions) return;

    // Aspetta un po' che la simulazione si assesti prima di centrare
    setTimeout(() => {
      const visible = this.originalNodes.filter(n => !n.invisible && n.x != null && n.y != null);
      if (!visible.length) return;

      const [xMin, xMax] = d3.extent(visible, d => d.x!) as [number, number];
      const [yMin, yMax] = d3.extent(visible, d => d.y!) as [number, number];

      const centerX = (xMin + xMax) / 2;
      const centerY = (yMin + yMax) / 2;

      const width = this.originalElement!.clientWidth;
      const height = this.originalElement!.clientHeight;

      const svgCenterX = width / 2;
      const svgCenterY = height / 2;

      const zoomLevel = this.originalOptions!.zoomLevel ?? 0.3;

      const transform = d3.zoomIdentity
        .translate(svgCenterX - centerX * zoomLevel, svgCenterY - centerY * zoomLevel)
        .scale(zoomLevel);

      // Anima il cambio di trasformazione
      this.svg!.transition()
        .duration(2000) 
        .ease(d3.easeCubicInOut)
        .call(this.zoomBehavior!.transform as any, transform);
    }, 3000); // attesa iniziale (regolabile)
  }


}




