import mysql.connector
import os
import subprocess
from datetime import datetime
from config import DB_CONFIG

class DBHandler:
    def __init__(self):
        self.connection = mysql.connector.connect(**DB_CONFIG)
    
    def insert_data(self, table, columns, values):
        sql = f"""
        INSERT IGNORE INTO {table} ({', '.join(columns)})
        VALUES ({', '.join(['%s'] * len(values))});
        """
        with self.connection.cursor() as cursor:
            cursor.execute(sql, values)
        self.connection.commit()

    def update_data(self, table, columns, values, lobbyist_id):
        set_clause = ', '.join([f"{column} = %s" for column in columns])
        sql = f"""
        UPDATE {table}
        SET {set_clause}
        WHERE lobbyist_id = %s;
        """
        with self.connection.cursor() as cursor:
            cursor.execute(sql, values + [lobbyist_id])
        self.connection.commit()

    def delete_table_data(self, table):
        sql = f"""
        delete from {table};
        """
        with self.connection.cursor() as cursor:
            cursor.execute(sql)
        self.connection.commit()

    def truncate_all_tables(self):
        self.delete_table_data('lobbyist_profile')
        self.delete_table_data('fields_of_interest')
        self.delete_table_data('proposals')
        self.delete_table_data('memberships')
        self.delete_table_data('commission_representative')
        self.delete_table_data('directorate')

    def get_field_id(self, table, column_name, value, id_column):
        sql = f"""
        SELECT {id_column} FROM {table} WHERE {column_name} = %s;
        """
        with self.connection.cursor() as cursor:
            cursor.execute(sql, (value,))
            result = cursor.fetchone()
            if cursor.with_rows:
                cursor.fetchall()
        return result[0] if result else None
    
    def get_lobbyist_ids(self):
        sql = """
        SELECT lobbyist_id FROM lobbyist_profile;
        """
        with self.connection.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()
        return [row[0] for row in result] if result else []

    def backup_database(self):
        backup_folder = "db_history"
        os.makedirs(backup_folder, exist_ok=True)

        # Nome del file di backup con timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        backup_file = os.path.join(backup_folder, f"backup_{timestamp}.sql")

        # Percorso completo di mysqldump (modifica con il percorso corretto della tua installazione)
        mysqldump_path = r"C:\\Program Files\\MySQL\\MySQL Server 8.0\bin\\mysqldump.exe"

        # Comando mysqldump
        cmd = [
            mysqldump_path,
            "-h", DB_CONFIG["host"],
            "-u", DB_CONFIG["user"],
            f"--password={DB_CONFIG['password']}",
            DB_CONFIG["database"],
            "-r", backup_file
        ]

        try:
            subprocess.run(cmd, check=True)
            print(f"Backup del database completato: {backup_file}")
        except subprocess.CalledProcessError as e:
            print(f"Errore durante il backup del database: {e}")
            raise e


    def close(self):
        self.connection.close()
