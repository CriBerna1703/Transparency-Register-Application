from modules.utils import extract_section_data_from_element

class ProposalsExtractor:
    def __init__(self, lobbyist_id, soup, db_conn):
        self.lobbyist_id = lobbyist_id
        self.soup = soup
        self.db_conn = db_conn
        self.proposals_table = 'proposals'
        self.link_table = 'lobbyist_proposals'
        self.proposal_columns = ['proposal_description']
        self.link_columns = ['lobbyist_id', 'proposal_id']

    def extract(self):
        section = self.soup.find('h2', id='specific-activities-covered-by-the-register')
        if not section:
            return
        section_table = section.find_next('table')
        legislative_proposal_data = extract_section_data_from_element(section_table)
        
        proposals = legislative_proposal_data.get("Principali proposte legislative o politiche dell'UE interessate:", "")
        cleaned_proposals = [
            proposal.replace(";", "").replace(".", "").strip()
            for proposal in proposals.split("\n") if proposal.strip()
        ]

        for proposal in cleaned_proposals:
            proposal_id = self.db_conn.get_field_id(self.proposals_table, 'proposal_description', proposal, 'proposal_id')

            if not proposal_id:
                # Insert the new proposal and get its ID
                self.db_conn.insert_data(self.proposals_table, self.proposal_columns, [proposal])
                proposal_id = self.db_conn.get_field_id(self.proposals_table, 'proposal_description', proposal, 'proposal_id')

            # Create a link between the lobbyist and the proposal
            if proposal_id:
                values = [self.lobbyist_id, proposal_id]
                self.db_conn.insert_data(self.link_table, self.link_columns, values)
            else:
                print(f"Error: Could not get proposal_id for proposal '{proposal}'")

    def truncate_table(self):
        self.db_conn.delete_table_data(self.link_table)
