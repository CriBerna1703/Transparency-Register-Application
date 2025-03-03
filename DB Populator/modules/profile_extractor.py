import yaml
from modules.utils import validate_date, extract_section_data_from_element

class ProfileDataExtractor:
    def __init__(self, lobbyist_id, soup, db_conn, country_file):
        self.lobbyist_id = lobbyist_id
        self.url = f"https://ec.europa.eu/transparencyregister/public/PUBLIC/ORGANISATION/{lobbyist_id}?lang=it"
        self.search_url = f"https://transparency-register.europa.eu/searchregister-or-update/organisation-detail_it?id={lobbyist_id}"
        self.soup = soup
        self.db_conn = db_conn
        self.table = 'lobbyist_profile'
        self.columns = [
            'registration_number', 'registration_status', 'registration_date',
            'last_update_date', 'next_update_date', 'acronym', 'entity_form', 'website',
            'head_office_address', 'head_office_phone', 'eu_office_address', 'eu_office_phone', 'legal_representative', 'legal_representative_role',
            'eu_relations_representative', 'eu_relations_representative_role', 'transparency_register_url', 'country'
        ]
        self.country_names = self.load_country_names(country_file)

    def load_country_names(self, file_path):
        with open(file_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)

    def extract_country(self, address):
        if not address:
            return None
        
        normalized_address = address.lower()
        for country, aliases in self.country_names.items():
            for alias in aliases:
                if alias in normalized_address:
                    return country
        return None

    
    def extract(self):
        profile_data = {}
        sections = [
            'profile-of-registrant',
            'applicantregistrant-organisation-or-self-employed-individuals',
            'contact-details',
            'person-with-legal-responsibility',
            'person-in-charge-of-eu-relations'
        ]

        for section_id in sections:
            section = self.soup.find('h2', id=section_id)
            if not section:
                continue
            section_table = section.find_next('table')
            section_data = extract_section_data_from_element(section_table)
            
            if section_id == 'person-with-legal-responsibility':
                profile_data['legal_representative'] = section_data.get("Responsabile legale dell'organizzazione:", '')
                profile_data['legal_representative_role'] = section_data.get('Ruolo:', '')
            elif section_id == 'person-in-charge-of-eu-relations':
                profile_data['eu_relations_representative'] = section_data.get("Responsabile delle relazioni con l'UE:", '')
                profile_data['legal_representative_role'] = section_data.get('Ruolo:', '')
            else:
                profile_data.update(section_data)
        
        registration_number = profile_data.get('Numero di registrazione:', '')
        registration_status = profile_data.get('Stato:', '')
        
        registration_date = validate_date(profile_data.get('Data di registrazione:', ''))
        last_update_date = validate_date(profile_data.get('Data dell\'ultimo aggiornamento (parziale o annuale) effettuato dalla persona registrata:', ''))
        next_update_date = validate_date(profile_data.get('Data prevista per il prossimo aggiornamento annuale:', ''))

        acronym = profile_data.get('Acronimo:', '')
        entity_form = profile_data.get("Forma dell'entità:", '')
        website = profile_data.get('Sito web:', '')

        head_office_address = profile_data.get('Recapiti della sede centrale della tua organizzazione:', {}).get('Indirizzo:', '')
        head_office_phone = profile_data.get('Recapiti della sede centrale della tua organizzazione:', {}).get('Telefono:', '')
        country = self.extract_country(head_office_address)

        eu_office_address = profile_data.get("Recapiti dell'ufficio della tua organizzazione incaricato dei rapporti con l'UE:", {}).get('Indirizzo:', '')
        eu_office_phone = profile_data.get("Recapiti dell'ufficio della tua organizzazione incaricato dei rapporti con l'UE:", {}).get('Telefono:', '')

        legal_representative = profile_data.get('legal_representative', '')
        legal_representative_role = profile_data.get('legal_representative_role', '')

        eu_relations_representative = profile_data.get('eu_relations_representative', '')
        eu_relations_representative_role = profile_data.get('legal_representative_role', '')

        values = [
            registration_number, registration_status, registration_date,
            last_update_date, next_update_date, acronym, entity_form, website,
            head_office_address, head_office_phone, eu_office_address, eu_office_phone, legal_representative, legal_representative_role,
            eu_relations_representative, eu_relations_representative_role, self.search_url, country
        ]
        self.db_conn.update_data(self.table, self.columns, values, self.lobbyist_id)
    
    def truncate_table(self):
        self.db_conn.delete_table_data(self.table)
