import pandas as pd
import csv
from sqlalchemy import create_engine
from config import DB_CONFIG

class ExportCSV:
    def __init__(self):
        self.engine = create_engine(
            f"mysql+mysqlconnector://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}/{DB_CONFIG['database']}"
        )

    def clean_text(self, text):
        if isinstance(text, str):
            return text.replace("\n", " ").replace("\r", " ").strip()
        return text

    def export_meeting_centric_csv(self, output_file, separator="$"):
        query = """
        SELECT cm.meeting_number, cm.meeting_date, cm.topic, cm.location, 
            lp.organization_name AS lobbyist_name, 
            cr.name AS representative_name, 
            d.name AS directorate_name,
            ra.role
        FROM commission_meetings cm
        JOIN lobbyist_profile lp ON cm.lobbyist_id = lp.lobbyist_id
        LEFT JOIN commission_representative cr ON cm.representative_id = cr.id
        LEFT JOIN representative_allocation ra 
            ON cr.id = ra.representative_id AND YEAR(cm.meeting_date) = ra.year
        LEFT JOIN directorate d ON ra.directorate_id = d.id
        """
        df = pd.read_sql_query(query, self.engine)
        df = df.applymap(self.clean_text)
        df.to_csv(output_file, index=False, sep=separator, quoting=csv.QUOTE_NONE)

    def export_lobbyist_centric_csv(self, output_file, separator="$"):
        lobbyist_query = """
        SELECT lobbyist_id, organization_name, registration_number, registration_status, 
               registration_date, last_update_date, next_update_date, acronym, entity_form, 
               website, head_office_address, head_office_phone, eu_office_address, 
               eu_office_phone, legal_representative, legal_representative_role, 
               eu_relations_representative, eu_relations_representative_role, 
               transparency_register_url, country
        FROM lobbyist_profile
        """
        lobbyist_df = pd.read_sql_query(lobbyist_query, self.engine)

        fields_query = "SELECT field_id, field_name FROM fields_of_interest"
        fields_df = pd.read_sql_query(fields_query, self.engine)

        lobbyist_fields_query = """
        SELECT lfi.lobbyist_id, fi.field_id
        FROM lobbyist_fields_of_interest lfi
        JOIN fields_of_interest fi ON lfi.field_id = fi.field_id
        """
        lobbyist_fields_df = pd.read_sql_query(lobbyist_fields_query, self.engine)

        # Pivot to get a matrix of lobbyists vs fields of interest
        pivot_df = lobbyist_fields_df.pivot_table(index='lobbyist_id', columns='field_id', aggfunc=lambda x: 1, fill_value=0)
        pivot_df.columns = [fields_df.loc[fields_df['field_id'] == col, 'field_name'].values[0] for col in pivot_df.columns]

        # Merge with lobbyist details
        final_df = lobbyist_df.merge(pivot_df, on='lobbyist_id', how='left').fillna(0)
        final_df = final_df.applymap(self.clean_text)
        final_df.to_csv(output_file, index=False, sep=separator, quoting=csv.QUOTE_NONE)

exportCSV = ExportCSV()
exportCSV.export_meeting_centric_csv("meeting_centric.csv")
exportCSV.export_lobbyist_centric_csv("lobbyist_centric.csv")
