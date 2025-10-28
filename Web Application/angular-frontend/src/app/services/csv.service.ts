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

  generateMeetingCsvDataWithLobbyistData(
    meetings: any[],
    lobbyists: any[],
    allFields: { field_id: number; field_name: string }[]
  ): any[] {
    const INFINITE = 9223372036854775807;
    const lobbyistMap = new Map(lobbyists.map(l => [l.lobbyist_id, l]));

    return meetings.map(item => {
      const meeting = item.commission_meetings;
      const lobbyist = item.lobbyist_profile;
      const fullLobbyist = lobbyistMap.get(lobbyist?.lobbyist_id) || {};

      const representativesSummary = (item.participants || [])
        .map((p: {
          commission_representative?: { name?: string };
          allocation?: { role?: string };
          directorate?: { name?: string };
        }) => {
          const rep = p.commission_representative?.name?.replace(/\n/g, ' ') || '';
          const role = p.allocation?.role?.replace(/\n/g, ' ') || '';
          const dg = p.directorate?.name?.replace(/\n/g, ' ') || '';
          return [rep, role, dg].filter(Boolean).join(' - ');
        })
        .join('; ');

      let cabinetsInvolved = Array.from(
        new Set(
          (item.participants || [])
            .map((p: {
              commission_cabinet?: { name?: string };
            }) => p.commission_cabinet?.name)
            .filter(
              (name: string | undefined): name is string =>
                !!name && name.trim().toLowerCase() !== 'no cabinet'
            )
        )
      )
        .map(name => `Team member of ${name}`)
        .join('; ');

      if (
        !cabinetsInvolved &&
        (item.participants || []).some(
          (p: { directorate?: { is_commissioner?: boolean } }) =>
            p.directorate?.is_commissioner === true
        )
      ) {
        cabinetsInvolved = 'Commissioner';
      }

      const min = fullLobbyist.annual_cost_estimate_min ?? '';
      const max =
        fullLobbyist.annual_cost_estimate_max === INFINITE
          ? '∞'
          : fullLobbyist.annual_cost_estimate_max ?? '';

      const mergedData: any = {
        meeting_number: meeting?.meeting_number || '',
        meeting_date: meeting?.meeting_date || '',
        topic: meeting?.topic?.replace(/\n/g, ' ') || '',
        location: meeting?.location?.replace(/\n/g, ' ') || '',
        representatives_summary: representativesSummary,
        cabinets_involved: cabinetsInvolved || '',

        lobbyist_id: fullLobbyist.lobbyist_id || '',
        organization_name: fullLobbyist.organization_name?.replace(/\n/g, ' ') || '',
        registration_number: fullLobbyist.registration_number?.replace(/\n/g, ' ') || '',
        registration_date: fullLobbyist.registration_date?.replace(/\n/g, ' ') || '',
        last_update_date: fullLobbyist.last_update_date?.replace(/\n/g, ' ') || '',
        next_update_date: fullLobbyist.next_update_date?.replace(/\n/g, ' ') || '',
        acronym: fullLobbyist.acronym?.replace(/\n/g, ' ') || '',
        entity_form: fullLobbyist.entity_form?.replace(/\n/g, ' ') || '',
        website: fullLobbyist.website?.replace(/\n/g, ' ') || '',
        head_office_address: fullLobbyist.head_office_address?.replace(/\n/g, ' ') || '',
        head_office_phone: fullLobbyist.head_office_phone?.replace(/\n/g, ' ') || '',
        eu_office_address: fullLobbyist.eu_office_address?.replace(/\n/g, ' ') || '',
        eu_office_phone: fullLobbyist.eu_office_phone?.replace(/\n/g, ' ') || '',
        legal_representative: fullLobbyist.legal_representative?.replace(/\n/g, ' ') || '',
        legal_representative_role: fullLobbyist.legal_representative_role?.replace(/\n/g, ' ') || '',
        eu_relations_representative: fullLobbyist.eu_relations_representative?.replace(/\n/g, ' ') || '',
        eu_relations_representative_role: fullLobbyist.eu_relations_representative_role?.replace(/\n/g, ' ') || '',
        transparency_register_url: fullLobbyist.transparency_register_url?.replace(/\n/g, ' ') || '',
        country: fullLobbyist.country?.replace(/\n/g, ' ') || '',
        annual_cost_estimate_min: min,
        annual_cost_estimate_max: max,
        category_of_registration: fullLobbyist.category_of_registration?.replace(/\n/g, ' ') || ''
      };

      allFields.forEach(field => {
        mergedData[field.field_name] =
          fullLobbyist.fields_of_interest?.includes(field.field_name) ? 1 : 0;
      });

      return mergedData;
    });
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
        category_of_registration: lobbyist.category_of_registration?.replace(/\n/g, ' ') || ''
      };

      allFields.forEach(field => {
        lobbyistData[field.field_name] = lobbyist.fields_of_interest?.includes(field.field_name) ? 1 : 0;
      });

      return lobbyistData;
    });
  }


}
