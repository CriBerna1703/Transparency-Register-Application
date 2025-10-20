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

    const csvString = '\uFEFF' + [headers, ...csvRows].join('\n');
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
    const csvData: any[] = [];

    jsonData.forEach(item => {
      const meeting = item.commission_meetings;
      const lobbyist = item.lobbyist_profile;
      const firstParticipant = item.participants?.[0] || {};
      const representative = firstParticipant.commission_representative || {};
      const directorate = firstParticipant.directorate || {};
      const allocation = firstParticipant.allocation || {};

      csvData.push({
        meeting_number: meeting?.meeting_number || '',
        meeting_date: meeting?.meeting_date || '',
        topic: meeting?.topic?.replace(/\n/g, ' ') || '',
        location: meeting?.location?.replace(/\n/g, ' ') || '',
        lobbyist_id: lobbyist?.lobbyist_id || '',
        lobbyist_name: lobbyist?.organization_name?.replace(/\n/g, ' ') || '',
        representative_name: representative?.name?.replace(/\n/g, ' ') || '',
        directorate_name: directorate?.name?.replace(/\n/g, ' ') || '',
        role: allocation?.role?.replace(/\n/g, ' ') || ''
      });
    });

    return csvData;
  }


  generateLobbyistCsvData(lobbyists: any[], allFields: { field_id: number; field_name: string }[]): any[] {
    const INFINITE = 9223372036854775807;

    return lobbyists.map(lobbyist => {
      const min = lobbyist.annual_cost_estimate_min ?? '';
      const max = lobbyist.annual_cost_estimate_max === INFINITE
        ? '∞'
        : lobbyist.annual_cost_estimate_max ?? '';

      const lobbyistData: any = {
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
        country: lobbyist.country?.replace(/\n/g, ' ') || '',
        annual_cost_estimate_min: min,
        annual_cost_estimate_max: max,
      };

      allFields.forEach(field => {
        lobbyistData[field.field_name] = lobbyist.fields_of_interest?.includes(field.field_name) ? 1 : 0;
      });

      return lobbyistData;
    });
  }


}
