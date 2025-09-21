import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MeetingData } from '../temporal-view/temporal-view.component';
import * as d3 from 'd3';

@Injectable({
  providedIn: 'root'
})
export class MeetingManager {
  private meetingsData: MeetingData[] = [];
  private uniqueEntities: { [key: string]: Map<string, string> } = {
    lobbyist: new Map(),
    representative: new Map(),
    directorate: new Map(),
    cabinet: new Map()
  };
  public representativeAllocations: Map<string, { directorates: Map<string, { startYear: number | undefined, endYear: number | undefined, isCommissioner: boolean | undefined }>, cabinets: Map<string, { startYear: number | undefined, endYear: number | undefined }> }> = new Map();
  public directoratesWithCommissioners: Set<string> = new Set();
  public groupedDates: Map<string, boolean> = new Map();
  public lobbyistDegreeThreshold: number = 1;
  public maxVisibleLobbyistDegree: number = 10;

  prepareGroupingData(meetings: MeetingData[]) {
    const dateMap = new Map<string, number>();

    meetings.forEach(meeting => {
      const dateKey = meeting.date.toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, 0);
      }
      dateMap.set(dateKey, dateMap.get(dateKey)! + 1);
    });

    dateMap.forEach((count, dateKey) => {
      if (count > 1) {
        this.groupedDates.set(dateKey, true);
      }
    });
  }

  setMeetingsData(meetings: MeetingData[]): void {
    this.meetingsData = meetings;
    this.prepareUniqueEntities();
    this.prepareGroupingData(meetings);
  }

  getMeetingsData(): Observable<MeetingData[]> {
    return of(this.meetingsData);
  }

  private prepareUniqueEntities(): void {
    this.uniqueEntities['lobbyist'].clear();
    this.uniqueEntities['representative'].clear();
    this.uniqueEntities['directorate'].clear();
    this.uniqueEntities['cabinet'].clear();
    this.representativeAllocations.clear();

    this.meetingsData.forEach(meeting => {
      this.uniqueEntities['lobbyist'].set(meeting.lobbyist_id, meeting.lobbyist_name);

      if (Array.isArray(meeting.participants)) {
        meeting.participants.forEach(p => {
            this.uniqueEntities['representative'].set(p.representative_id, p.representative_name);
            this.uniqueEntities['directorate'].set(p.directorate_id, p.directorate_name);
            this.uniqueEntities['cabinet'].set(p.cabinet_id, p.cabinet_name);

            if (!this.representativeAllocations.has(p.representative_id)) {
            this.representativeAllocations.set(p.representative_id, {
                directorates: new Map(),
                cabinets: new Map()
            });
            }

            const repData = this.representativeAllocations.get(p.representative_id)!;

            if (p.directorate_name && p.directorate_name !== '?') {
                if (!repData.directorates.has(p.directorate_name)) {
                    repData.directorates.set(p.directorate_name, { startYear: p.directorate_start_year, endYear: p.directorate_end_year, isCommissioner: p.is_commissioner });
                }
                if (p.is_commissioner) {
                    this.directoratesWithCommissioners.add(p.directorate_id);
                }
            }

            if (p.cabinet_name && p.cabinet_name !== '?') {
                if (!repData.cabinets.has(p.cabinet_name)) {
                    repData.cabinets.set(p.cabinet_name, { startYear: p.cabinet_start_year, endYear: p.cabinet_end_year });
                }
            }
        });
      }
    });
  }

  getUniqueEntities(entityType: 'lobbyist' | 'representative' | 'directorate' | 'cabinet'): Map<string, string> {
    return this.uniqueEntities[entityType];
  }

  getEntityName(id: string, type: 'lobbyist' | 'representative' | 'directorate' | 'cabinet'): string {
    return this.uniqueEntities[type].get(id) || '';
  }

  getFilteredMeetingsByInterval(startDate: Date, endDate: Date): MeetingData[] {
    const lobbyistMeetingCount = new Map<string, number>();
    this.meetingsData.forEach(meeting => {
        if (meeting.date >= startDate && meeting.date <= endDate) {
            lobbyistMeetingCount.set(meeting.lobbyist_id, (lobbyistMeetingCount.get(meeting.lobbyist_id) || 0) + 1);
        }
    });

    this.maxVisibleLobbyistDegree = Math.max(...Array.from(lobbyistMeetingCount.values()), 1);

    return this.meetingsData.filter(meeting => 
        meeting.date >= startDate && 
        meeting.date <= endDate &&
        lobbyistMeetingCount.get(meeting.lobbyist_id)! >= this.lobbyistDegreeThreshold
    );
  }

  getAllocationsInRange(repId: string, fromYear: number, toYear: number) {
    const allocations = this.representativeAllocations.get(repId);
    if (!allocations) return { directorates: [], cabinets: [] };

    const filterByRange = (item: { startYear?: number; endYear?: number }) => {
        const startOk = !item.endYear || item.endYear >= fromYear;
        const endOk   = !item.startYear || item.startYear <= toYear;
        return startOk && endOk;
    };

    return {
        directorates: Array.from(allocations.directorates.entries())
        .map(([name, d]) => ({ name, ...d }))
        .filter(filterByRange),
        cabinets: Array.from(allocations.cabinets.entries())
        .map(([name, c]) => ({ name, ...c }))
        .filter(filterByRange)
    };
  }



  computeOptimizedNodePositions(
    entityType: 'lobbyist' | 'representative' | 'directorate' | 'cabinet',
    width: number,
    startDate: Date,
    endDate: Date,
    displayStartDate: Date,
    displayEndDate: Date
  ): Map<string, number> {
      const timeScale = d3.scaleTime()
          .domain([displayStartDate, displayEndDate])
          .range([50, width - 50]);

      let filteredMeetings = this.getFilteredMeetingsByInterval(startDate, endDate);

      if (entityType === "lobbyist") {
          filteredMeetings = this.replaceLobbistsWithGroups(filteredMeetings);
      }

      const entityMeetings = new Map<string, { positions: number[], type: 'lobbyist' | 'representative' | 'directorate' | 'cabinet' | 'dummy' }>();

      filteredMeetings.forEach(meeting => {
          if (entityType === 'lobbyist') {
              const id = meeting.lobbyist_id;
              if (!entityMeetings.has(id)) entityMeetings.set(id, { positions: [], type: 'lobbyist' });
              entityMeetings.get(id)!.positions.push(timeScale(meeting.date));

          } else if (entityType === 'representative') {
              meeting.participants.forEach(part => {
                  const id = part.representative_id;
                  if (!entityMeetings.has(id)) entityMeetings.set(id, { positions: [], type: 'representative' });
                  entityMeetings.get(id)!.positions.push(timeScale(meeting.date));
              });

          } else if (entityType === 'directorate' || entityType === 'cabinet') {
              meeting.participants.forEach(part => {
                  if (part.directorate_id) {
                      if (!entityMeetings.has(part.directorate_id) || entityMeetings.get(part.directorate_id)!.type !== 'directorate') {
                          entityMeetings.set(part.directorate_id, { positions: [], type: 'directorate' });
                      }
                      entityMeetings.get(part.directorate_id)!.positions.push(timeScale(meeting.date));
                  }
                  if (part.cabinet_id) {
                      if (!entityMeetings.has(part.cabinet_id) || entityMeetings.get(part.cabinet_id)!.type !== 'cabinet') {
                          entityMeetings.set(part.cabinet_id, { positions: [], type: 'cabinet' });
                      }
                      entityMeetings.get(part.cabinet_id)!.positions.push(timeScale(meeting.date));
                  }
                  if(!part.directorate_id && !part.cabinet_id) {
                      const id = 'DUMMY-ID';
                      if (!entityMeetings.has(id)) entityMeetings.set(id, { positions: [], type: 'cabinet' });
                      entityMeetings.get(id)!.positions.push(timeScale(meeting.date));
                  }
              });
          }
      });

      const sortedEntities = Array.from(entityMeetings.entries())
          .map(([id, data]) => ({
              id,
              type: data.type,
              centroid: data.positions.reduce((a, b) => a + b, 0) / data.positions.length
          }))
          .sort((a, b) => a.centroid - b.centroid);

      const finalPositions = new Map<string, number>();
      let previousX = 0;
      const minSpacing = 20;
      const maxX = width - 10;

      sortedEntities.forEach(({ id, centroid }) => {
          const optimalX = Math.max(centroid, previousX + minSpacing);
          finalPositions.set(id, optimalX);
          previousX = optimalX;
      });

      const shifted = this.shiftNodes(finalPositions, maxX);

      const filteredFinal = new Map<string, number>();
      sortedEntities.forEach(({ id, type }) => {
          if ((type === entityType && shifted.has(id))) {
              filteredFinal.set(id, shifted.get(id)!);
          }
      });

      return filteredFinal;
  }

  shiftNodes(map: Map<string, number>, maxValue: number): Map<string, number> {
    const entries = [...map.entries()].sort((a, b) => a[1] - b[1]);
    const values = entries.map(entry => entry[1]);

    if (values[values.length - 1] > maxValue) {
        values[values.length - 1] = maxValue; 
    }

    for (let i = values.length - 2; i >= 0; i--) {
        if (values[i] > values[i + 1] - 20) {
            values[i] = values[i + 1] - 20;
        } else {
            break; 
        }
    }

    const newMap = new Map<string, number>();
    entries.forEach(([key], index) => {
        newMap.set(key, values[index]);
    });

    return newMap;
  }

  private replaceLobbistsWithGroups(meetings: MeetingData[]): MeetingData[] {
    const groupedMeetings = new Map<string, MeetingData>();
    const lobbyistMeetingCount = new Map<string, number>();
    const dateGroups = new Map<string, Set<string>>();     

    meetings.forEach(meeting => {
        const { lobbyist_id } = meeting;
        lobbyistMeetingCount.set(lobbyist_id, (lobbyistMeetingCount.get(lobbyist_id) || 0) + 1);
    });

    meetings.forEach(meeting => {
        const { lobbyist_id, date } = meeting;
        const dateKey = date.toISOString().split("T")[0];

        if (this.groupedDates.get(dateKey) === true) {
            if (lobbyistMeetingCount.get(lobbyist_id) === 1) {
                if (!dateGroups.has(dateKey)) {
                    dateGroups.set(dateKey, new Set());
                }
                dateGroups.get(dateKey)!.add(lobbyist_id);
            }
        }
    });

    const validGroups = new Map<string, Set<string>>();
    dateGroups.forEach((lobbyists, dateKey) => {
        if (lobbyists.size > 1) {
            validGroups.set(dateKey, lobbyists);
        }
    });
    return meetings.map(meeting => {
        const dateKey = meeting.date.toISOString().split("T")[0];

        if (validGroups.has(dateKey) && validGroups.get(dateKey)!.has(meeting.lobbyist_id)) {
            if (!groupedMeetings.has(dateKey)) {
                groupedMeetings.set(dateKey, {
                    ...meeting,
                    lobbyist_id: `grouped-${dateKey}`,
                    lobbyist_name: `Gruppo Lobbisti ${dateKey}`
                });
            }
            return groupedMeetings.get(dateKey)!;
        }

        return meeting;
    });
  }
  
}