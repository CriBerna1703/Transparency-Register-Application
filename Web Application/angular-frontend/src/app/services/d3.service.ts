import { Injectable } from '@angular/core';
import * as d3 from 'd3';

export interface ForceGraphOptions {
  width?: number;
  height?: number;
  zoomLevel?: number;
  onNodeClick?: (d: any) => void;
  minSim?: number; 
  maxSim?: number;
  onRightClick?: (node: any) => void;
  onLinkRightClick?: (link: any) => void;
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
  private chargeForce: d3.ForceManyBody<any> | null = null;
  
  drawForceGraph(
    element: HTMLElement,
    nodes: any[],
    links: any[],
    options?: ForceGraphOptions & { selectedNodes?: Set<string> }
  ): void {
    const width = options?.width ?? 1000;
    const height = options?.height ?? 600;
    const initialZoom = (options?.zoomLevel ?? 100) / 100;
    const minSim = options?.minSim ?? 0.1;
    const maxSim = options?.maxSim ?? 1.0;


    const degreeMap = new Map<string, number>();

    // Conta le connessioni per ogni nodo
    links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      degreeMap.set(sourceId, (degreeMap.get(sourceId) || 0) + 1);
      degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
    });

    // Assegna il grado a ciascun nodo
    nodes.forEach(node => {
      node.degree = degreeMap.get(node.id) || 0;
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
        if (this.zoomGroup) {
          this.zoomGroup.attr('transform', event.transform);
        }
  
      });
  
    this.svg.call(this.zoomBehavior as any);
  
    // Forza di repulsione dinamica
    this.chargeForce = d3.forceManyBody()
      .strength((d: any) => d.degree === 0 ? -300 : -150);

    // Posizionamento isolati su una circonferenza
    const isolatedNodes = nodes.filter(n => n.degree === 0);
    const totalIsolated = isolatedNodes.length;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) + 100;

    isolatedNodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / totalIsolated;
      node.targetX = centerX + radius * Math.cos(angle);
      node.targetY = centerY + radius * Math.sin(angle);
    });

    this.simulation = d3.forceSimulation(nodes)
      .alpha(1) // energia iniziale
      .alphaDecay(0.03) // rallenta progressivamente
      .alphaMin(0.001)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance((d: any) => Math.max(100, 300 - (d.similarity ?? 0) * 200))
      )
      .force('charge', this.chargeForce)
      .force('center', d3.forceCenter(centerX, centerY))
      .force('isolateX', d3.forceX((d: any) =>
        d.degree === 0 ? d.targetX : centerX
      ).strength((d: any) => d.degree === 0 ? 0.2 : 0))
      .force('isolateY', d3.forceY((d: any) =>
        d.degree === 0 ? d.targetY : centerY
      ).strength((d: any) => d.degree === 0 ? 0.2 : 0))
      .force('x', d3.forceX(centerX).strength(0.02))
      .force('y', d3.forceY(centerY).strength(0.02))
      .force('collide', d3.forceCollide((d: any) => d.degree === 0 ? 30 : 60).strength(1));

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
        d.fx = null;
        d.fy = null;
      });
        
    const link = this.zoomGroup.append('g')
      .selectAll('line')
      .data(links.filter((d: any) => !d.__invisible))
      .enter()
      .append('line')
      .attr('stroke-width', 5)
      .attr('stroke', (d: any) => this.getLinkColor(d.similarity));

    link.on('click', (event, d) => {
        event.preventDefault();
        event.stopPropagation();
        options?.onLinkRightClick?.(d);
      });
      
    this.nodeGroup = this.zoomGroup.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(drag);
  
    this.nodeGroup.append('circle')
      .attr('r', 7)
      .attr('fill', '#ae58a3')
      .attr('stroke', '#5b2c55')
      .attr('stroke-width', 2)
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
        updateStyles();
      })
      .on('mouseover', function (event, d) {
        if (options?.selectedNodes?.has(d.id)) return; 
        d3.select(this).select('circle').attr('stroke', '#ff7f0e');
        d3.select(this).select('text').style('display', 'block');
      })
      .on('mouseout', function (event, d) {
        const isSelected = options?.selectedNodes?.has(d.id);
        d3.select(this).select('circle')
          .attr('stroke', isSelected ? '#ff7f0e' : '#5b2c55');
        d3.select(this).select('text')
          .style('display', isSelected ? 'block' : 'none');
      })
      .on('contextmenu', function (event, d) {
        event.preventDefault();
        event.stopPropagation();
        options?.onRightClick?.(d);
      });
  
    const updateStyles = () => {
      this.nodeGroup?.select('circle')
        .attr('stroke', (d: any) =>
          options?.selectedNodes?.has(d.id) ? '#ff7f0e' : '#5b2c55');
  
      this.nodeGroup?.select('text')
        .style('display', (d: any) =>
          options?.selectedNodes?.has(d.id) ? 'block' : 'none');
  
      link.attr('stroke', (d: any) => {
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;
        return options?.selectedNodes?.has(sourceId) || options?.selectedNodes?.has(targetId)
          ? '#ff7f0e'
          : this.getLinkColor(d.similarity);;
      });
    };
  
    this.simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      this.nodeGroup?.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  
    if (previousZoomTransform) {
      this.svg!.call(this.zoomBehavior!.transform as any, previousZoomTransform);
    } else {
      this.svg!.call(this.zoomBehavior!.transform as any, d3.zoomIdentity.scale(initialZoom));
    }
  
    updateStyles();
  }
  
  private labelFontSize: number = 12;
  
  public setLabelFontSize(size: number): void {
    this.labelFontSize = size;
    this.nodeGroup?.select('text')
      .style('font-size', `${this.labelFontSize}px`);
  }
  
  public updateForceGraphStyles(selectedNodes: Set<string>, selectedLink?: { source: string; target: string }): void {
    if (!this.nodeGroup || !this.zoomGroup) return;
  

    this.nodeGroup.select('circle')
      .attr('stroke', (d: any) => selectedNodes.has(d.id) ? '#ff7f0e' : '#5b2c55');
  
    this.nodeGroup.selectAll('text')
      .style('display', (d: any) => selectedNodes.has(d.id) ? 'block' : 'none');
  
    this.zoomGroup.selectAll('line')
      .attr('stroke', (d: any) => {
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;
        const isSelectedNode = selectedNodes.has(sourceId) || selectedNodes.has(targetId);
        const isSelectedLink = selectedLink &&
          ((selectedLink.source === sourceId && selectedLink.target === targetId) ||
           (selectedLink.source === targetId && selectedLink.target === sourceId));


          if (isSelectedLink) return 'red';
          return isSelectedNode ? '#ff7f0e' : this.getLinkColor(d.similarity);
        });
  }

  private getLinkColor(sim: number): string {
    const shades = [
      '#d7f9e5', // 0.00–0.20
      '#94e8b1', // 0.20–0.40
      '#4ac873', // 0.40–0.60
      '#23974b', // 0.60–0.80
      '#085c28'  // 0.80–1.00
    ];

    if (sim < 0.20) return shades[0];
    if (sim < 0.40) return shades[1];
    if (sim < 0.60) return shades[2];
    if (sim < 0.80) return shades[3];
    return shades[4];
  }

  public updateChargeStrength(strength: number): void {
    if (this.chargeForce && this.simulation) {
      this.chargeForce.strength(strength);
      this.simulation.alpha(1).restart();
    }
  } 
}



