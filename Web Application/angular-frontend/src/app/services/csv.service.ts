import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CsvService {

  constructor() {}

  downloadCSV(data: any[], filename: string, separator: string = '$') {
    if (!data || data.length === 0) {
      console.warn('No data available for download.');
      return;
    }

    const headers = Object.keys(data[0]).join(separator);

    const csvRows = data.map(row => {
      return Object.values(row)
        .map(value => `"${(value ?? '').toString().replace(/"/g, '""')}"`)
        .join(separator);
    });

    const csvString = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  generateMeetingCsvData(jsonData: any[]): any[] {
    return jsonData.map(item => {
      const repAlloc = item.CommissionRepresentative?.RepresentativeAllocations?.[0] || {};
      return {
        meeting_number: item.meeting_number,
        meeting_date: item.meeting_date,
        topic: item.topic?.replace(/\n/g, ' '),
        location: item.location?.replace(/\n/g, ' '),
        lobbyist_name: item.Lobbyist?.organization_name?.replace(/\n/g, ' ') || '',
        representative_name: item.CommissionRepresentative?.name?.replace(/\n/g, ' ') || '',
        directorate_name: repAlloc.Directorate?.name?.replace(/\n/g, ' ') || '',
        role: repAlloc.role?.replace(/\n/g, ' ') || ''
      };
    });
  }

  generateLobbyistCsvData(jsonData: any[], allFields: { field_id: number; field_name: string }[]): any[] {
    const lobbyistMap = new Map<string, any>();

    jsonData.forEach(item => {
      const lobbyist = item.Lobbyist;
      if (!lobbyist || lobbyistMap.has(lobbyist.lobbyist_id)) return;

      const lobbyistData: { [key: string]: any } = {
        lobbyist_id: lobbyist.lobbyist_id || '',
        organization_name: lobbyist.organization_name?.replace(/\n/g, ' ') || '',
        registration_number: lobbyist.registration_number?.replace(/\n/g, ' ') || '',
        registration_date: lobbyist.registration_date?.replace(/\n/g, ' ') || '',
        last_update_date: lobbyist.last_update_date?.replace(/\n/g, ' ') || '',
        next_update_date: lobbyist.next_update_date?.replace(/\n/g, ' ') || '',
        acronym: lobbyist.acronym?.replace(/\n/g, ' ') || '',
        entity_form: lobbyist.entity_form?.replace(/\n/g, ' ') || '',
        website: lobbyist.website?.replace(/\n/g, ' ') || '',
        head_office_address: lobbyist.head_office_address?.replace(/\n/g, ' ') || '',
        head_office_phone: lobbyist.head_office_phone?.replace(/\n/g, ' ') || '',
        eu_office_address: lobbyist.eu_office_address?.replace(/\n/g, ' ') || '',
        eu_office_phone: lobbyist.eu_office_phone?.replace(/\n/g, ' ') || '',
        legal_representative: lobbyist.legal_representative?.replace(/\n/g, ' ') || '',
        legal_representative_role: lobbyist.legal_representative_role?.replace(/\n/g, ' ') || '',
        eu_relations_representative: lobbyist.eu_relations_representative?.replace(/\n/g, ' ') || '',
        eu_relations_representative_role: lobbyist.eu_relations_representative_role?.replace(/\n/g, ' ') || '',
        transparency_register_url: lobbyist.transparency_register_url?.replace(/\n/g, ' ') || '',
        country: lobbyist.country?.replace(/\n/g, ' ') || ''
      };

      allFields.forEach(field => {
        lobbyistData[field.field_name] = 0;
      });

      if (lobbyist.Fields) {
        lobbyist.Fields.forEach((field: { field_name: string }) => {
          if (field.field_name in lobbyistData) {
            lobbyistData[field.field_name] = 1;
          }
        });
      }

      lobbyistMap.set(lobbyist.lobbyist_id, lobbyistData);
    });

    return Array.from(lobbyistMap.values());
  }

  
}
