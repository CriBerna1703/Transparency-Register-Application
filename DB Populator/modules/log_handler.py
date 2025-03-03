import os
import logging
import sys
from datetime import datetime

class LoggerWriter:
    def __init__(self, level):
        self.level = level
        self.line_buffer = ''

    def write(self, message):
        if message.strip():  # Evita di loggare linee vuote
            self.level(message.strip())

    def flush(self):
        pass  # Necessario per compatibilità con sys.stdout/sys.stderr

def configure_logging():
    # Creazione della cartella execution_logs se non esiste
    log_folder = "execution_logs"
    os.makedirs(log_folder, exist_ok=True)

    # Generazione del nome del file di log con timestamp
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    log_file = os.path.join(log_folder, f"script_execution_{timestamp}.log")

    # Configurazione del logging
    logging.basicConfig(
        filename=log_file,
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )
    
    # Logging di base a console (solo INFO e ERROR)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logging.getLogger().addHandler(console_handler)

    logging.info(f"Log salvato in: {log_file}")

    # Reindirizzamento di stdout e stderr al logger
    sys.stdout = LoggerWriter(logging.info)
    sys.stderr = LoggerWriter(logging.error)

