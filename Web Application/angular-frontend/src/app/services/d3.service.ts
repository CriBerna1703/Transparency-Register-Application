import { Injectable } from '@angular/core';
import { SelectedNode } from './selection.service';
import * as d3 from 'd3';

export interface ForceGraphOptions {
  width?: number;
  height?: number;
  zoomLevel?: number;
  minSim?: number; 
  maxSim?: number;
  SelectedNode?: SelectedNode[];
  onNodeClick?: (d: any) => void;
  onLinkLeftClick?: (link: any) => void;
  onNodeRightClick?: (d: any) => void;
}

@Injectable({
  providedIn: 'root'
})
export class D3Service {
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

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
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
      .style('font-size', '12px');

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
      .style('font-size', '12px')
      .style('fill', 'black')
      .text(d => d > 0 ? d : '');
    
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
      .attr('transform', 'rotate(-30)')
      .style('text-anchor', 'end')
      .style('font-size', '12px');
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

  drawMonths(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, width: number, height: number, startDate: Date, endDate: Date): void {
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
  
    const lastMonthEnd = new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 1);
    const lastMonthX = timeScale(lastMonthEnd);

    for (let i = 0; i < months.length - 1; i++) {
      const curr = months[i];
      const next = months[i + 1];
      if (curr.getFullYear() !== next.getFullYear()) {
        const x = timeScale(next);

        svg.append('line')
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', height - 30)
          .attr('y2', height + 35)
          .attr('stroke', '#888')
          .attr('stroke-width', 2)
          .attr('class', 'year-change-bar');

        svg.append('text')
          .attr('x', x - 8)
          .attr('y', height - 35)
          .attr('text-anchor', 'end')
          .attr('font-size', '14px')
          .attr('fill', '#444')
          .text(curr.getFullYear());

        svg.append('text')
          .attr('x', x + 8)
          .attr('y', height - 35)
          .attr('text-anchor', 'start')
          .attr('font-size', '14px')
          .attr('fill', '#444')
          .text(next.getFullYear());
      }
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

    let self = this;
  
    node.on('mouseover',function () {
      self.resetStrokes();
      meetingIds.forEach(meetingId => {
        d3.selectAll(`.meeting-link-${meetingId}`).each(function () {
          d3.select(this).raise();
        });
    
        d3.selectAll(`.meeting-link-${meetingId}`)
          .transition()
          .duration(200)
          .attr('stroke', '#ff7f0e')
          .attr('stroke-width', 4);
      });
    });
    node.on('mouseout',function () {
      self.resetStrokes();
      d3.select(node.node())
        .transition()
        .duration(200)
        .attr('x', x - size / 2)
        .attr('y', y - size / 2)
        .attr('width', size)
        .attr('height', size)          
        .attr('stroke', '#000')
        .attr('stroke-width', 2);
    });
  
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
      .attr('class', `link link-${entity.type}-${entity.id} meeting-link-${meetingId}`)
      .on('mouseover', function () {
        d3.selectAll(`.meeting-link-${meetingId}`)
          .transition()
          .duration(200)
          .attr('stroke', '#ff7f0e')
          .attr('stroke-width', 4);
      })
      .on('mouseout', function () {
        self.resetStrokes();
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

  resetStrokes(){
    d3.selectAll(`.link`)
      .transition()
      .duration(200)
      .attr('stroke', '#cdcdcd')
      .attr('stroke-width', 2);

    d3.selectAll(`.node-lobbyist:not(.node-selected)`)
      .transition()
      .duration(200)
      .attr('stroke', '#5b2c55')
      .attr('stroke-width', 2);
  
    d3.selectAll(`.node-representative:not(.node-selected)`)
      .transition()
      .duration(200)
      .attr('stroke', '#1bd41b')
      .attr('stroke-width', 2);
  
    d3.selectAll(`.node-directorate:not(.node-selected)`)
      .transition()
      .duration(200)
      .attr('stroke', '#297a4d')
      .attr('stroke-width', 2);
    
    d3.selectAll(`.meeting-node`)
      .transition()
      .duration(200)
      .attr('stroke', '#000')
      .attr('stroke-width', 2);

    d3.selectAll(`.label`)
      .transition()
      .duration(200)
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .style('opacity', 0);
    
    d3.selectAll(`.node-selected`)
      .transition()
      .duration(200)
      .attr('stroke', '#ff7f0e')
      .attr('stroke-width', 2);

    d3.selectAll(`.node-directorate.dummy-directorate:not(.node-selected)`)
      .transition()
      .duration(200)
      .attr('stroke', '#e52b50')
      .attr('stroke-width', 2);

    this.redrawLabels();
  }

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
  private selectorGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private selectorRect: d3.Selection<SVGRectElement, unknown, null, undefined> | null = null;
  private resizeHandle: d3.Selection<SVGRectElement, unknown, null, undefined> | null = null;
  private originalElement: HTMLElement | null = null;
  private originalNodes: any[] = [];
  private originalLinks: any[] = [];
  private originalOptions: ForceGraphOptions | undefined;
  private simulationPaused: boolean = false;
  private savedForces: Map<string, d3.Force<any, any>> = new Map();
  private labelFontSize: number = 12;

  drawForceGraph(
    element: HTMLElement,
    nodes: any[],
    links: any[],
    options?: ForceGraphOptions
  ): void {
    this.originalElement = element;
    this.originalNodes = JSON.parse(JSON.stringify(nodes)); // deep copy
    this.originalLinks = JSON.parse(JSON.stringify(links));
    this.originalOptions = options;
    const width = options?.width ?? 1000;
    const height = options?.height ?? 600;
    const initialZoom = (options?.zoomLevel ?? 0.3);

    const degreeMap = new Map<string, number>();
    links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      degreeMap.set(sourceId, (degreeMap.get(sourceId) || 0) + 1);
      degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
    });

    nodes.forEach(node => {
      node.degree = degreeMap.get(node.id) || 0;
    });

    const components = this.getConnectedComponents(nodes, links);
    console.log('Connected components:', components.length);
    const nonTrivialComponents: string[][] = [];
    const isolatedNodes: any[] = [];

    components.forEach(comp => {
      const hasEdges = comp.some(id => (degreeMap.get(id) ?? 0) > 0);
      if (hasEdges) nonTrivialComponents.push(comp);
      else isolatedNodes.push(...comp.map(id => nodes.find(n => n.id === id)!));
    });

    const componentAnchors: { [compIndex: number]: string } = {};
    const wiNodes: any[] = [];

    nonTrivialComponents.forEach((comp, i) => {
      const anchorNode = comp.find(id => degreeMap.get(id)! > 0)!;
      const wi = {
        id: `w_${i}`,
        name: '',
        invisible: true,
        fx: null,
        fy: null
      };
      nodes.push(wi);
      wiNodes.push(wi);
      links.push({
        source: `w_${i}`,
        target: anchorNode,
        __invisible: true,
        strength: 0.07
      });
      componentAnchors[i] = anchorNode;
    });


    const wCentral = {
      id: 'w_central',
      name: '',
      invisible: true,
      fx: width / 2 + 500,
      fy: height / 2+ 500
    };
    nodes.push(wCentral);


    wiNodes.forEach(wi => {
      links.push({
        source: 'w_central',
        target: wi.id,
        __invisible: true,
        strength: 0.1  // debole per non attrarre troppo
      });
    });

    if (isolatedNodes.length > 0) {
      const wK = {
        id: 'w_k',
        name: '',
        invisible: true,
        fx: null,
        fy: null,
        x : width / 2,
        y: height / 2
      };
      nodes.push(wK);

      isolatedNodes.forEach(n => {
        links.push({
          source: 'w_k',
          target: n.id,
          __invisible: true,
          strength: 1.0  // forza alta per mantenere vicini i nodi isolati
        });
      });

      // Collega w_k al centro generale w_central
      links.push({
        source: 'w_central',
        target: 'w_k',
        __invisible: true,
        strength: 0.04  // stessa forza degli altri w_i
      });

      // Posizione iniziale di w_k vicino a w_central
      wK.x = wCentral.fx ;
      wK.y = wCentral.fy ;

      // Posizione iniziale dei nodi isolati attorno a w_k in cerchio
      isolatedNodes.forEach((n, i) => {
        const angle = (2 * Math.PI * i) / isolatedNodes.length;
        const radius = 60;
        n.x = wK.x + radius * Math.cos(angle);
        n.y = wK.y + radius * Math.sin(angle);
      });
    }


    const angleStep = (2 * Math.PI) / wiNodes.length;
    const radiusBase = Math.min(width, height) / 3;

    wiNodes.forEach((wi, i) => {
      const compSize = nonTrivialComponents[i].length;
      const radius = radiusBase + compSize * 5;
      const angle = i * angleStep;
      wi.x = wCentral.fx + radius * Math.cos(angle);
      wi.y = wCentral.fy + radius * Math.sin(angle);
    });

    nonTrivialComponents.forEach((comp, i) => {
      const wi = wiNodes[i];
      comp.forEach(id => {
        const node = nodes.find(n => n.id === id);
        if (node && node.degree > 0) {
          node.x = wi.x + Math.random() * 10;
          node.y = wi.y + Math.random() * 10;
        }
      });
    });



    let previousZoomTransform: d3.ZoomTransform | null = null;
    const existingSvg = d3.select(element).select('svg');
    if (!existingSvg.empty()) {
      previousZoomTransform = d3.zoomTransform(existingSvg.node() as Element);
    }
    d3.select(element).select('svg').remove();

    this.svg = d3.select(element)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('viewBox', `0 0 ${width} ${height}`);

    this.zoomGroup = this.svg.append('g');

  
    this.zoomBehavior = d3.zoom<Element, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        const transform = event.transform;
        this.zoomGroup?.attr('transform', transform);
      });

