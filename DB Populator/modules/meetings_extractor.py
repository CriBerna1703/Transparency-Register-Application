import pdfplumber
import requests
from io import BytesIO
from modules.utils import validate_date

class MeetingExtractor:
    def __init__(self, lobbyist_id, db_conn):
        self.base_pdf_url = "https://ec.europa.eu/transparencyregister/public/meetings/"
        self.lobbyist_id = lobbyist_id
        self.db_conn = db_conn
        self.pdf_url = f"{self.base_pdf_url}{self.lobbyist_id}/pdf"
        self.meetings = []
        self.table = 'commission_meetings'
        self.columns = ['lobbyist_id', 'meeting_number', 'meeting_date', 'topic', 'representative_id', 'location']

    def download_pdf(self):
        try:
            response = requests.get(self.pdf_url)
            response.raise_for_status()  # Raise an error if the download failed
            return BytesIO(response.content)
        except requests.exceptions.RequestException as e:
            print(f"Error while downloading PDF for lobbyist {self.lobbyist_id}: {e}")
            return None
    
    def extract(self):
        pdf_file = self.download_pdf()
        if not pdf_file:
            return

        with pdfplumber.open(pdf_file) as pdf:
            current_meeting = {}  # Temporarily stores incomplete meeting data
            first_page = True  # Flag per identificare la prima pagina

            for page in pdf.pages:
                table = page.extract_table()
                if not table:
                    continue

                # Salta la prima riga della prima pagina
                if first_page:
                    table = table[1:]  # Rimuove la prima riga
                    first_page = False

                for row in table:
                    if len(row) < 4:
                        continue

                    # Estrarre dati dalle colonne
                    meeting_number = row[0].strip() if row[0] else None
                    commission_representative = row[1].strip() if row[1] else None
                    date_string = row[2].strip() if row[2] else None
                    location = row[3].strip() if row[3] else None
                    subjects = row[4].strip() if row[4] else None

                    # Se il meeting_number è presente, inizia un nuovo meeting
                    if meeting_number and meeting_number.isdigit():
                        if current_meeting:
                            # Salva il meeting corrente nel database
                            self.save_meeting_to_db(current_meeting)
                        # Inizializza un nuovo meeting
                        current_meeting = {
                            "meeting_number": meeting_number,
                            "commission_representative": commission_representative or "",
                            "meeting_date": validate_date(date_string),
                            "location": location or "",
                            "subjects": subjects or "",
                        }
                    else:
                        # Completa il meeting corrente con informazioni aggiuntive
                        if commission_representative:
                            current_meeting["commission_representative"] += commission_representative
                        if subjects:
                            current_meeting["subjects"] += subjects
                        if location:
                            current_meeting["location"] += location

            # Salva l'ultimo meeting rimasto in `current_meeting`
            if current_meeting:
                self.save_meeting_to_db(current_meeting)

        pdf_file.close()

    def save_meeting_to_db(self, meeting_data):
        """Filtra e salva i dati di un meeting nel database."""
        # Filtra il campo commission_representative per ottenere solo il primo nome e cognome
        commission_representative = meeting_data["commission_representative"]
        if "," in commission_representative:
            commission_representative = commission_representative.split(",")[0].strip()

        representative_id = self.db_conn.get_field_id('commission_representative', 'name', commission_representative, 'id')
        if not representative_id:
            self.db_conn.insert_data('commission_representative', ['name'], [commission_representative])
            representative_id = self.db_conn.get_field_id('commission_representative', 'name', commission_representative, 'id')
            
        # Prepara i valori da inserire
        values = [
            self.lobbyist_id,
            meeting_data["meeting_number"],
            meeting_data["meeting_date"],
            meeting_data["subjects"],
            representative_id,
            meeting_data["location"],
        ]
        self.db_conn.insert_data(self.table, self.columns, values)

    def truncate_table(self):
        self.db_conn.delete_table_data(self.table)