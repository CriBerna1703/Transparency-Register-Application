from modules.utils import extract_section_data_from_element

class FieldsOfInterestExtractor:
    def __init__(self, lobbyist_id, soup, db_conn):
        self.lobbyist_id = lobbyist_id
        self.soup = soup
        self.db_conn = db_conn
        self.fields_table = 'fields_of_interest'
        self.link_table = 'lobbyist_fields_of_interest'
        self.link_columns = ['lobbyist_id', 'field_id']
        self.field_columns = ['field_name']

    def extract(self):
        section = self.soup.find('h2', id='fields-of-interest')
        if not section:
            return
        section_table = section.find_next('table')
        fields_of_interest_data = extract_section_data_from_element(section_table)
        fields_of_interest = fields_of_interest_data.get("Settori d'interesse:", [])

        if isinstance(fields_of_interest, list):
            for field in fields_of_interest:
                # Check if the field already exists in the `fields_of_interest` table
                field_id = self.db_conn.get_field_id(self.fields_table, 'field_name', field, 'field_id')
                
                if not field_id:
                    # Insert the new field and get its ID
                    self.db_conn.insert_data(self.fields_table, self.field_columns, [field])
                    field_id = self.db_conn.get_field_id(self.fields_table, 'field_name', field, 'field_id')
                
                # Create a link between the lobbyist and the field
                if field_id:
                    values = [self.lobbyist_id, field_id]
                    self.db_conn.insert_data(self.link_table, self.link_columns, values)
                else:
                    print(f"Error: Could not get field_id for field '{field}'")
        else:
            print(f"Error: fields_of_interest is not a list. Value: {fields_of_interest}")

    def truncate_table(self):
        self.db_conn.delete_table_data(self.link_table)