    this.svg.call(this.zoomBehavior as any);


    this.simulation = d3.forceSimulation(nodes)
      .alpha(1)
      .alphaDecay(0.03)
      .alphaMin(0.001)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .strength((d: any) => d.strength ?? 0.1)
        .distance((d: any) => d.__invisible ? 100 : Math.max(100, 300 - (d.similarity ?? 0) * 200))
      )
      .force('charge', d3.forceManyBody().strength((d: any) => {
        if (d.id === 'w_central') return 0;

        if (d.invisible && d.id === 'w_k') return 0;

        return -150;
      }))
      .force('collide', d3.forceCollide((d: any) => d.degree === 0 ? 20 : 40).strength(1.0))
      .force('repelWiNodes', () => {
        return {
          initialize() {}, 
          apply: (alpha: number) => {
            for (let i = 0; i < wiNodes.length; i++) {
              for (let j = i + 1; j < wiNodes.length; j++) {
                const a = wiNodes[i];
                const b = wiNodes[j];
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
          }
        };
      })


    this.simulation.restart();

    const drag = d3.drag<SVGGElement, any>()
      .on('start', (event, d) => {
        if (!event.active) this.simulation!.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) this.simulation!.alphaTarget(0);
        if (this.simulationPaused) {
          d.fx = d.x;
          d.fy = d.y;
        } else {
          d.fx = null;
          d.fy = null;
        }
      });

    const link = this.zoomGroup.append('g')
      .selectAll('line')
      .data(links.filter((d: any) => !d.__invisible))
      .enter()
      .append('line')
      .attr('stroke-width', 5)
      .attr('stroke', (d: any) => this.getLinkColor(d.similarity))
      .on('click', (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        options?.onLinkLeftClick?.(d);
      });

    this.nodeGroup = this.zoomGroup.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(drag);


    this.nodeGroup.append('circle')
      .attr('r', (d: any) => d.invisible ? 0 : 7)
      .attr('fill', (d: any) => d.invisible ? 'none' : '#ae58a3') 
      .attr('stroke', (d: any) => d.invisible ? 'none' : '#5b2c55') 
      .attr('stroke-width', 2)
      .style('display', null) 
      .attr('data-id', d => d.id);

    this.nodeGroup.append('text')
      .text((d: any) => d.name)
      .attr('text-anchor', 'middle')
      .attr('fill', '#004b87')
      .attr('dy', '-10')
      .style('display', 'none');

    this.nodeGroup
      .on('click', (event, d) => {
        event.stopPropagation();
        options?.onNodeClick?.(d);
      })
      .on('mouseover', function (event, d) {
      const group = d3.select(this);
      if (group.classed('node-lobbyist-selected')) return;

      group.classed('node-hover', true);

      d3.select(element).selectAll('line')
        .each(function (l: any) {
          const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
          const targetId = typeof l.target === 'object' ? l.target.id : l.target;

          if (sourceId === d.id || targetId === d.id) {
            d3.select(this).classed('link-hover', true);
          }
        });
      })
      .on('mouseout', function (event, d) {
        d3.select(this).classed('node-hover', false);

        d3.select(element).selectAll('line')
          .each(function (l: any) {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;

            if (sourceId === d.id || targetId === d.id) {
              d3.select(this).classed('link-hover', false);
            }
          });
      })
      .on('contextmenu', function (event, d) {
        event.preventDefault();
        event.stopPropagation();
      
        options?.onNodeRightClick?.(d);
      });


    this.simulation.on('tick', () => {
      console.log('[tick]');
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      this.nodeGroup?.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

      const zoomScale = d3.zoomTransform(this.svg!.node()!).k;
      this.nodeGroup?.selectAll('text')
      .attr('transform', `scale(${1 / zoomScale})`);
    });

    if (previousZoomTransform) {
      this.svg.call(this.zoomBehavior!.transform as any, previousZoomTransform);
    } else {
      // Calcolo centro dei nodi visibili
      const visibleNodes = nodes.filter(n => !n.invisible && n.x != null && n.y != null);
      const xExtent = d3.extent(visibleNodes, d => d.x) as [number, number];
      const yExtent = d3.extent(visibleNodes, d => d.y) as [number, number];

      const graphCenterX = (xExtent[0] + xExtent[1]) / 2;
      const graphCenterY = (yExtent[0] + yExtent[1]) / 2;

      const svgCenterX = width / 2;
      const svgCenterY = height / 2;

      const xOffset = 250;

      const initialTransform = d3.zoomIdentity
        .translate(svgCenterX - graphCenterX * initialZoom + xOffset, svgCenterY - graphCenterY * initialZoom)
        .scale(initialZoom);

      this.svg.call(this.zoomBehavior!.transform as any, initialTransform);
    }
  }

  public setLabelFontSize(size: number): void {
    this.labelFontSize = size;
    this.nodeGroup?.select('text').style('font-size', `${this.labelFontSize}px`);
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

  private getConnectedComponents(nodes: any[], links: any[]) {
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

  public pauseSimulation(): void {
    if (this.simulation && !this.simulationPaused) {
      // 🧠 Salva i nodi selezionati (se disponibile)
      if (this.originalOptions) {
        const selected: { id: string; type: 'lobbyist' }[] = [];

        this.nodeGroup?.each((d: any, i, nodes) => {
          const g = d3.select(nodes[i]);
          if (g.classed('node-lobbyist-selected')) {
            selected.push({ id: d.id, type: 'lobbyist' });
          }
        });

        this.originalOptions.SelectedNode = selected;
      }

      this.savedForces.clear();
      this.savedForces.set('link', this.simulation.force('link')!);
      this.savedForces.set('charge', this.simulation.force('charge')!);
      this.savedForces.set('collide', this.simulation.force('collide')!);
      this.savedForces.set('repelWiNodes', this.simulation.force('repelWiNodes')!);

      this.simulation
        .force('link', d3.forceLink().strength(0))
        .force('charge', d3.forceManyBody().strength(0))
        .force('collide', d3.forceCollide().radius(1).strength(0))
        .force('repelWiNodes', null);

      this.simulation.alpha(0.3).restart();
      this.simulationPaused = true;
    }
  }

  public resumeSimulation(): void {
    if (this.simulationPaused && this.originalElement) {
      this.simulationPaused = false;

      const selectedNodes = this.originalOptions?.SelectedNode ?? [];
      this.drawForceGraph(
        this.originalElement,
        this.originalNodes,
        this.originalLinks,
        {
          ...this.originalOptions,
          SelectedNode: selectedNodes, 
        }
      );
      
      this.updateNodeSelection(selectedNodes);

    }
  }

    public updateNodeSelection(selectedNodes: SelectedNode[]): void {
      const selectedIds = new Set(selectedNodes.map(n => n.id));

      this.nodeGroup?.each(function (d: any) {
        const isSelected = selectedIds.has(d.id);
        d3.select(this)
          .classed('node-lobbyist-selected', isSelected)
          .select('text')
          .text(isSelected ? (d.name?.substring(0, 4) ?? '') : d.name);
      });

      // Aggiorna anche gli stili dei link
      this.zoomGroup?.selectAll('line')
        .each(function (l: any) {
          const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
          const targetId = typeof l.target === 'object' ? l.target.id : l.target;

          const isLinkedToSelected = selectedIds.has(sourceId) || selectedIds.has(targetId);
          d3.select(this).classed('link-selected', isLinkedToSelected);
        });
    }


    public applyLassoSelection(): void {
      if (!this.selectorRect || !this.nodeGroup) return;

      const x = +this.selectorRect.attr('x');
      const y = +this.selectorRect.attr('y');
      const width = +this.selectorRect.attr('width');
      const height = +this.selectorRect.attr('height');

      const self = this;

      const selectedNodes: any[] = [];

      this.nodeGroup?.each(function (d: any) {
        const [nx, ny] = [d.x, d.y];
        if (nx >= x && nx <= x + width && ny >= y && ny <= y + height) {
          selectedNodes.push(d);
        }
      });

      const dragBehavior = d3.drag<SVGGElement, any>()
        .on('start', function (event, d) {
          if (!event.active) self.simulation!.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
          // Salva posizione iniziale per tutti i selezionati
          self.nodeGroup?.each(function (n: any) {
            const group = d3.select(this);
            if (group.classed('node-lobbyist-draggable')) {
              n.fx = n.x;
              n.fy = n.y;
              n.__initialX = n.x;
              n.__initialY = n.y;
            }
          });
        })
        .on('drag', function (event, d) {
          const dx = event.x - d.__initialX;
          const dy = event.y - d.__initialY;
          self.nodeGroup?.each(function (n: any) {
            const group = d3.select(this);
            if (group.classed('node-lobbyist-draggable')) {
              n.fx = n.__initialX + dx;
              n.fy = n.__initialY + dy;
            }
          });
        })
        .on('end', function (event, d) {
          if (!event.active) self.simulation!.alphaTarget(0);
          self.nodeGroup?.each(function (n: any) {
            const group = d3.select(this);
            if (group.classed('node-lobbyist-draggable')) {
              n.fx = null;
              n.fy = null;
              delete n.__initialX;
              delete n.__initialY;
              group.classed('node-lobbyist-draggable', false);
            }
          });
        });

      this.nodeGroup?.each(function (d: any) {
        const isSelected = selectedNodes.includes(d);
        const group = d3.select(this);
        if (isSelected) {
          group
            .classed('node-lobbyist-draggable', true)
            .call(dragBehavior);
        }
      });
    }

    public toggleLassoRect(enabled: boolean): void {
      if (enabled) {
        this.addLassoRect();
      } else {
        this.removeLassoRect();
      }
    }

    private addLassoRect(): void {
      if (!this.zoomGroup || this.selectorRect) return;

      const width = +this.svg!.attr('width');
      const height = +this.svg!.attr('height');

      this.selectorGroup = this.zoomGroup.append('g').attr('class', 'lasso-group');

      this.selectorRect = this.selectorGroup.append('rect')
        .attr('x', width / 2 - 30)
        .attr('y', height / 2 - 60)
        .attr('width', 60)
        .attr('height', 120)
        .attr('fill', 'rgba(128, 128, 128, 0.1)')   // interno grigio chiaro trasparente
        .attr('stroke', 'gray')  
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('cursor', 'move')
        .call(d3.drag<SVGRectElement, any>()
          .on('drag', (event) => {
            const rect = this.selectorRect!;
            const newX = +rect.attr('x') + event.dx;
            const newY = +rect.attr('y') + event.dy;
            rect.attr('x', newX).attr('y', newY);
            this.updateResizeHandlePosition();
          }));

      this.resizeHandle = this.selectorGroup.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('fill', '#999') 
        .attr('stroke', '#666') 
        .attr('stroke-width', 1)
        .attr('cursor', 'nwse-resize')
        .style('opacity', 0.8) 
        .call(d3.drag<SVGRectElement, unknown>()
          .on('drag', (event) => {
            const newWidth = Math.max(20, event.x - +this.selectorRect!.attr('x'));
            const newHeight = Math.max(20, event.y - +this.selectorRect!.attr('y'));
            this.selectorRect!.attr('width', newWidth).attr('height', newHeight);
            this.updateResizeHandlePosition();
          }));


      this.updateResizeHandlePosition();
    }


    private removeLassoRect(): void {
      this.selectorGroup?.remove();
      this.selectorGroup = null;
      this.selectorRect = null;
      this.resizeHandle = null;
    }

    private updateResizeHandlePosition(): void {
      if (!this.selectorRect || !this.resizeHandle) return;
      const x = +this.selectorRect.attr('x');
      const y = +this.selectorRect.attr('y');
      const width = +this.selectorRect.attr('width');
      const height = +this.selectorRect.attr('height');
      this.resizeHandle
        .attr('x', x + width - 6)
        .attr('y', y + height - 6);
    }

}