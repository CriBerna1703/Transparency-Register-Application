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
            name = f"{row['NOME']} {row['COGNOME']}".strip()

            representative_id = self.db_conn.get_field_id('commission_representative', 'name', name, 'id')
            if not representative_id:
                self.db_conn.insert_data('commission_representative', ['name'], [name])
                representative_id = self.db_conn.get_field_id('commission_representative', 'name', name, 'id')

            # Itera sugli anni dal 2011 al 2024
            for year in range(2011, 2025):
                directorate_col = f'DIREZIONE ANNO {year}'
                role_col = f'RUOLO ANNO {year}'
                directorate = row[directorate_col] if pd.notna(row[directorate_col]) else None
                role = row[role_col] if pd.notna(row[role_col]) else None

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
