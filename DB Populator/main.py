import time
import sys
import logging
from modules.db_handler import DBHandler
from modules.commission_representative_extractor import CommissionRepresentativeExtractor
from modules.lobbyst_ids_extractor import LobbyistScraper
from modules.profile_extractor import ProfileDataExtractor
from modules.fields_of_interest_extractor import FieldsOfInterestExtractor
from modules.memberships_extractor import MembershipExtractor
from modules.proposals_extractor import ProposalsExtractor
from modules.meetings_extractor import MeetingExtractor
from modules.utils import get_soup
from modules.log_handler import configure_logging  # Importa il modulo di log

# Configura il logging all'inizio
configure_logging()

def truncate_all_tables_with_backup():
    logging.info("Step 1: Backup del database e troncamento delle tabelle.")
    try:
        db = DBHandler()
        db.backup_database()
        db.truncate_all_tables()
        db.close()
        logging.info("Backup e troncamento completati con successo.")
    except Exception as e:
        logging.error(f"Errore durante il backup o il troncamento delle tabelle: {e}")
        raise e


def extract_commission_representatives(file_path):
    logging.info("Step 2: Estrazione dei rappresentanti della commissione.")
    try:
        db = DBHandler()
        CommissionRepresentativeExtractor(file_path, db).extract()
        db.close()
        logging.info("Estrazione dei rappresentanti completata.")
    except Exception as e:
        logging.error(f"Errore durante l'estrazione dei rappresentanti: {e}")
        raise e


def scrape_lobbyist_ids(base_url):
    logging.info("Step 3: Raccolta degli ID dei lobbisti.")
    try:
        LobbyistScraper(base_url).execute()
        logging.info("Raccolta ID lobbisti completata.")
    except Exception as e:
        logging.error(f"Errore durante la raccolta degli ID dei lobbisti: {e}")
        raise e


def process_lobbyists(batch_size, country_file):
    logging.info("Step 4: Elaborazione dei lobbisti.")
    try:
        db = DBHandler()
        lobbyist_ids = db.get_lobbyist_ids()
        db.close()

        if not lobbyist_ids:
            logging.warning("Nessun ID lobbista trovato nel database.")
            return

        for i in range(0, len(lobbyist_ids), batch_size):
            db = DBHandler()
            batch = lobbyist_ids[i:i + batch_size]
            for lobbyist_id in batch:
                print(f"Processing lobbyist ID: {lobbyist_id}")  # Questo verrà catturato nei log
                soup = get_soup(lobbyist_id)
                if soup:
                    ProfileDataExtractor(lobbyist_id, soup, db, country_file).extract()
                    FieldsOfInterestExtractor(lobbyist_id, soup, db).extract()
                    MembershipExtractor(lobbyist_id, soup, db).extract()
                    ProposalsExtractor(lobbyist_id, soup, db).extract()
                    MeetingExtractor(lobbyist_id, db).extract()
            db.close()

            logging.info(
                f"Processed {i + len(batch)} lobbyists out of {len(lobbyist_ids)}. "
                "Pausing for 3 seconds to avoid server overload..."
            )
            time.sleep(3)
    except Exception as e:
        logging.error(f"Errore durante l'elaborazione dei lobbisti: {e}")
        raise e


if __name__ == "__main__":
    logging.info("Inizio esecuzione script principale.")
    try:
        # Step 1: Backup e troncamento delle tabelle
        truncate_all_tables_with_backup()

        # Step 2: Estrazione dei rappresentanti della commissione
        file_path = 'Dizionario CE.xlsx'
        extract_commission_representatives(file_path)

        # Step 3: Raccolta degli ID dei lobbisti
        base_url = "https://ec.europa.eu/transparencyregister/public"
        scrape_lobbyist_ids(base_url)

        # Step 4: Elaborazione dei lobbisti in batch
        batch_size = 100
        country_file = "countries_mapping.yml"
        process_lobbyists(batch_size, country_file)

        logging.info("Esecuzione script completata con successo.")
    except Exception as e:
        logging.error(f"Errore critico: {e}. Terminazione dello script.")
        sys.exit(1)  # Termina lo script con errore
