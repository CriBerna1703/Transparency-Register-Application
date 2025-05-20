import mysql.connector
import os

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'DavideDB',
    'database': 'TrasparencyRegisterDB'
}


def fetch_meetings_for_lobbyist(lobbyist_id, cursor):
   

        # SQL query to fetch meetings for a specific lobbyist
        query = """
            SELECT meeting_date, topic
            FROM commission_meetings  
            WHERE lobbyist_id = %s
            ORDER BY meeting_date ASC
        """
        cursor.execute(query, (lobbyist_id,))
        return cursor.fetchall()

def main():

    output_folder = 'Lobbyist_files'
    os.makedirs(output_folder, exist_ok=True)

    try:
        # Connect to the database
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()

        # Fetch all lobbyists
        cursor.execute("SELECT DISTINCT lobbyist_id FROM lobbyist_profile")
        lobbyists = cursor.fetchall()

        # Iterate through each lobbyist and fetch their meetings
        for (lobbyist_id,) in lobbyists:  
            meetings = fetch_meetings_for_lobbyist(lobbyist_id, cursor)     

            if not meetings:
                continue 
            # Create a file for each lobbyist
            file_path = os.path.join(output_folder, f"{lobbyist_id}.txt")
            with open(file_path, "w", encoding="utf-8") as file:
                for meeting_date, topic in meetings:
                    if meeting_date is not None:
                        date_str = meeting_date.strftime("%d/%m/%Y")
                    else:
                        date_str = "Data non disponibile"

                    topic_clean = " ".join(topic.split())
                    file.write(f"{date_str}\n")
                    file.write(f"{topic_clean}\n\n")

            print(f"Creato file per lobbyist_id: {lobbyist_id}")

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return


    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("Connessione al database chiusa.")

if __name__ == "__main__":
    main()    

    