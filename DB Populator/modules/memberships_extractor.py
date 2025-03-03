from modules.utils import extract_section_data_from_element

class MembershipExtractor:
    def __init__(self, lobbyist_id, soup, db_conn):
        self.lobbyist_id = lobbyist_id
        self.soup = soup
        self.db_conn = db_conn
        self.memberships_table = 'memberships'
        self.link_table = 'lobbyist_memberships'
        self.membership_columns = ['membership_name', 'membership_lobbyist_id']
        self.link_columns = ['lobbyist_id', 'membership_id']
    
    def extract(self):
        section = self.soup.find('h2', id='membership-and-affiliation')
        if not section:
            return
        section_table = section.find_next('table')
        membership_data = extract_section_data_from_element(section_table)
        
        memberships = membership_data.get("Elenco delle adesioni ad associazioni, (con)federazioni, reti e altri organismi:", "")
        memberships_list = memberships.split("\n")
        
        for membership in memberships_list[1:]:
            membership_name = membership.strip("- ").strip()

            membership_id = self.db_conn.get_field_id(self.memberships_table, 'membership_name', membership_name, 'membership_id')
            
            if not membership_id:
                membership_lobbyist_id = self.db_conn.get_field_id('lobbyist_profile', 'organization_name', membership_name, 'lobbyist_id')

                self.db_conn.insert_data(self.memberships_table, self.membership_columns, [membership_name, membership_lobbyist_id])
                membership_id = self.db_conn.get_field_id(self.memberships_table, 'membership_name', membership_name, 'membership_id')
            
            if membership_id:
                values = [self.lobbyist_id, membership_id]
                self.db_conn.insert_data(self.link_table, self.link_columns, values)
            else:
                print(f"Error: Could not determine membership_id for '{membership_name}'")
    
    def truncate_table(self):
        self.db_conn.delete_table_data(self.table)
