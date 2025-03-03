import { Injectable } from '@angular/core';
import * as d3 from 'd3';

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
      .attr('fill', (d, i) => (i % 2 === 0 ? '#f7f7f7' : '#eaeaea'));
  
    svg.selectAll('.month-label')
      .data(months)
      .enter()
      .append('text')
      .attr('x', d => timeScale(d) + (timeScale(new Date(d.getTime() + 2592000000)) - timeScale(d)) / 2)
      .attr('y', height + 20)
      .attr('text-anchor', 'middle')
      .text(d => d3.timeFormat('%b')(d))
      .attr('font-size', '12px')
      .attr('fill', '#666');
  
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
    meetingIds: string[],
    meetingCount: number
  ) {
    let node: any;
  
    const isDarkColor = (color: string) => {
      const rgb = d3.color(color);
      if (!rgb) return false;
      const luminance = 0.299 * rgb.rgb().r + 0.587 * rgb.rgb().g + 0.114 * rgb.rgb().b;
      return luminance < 128;
    };
  
    const textColor = isDarkColor(fill) ? 'white' : 'black';
  
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
  
    let label: any = null;
    if (meetingCount > 0) {
      label = svg.append('text')
        .attr('x', x)
        .attr('y', y + 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', textColor)
        .attr('class', `label meeting-label-${className}`)
        .text(meetingCount)
        .style('opacity', 0)
        .style('pointer-events', 'none');
    }
  
    function enlargeNode() {
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
    
      d3.select(node.node())
        .transition()
        .duration(200)
        .attr('x', x - size)
        .attr('y', y - size)
        .attr('width', size * 2)
        .attr('height', size * 2);
    
      // Rimuove eventuali label esistenti per evitare duplicati
      d3.selectAll(`.label.meeting-label-${className}`).remove();
    
      // Crea una nuova label
      svg.append('text')
        .attr('class', `label meeting-label-${className}`)
        .attr('x', x)
        .attr('y', y + 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', textColor)
        .text(meetingCount)
        .style('opacity', 1)
        .style('pointer-events', 'none');
    }    
  
    function shrinkNode() {
      d3.select(node.node())
        .transition()
        .duration(200)
        .attr('x', x - size / 2)
        .attr('y', y - size / 2)
        .attr('width', size)
        .attr('height', size)          
        .attr('stroke', '#000')
        .attr('stroke-width', 2);
  
      if (label) {
        label.transition()
          .duration(200)
          .style('opacity', 0)
          .attr('fill', textColor)
          .attr('font-size', '10px');
      }
    }

    let self = this;
  
    node.on('mouseover',function () {
      self.resetStrokes();
      enlargeNode();
    });
    node.on('mouseout',function () {
      self.resetStrokes();
      shrinkNode();
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
      .attr('stroke', '#9C9C9C')
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
      .attr('stroke', '#9C9C9C')
      .attr('stroke-width', 2);

    d3.selectAll(`.node-lobbyist`)
      .transition()
      .duration(200)
      .attr('stroke', '#5b2c55')
      .attr('stroke-width', 2);

    d3.selectAll(`.node-representative`)
      .transition()
      .duration(200)
      .attr('stroke', '#1bd41b')
      .attr('stroke-width', 2);

    d3.selectAll(`.node-directorate`)
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
  }
}