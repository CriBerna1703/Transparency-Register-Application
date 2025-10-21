import pdfplumber
import re
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
        self.columns = ['lobbyist_id', 'meeting_number', 'meeting_date', 'topic', 'location']
        self.known_titles = ['Principal Legal Adviser', 'Director of Office', 'Head of JRC Department','High Representative of the Union for Foreign Affairs and Security Policy and Vice-President', 'Commissioner', 'High Representative / Vice-President', 'Acting Head of Representation', 'Acting Deputy Director-General',
                            'Head of Representation', 'Deputy Secretary-General', 'Secretary-General', 'Executive Vice-President', 'First Vice-President',
                            'Hors Classe Adviser', 'Vice-President', 'President', 'Acting Director-General', 'Director-General', 'High Representative',
                            'Deputy Director-General', 'Acting Director', 'Director', 'Acting Head of Unit', 'Seconded Head of Unit', 'Head of Unit (Ad interim)', 'Head of Unit', 'Regulatory Scrutiny Board', 'Acting Principal Adviser', 'Principal Adviser', 'Chief Economist']
        self.department_titles = ['Agriculture and Rural Development', 'Budget', 'Climate Action', 'Communications Networks, Content and Technology',
                             'Communication Networks, Content and Technology', 'Communication', 'Competition', 'Data Protection Officer', 'Directorate-General for International Partnerships',
                             'Directorate- General for International Partnerships', 'Defence Industry and Space', 'Digital Services', 'Economic and Financial Affairs',
                             'Education, Youth, Sport and Culture', 'Employment, Social Affairs and Inclusion', 'Energy',
                             'Enlargement and Eastern Neighbourhood', 'Environment', 'European Anti-Fraud Office', 'European Civil Protection and Humanitarian Aid Operations',
                             'European Climate, Infrastructure and Environment Executive Agency', 'European Commission (EC) Library',
                             'European Education and Culture Executive Agency', 'European Health and Digital Executive Agency',
                             'European Innovation Council and Small and Medium-sized Enterprises Executive Agency', 
                             'European Neighbourhood and Enlargement Negotiations', 'European Personnel Selection Office',
                             'European Research Council Executive Agency (ERCEA)', 'European Research Executive Agency',
                             'European School of Administration', 'Eurostat - European statistics',
                             'Financial Stability, Financial Services and Capital Markets Union',
                             'Foreign Policy Instruments', 'Health and Food Safety', 'Health Emergency Preparedness and Response Authority',
                             'Historical Archives Service', 'Human Resources and Security', 'Infrastructure and Logistics in Brussels',
                             'Infrastructure and Logistics in Luxembourg', 'Inspire, Debate, Engage and Accelerate Action', 'Internal Audit Service',
                             'Internal Market, Industry, Entrepreneurship and SMEs', 'International Partnerships', 'Interpretation',
                             'Joint Research Centre', 'Justice and Consumers', 'Legal Service', 'Maritime Affairs and Fisheries',
                             'Middle East, North Africa and the Gulf', 'Migration and Home Affairs', 'Mobility and Transport',
                             'Office for the Administration and Payment of Individual Entitlements', 'Publications Office',
                             'Recovery and Resilience Task Force', 'Reform and Investment Task Force', 'Regional and Urban Policy',
                             'Research and Innovation', 'Secretariat-General', 'Structural Reform Support', 'Taxation and Customs Union',
                             'Trade and Economic Security', 'Translation', 'Trade']

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

                    structured_table = page.find_tables()[0]
                    column_table = structured_table.columns[1]
                    if(page.page_number == 1):
                        row_table = structured_table.rows[table.index(row)+1]
                    else:
                        row_table = structured_table.rows[table.index(row)]
                    bbox = {
                        "0": column_table.bbox[0],
                        "1": row_table.bbox[1],
                        "2": column_table.bbox[2],
                        "3": row_table.bbox[3],
                    }
                    commission_representative, first_word_top, last_word_bottom = self.get_cell_text_with_manual_breaks(page, bbox)
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
                            "last_word_bottom": last_word_bottom  # salvo anche qui
                        }
                    else:
                        if commission_representative:
                            old_blocks = current_meeting["commission_representative"].split('<<<BR>>>')
                            last_old_block = old_blocks[-1].strip() if old_blocks else ""
                            first_new_block = ' ' +commission_representative.split('<<<BR>>>')[0].strip()
                            all_titles = self.known_titles + self.department_titles + ['Cabinet member of']
                            split_title = False
                            for title in all_titles:
                                for i in range(1, len(title)):
                                    if last_old_block.endswith(title[:i]) and first_new_block.startswith(title[i:]):
                                        split_title = True
                                        break
                                if split_title:
                                    break
                            prev_last_bottom = current_meeting.get("last_word_bottom")
                            if split_title:
                                current_meeting["commission_representative"] += ' ' + commission_representative
                            elif prev_last_bottom and first_word_top and prev_last_bottom > 801 and first_word_top < 39:
                                current_meeting["commission_representative"] += ' ' + commission_representative
                            else:
                                current_meeting["commission_representative"] += "<<<BR>>>" + commission_representative

                            # Aggiorna last_word_bottom per la prossima riga
                            current_meeting["last_word_bottom"] = last_word_bottom

                        if subjects:
                            current_meeting["subjects"] += ' ' + subjects
                        if location:
                            current_meeting["location"] += ' ' + location

            # Salva l'ultimo meeting rimasto in `current_meeting`
            if current_meeting:
                self.save_meeting_to_db(current_meeting)

        pdf_file.close()

    def save_meeting_to_db(self, meeting_data):
        values = [
            self.lobbyist_id,
            meeting_data["meeting_number"],
            meeting_data["meeting_date"],
            meeting_data["subjects"],
            meeting_data["location"],
        ]
        self.db_conn.insert_data(self.table, self.columns, values)

        rep_blocks = self.parse_all_representatives(meeting_data["commission_representative"], meeting_data["meeting_date"])

        for representative_name, commission_cabinet in rep_blocks:
            representative_id = self.db_conn.get_field_id('commission_representative', 'name', representative_name, 'id')
            if not representative_id:
                self.db_conn.insert_data('commission_representative', ['name'], [representative_name])
                representative_id = self.db_conn.get_field_id('commission_representative', 'name', representative_name, 'id')
            
            cabinet_id = None
            if commission_cabinet:
                cabinet_id = self.db_conn.get_field_id('commission_cabinet', 'name', commission_cabinet, 'id')
                if not cabinet_id:
                    self.db_conn.insert_data('commission_cabinet', ['name'], [commission_cabinet])
                    cabinet_id = self.db_conn.get_field_id('commission_cabinet', 'name', commission_cabinet, 'id')

            self.db_conn.insert_data(
                'meeting_representatives',
                ['lobbyist_id', 'meeting_number', 'representative_id', 'cabinet_id'],
                [self.lobbyist_id, meeting_data["meeting_number"], representative_id, cabinet_id]
            )

    def parse_all_representatives(self, commission_representative_block: str, meeting_date: str):
        removed_spaces = re.sub(
            r'\s+',
            ' ',
            commission_representative_block.replace('\n', ' ')
                                        .replace('- ', '-')
                                        .replace(' -', '-')
        ).strip()
        normalized = removed_spaces.replace('Valeriu, Dan Dionisie', 'Dan Dionisie').replace('Adina Vălean', 'Adina-Ioana Vălean').replace('Glenn Micalle', 'Glenn Micallef').replace('Glenn Micalleff', 'Glenn Micallef').strip()

        raw_blocks = [b.strip() for b in normalized.split('<<<BR>>>') if b.strip()]
        results = []
        roles = []

        for block in raw_blocks:
            found_titles = []
            found_department = None

            for dept in sorted(self.department_titles, key=len, reverse=True):
                if dept in block:
                    found_department = dept
                    block = block.replace(dept, "")
                    break

            for title in sorted(self.known_titles, key=len, reverse=True):
                if title in block:
                    found_titles.append(title)
                    block = block.replace(title, "")

            block = re.sub(r'\s+', ' ', block)
            block = re.sub(r'\s*,\s*', ',', block)
            block = block.strip(" ,")

            found_title = ", ".join(found_titles) if found_titles else None

            if found_title and found_department:
                name_part = block.split(',', 1)[0].strip()
                roles.append({
                    "name": name_part,
                    "title": found_title,
                    "department": found_department
                })

            parts = [p.strip() for p in block.split(',') if p.strip()]
            if not parts:
                continue

            last_representative = parts[0]
            results.append((last_representative, None))

            if len(parts) > 1:
                for part in parts[1:]:
                    if 'Cabinet member of' in part:
                        cabinet = part.replace('Cabinet member of', '').strip()
                        results[-1] = (results[-1][0], cabinet)
                    else:
                        raise ValueError(f"Unexpected part in representative block: {commission_representative_block}")

        for role in roles:
            representative_id = self.db_conn.get_field_id('commission_representative', 'name', role["name"], 'id')
            if not representative_id:
                self.db_conn.insert_data('commission_representative', ['name'], [role["name"]])
                representative_id = self.db_conn.get_field_id('commission_representative', 'name', role["name"], 'id')

            directorate_id = self.db_conn.get_field_id('directorate', 'name', role["department"], 'id')
            if not directorate_id:
                self.db_conn.insert_data('directorate', ['name'], [role["department"]])
                directorate_id = self.db_conn.get_field_id('directorate', 'name', role["department"], 'id')

            self.db_conn.insert_data(
                'representative_allocation',
                ['representative_id', 'year', 'directorate_id', 'role'],
                [representative_id, meeting_date.year, directorate_id, role["title"]]
            )

        return results



    def truncate_table(self):
        self.db_conn.delete_table_data(self.table)

    def get_cell_text_with_manual_breaks(self, page, bbox, threshold_manual_break=12.1):
        words = page.extract_words()
        # Prendi solo parole che stanno dentro il rettangolo della cella
        cell_words = [
            w for w in words
            if bbox["0"] <= w["x0"] <= bbox["2"] and bbox["1"] <= w["top"] <= bbox["3"]
        ]

        if not cell_words:
            return "", None, None  # Nessuna parola trovata

        # Ordina per Y e poi X
        sorted_words = sorted(cell_words, key=lambda w: (round(w["top"], 1), w["x0"]))

        first_word_top = sorted_words[0]["top"]
        last_word_bottom = sorted_words[-1]["bottom"]

        lines = []
        current_line = []
        last_top = None

        for word in sorted_words:
            top = round(word["top"], 1)

            if last_top is None or abs(top - last_top) <= threshold_manual_break:
                current_line.append(word)
            else:
                lines.append(current_line)
                current_line = [word]
            last_top = top
        if current_line:
            lines.append(current_line)

        text = "<<<BR>>>".join(" ".join(w["text"] for w in line) for line in lines)
        return text, first_word_top, last_word_bottom



