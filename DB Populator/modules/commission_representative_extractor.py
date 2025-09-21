import pandas as pd
from modules.db_handler import DBHandler

class CommissionRepresentativeExtractor:
    def __init__(self, file_path, db_conn):
        self.file_path = file_path
        self.db_conn = db_conn
        self.directorate_table = 'directorate'
        self.allocation_table = 'representative_allocation'
        self.allocation_columns = ['representative_id', 'year', 'directorate_id', 'role']

    def extract(self):
        # Leggi il file Excel
        df = pd.read_excel(self.file_path, sheet_name='Foglio1')

        # Itera sulle righe del DataFrame
        for _, row in df.iterrows():
            # Combina nome e cognome
            firstName = str(row['NOME']).strip()
            lastName = str(row['COGNOME']).strip()
            name = f"{firstName} {lastName}".strip()

            representative_id = self.db_conn.get_field_id('commission_representative', 'name', name, 'id')
            if not representative_id:
                self.db_conn.insert_data('commission_representative', ['name'], [name])
                representative_id = self.db_conn.get_field_id('commission_representative', 'name', name, 'id')

            # Itera sugli anni dal 2011 al 2025
            for year in range(2011, 2026):
                directorate_col = f'DIREZIONE ANNO {year}'
                role_col = f'RUOLO ANNO {year}'
                directorate = str(row[directorate_col]).strip() if pd.notna(row[directorate_col]) else None
                role = str(row[role_col]).strip() if pd.notna(row[role_col]) else None

                # Inserisci i dati se direttorato e ruolo sono presenti
                if directorate and role:
                    # Cerca la direzione nel database
                    directorate_id = self.db_conn.get_field_id(self.directorate_table, 'name', directorate, 'id')
                    if not directorate_id:
                        self.db_conn.insert_data(self.directorate_table, ['name'], [directorate])
                        directorate_id = self.db_conn.get_field_id(self.directorate_table, 'name', directorate, 'id')

                    # Inserisci i dati nella tabella
                    values = [representative_id, year, directorate_id, role]
                    self.db_conn.insert_data(self.allocation_table, self.allocation_columns, values)
