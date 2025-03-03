import requests
from modules.db_handler import DBHandler
from bs4 import BeautifulSoup

class LobbyistScraper:
    def __init__(self, base_url):
        self.base_url = base_url
        self.table = 'lobbyist_profile'
        self.columns = [
            'lobbyist_id', 'organization_name'
        ]
        self.session = requests.Session()
        self.pages_per_letter = {}

    def calculate_pages_for_letter(self, letter):
        url = f"{self.base_url}/alphabetical/REGISTRANTS/LATIN/{letter}/0?lang=it"
        response = self.session.get(url)
        response.raise_for_status()  # Check possible errors

        soup = BeautifulSoup(response.text, 'html.parser')
        return self._get_total_pages(soup)

    def _get_total_pages(self, soup):
        pagination_info = soup.find('td', string=lambda x: x and 'Pagina' in x)
        if pagination_info:
            total_pages_text = pagination_info.get_text(strip=True)
            total_pages = total_pages_text.split('/')[1].strip().split()[0]  # Extracts the number of pages
            return int(total_pages)
        return 1  # Default if nothing is found

    def get_lobbyists_for_letter(self, letter, page_number):
        url = f"{self.base_url}/alphabetical/REGISTRANTS/LATIN/{letter}/{page_number}?lang=it"
        response = self.session.get(url)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        return self._parse_lobbyists(soup)

    def _parse_lobbyists(self, soup):
        lobbyists = []
        table = soup.find('table', class_='ecl-table--zebra')
        if table:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all('td')
                if len(cells) > 1:
                    registration_number = cells[0].get_text(strip=True)
                    organization_name = cells[1].get_text(strip=True)
                    lobbyists.append({
                        "registration_number": registration_number,
                        "organization_name": organization_name
                    })
                    self.db.insert_data(self.table, self.columns, [registration_number, organization_name])
        return lobbyists

    def get_all_lobbyists_for_letter(self, letter):
        if letter not in self.pages_per_letter:
            self.pages_per_letter[letter] = self.calculate_pages_for_letter(letter)

        total_pages = self.pages_per_letter[letter]
        all_lobbyists = []

        for page in range(total_pages):
            self.db = DBHandler()
            lobbyists = self.get_lobbyists_for_letter(letter, page)
            all_lobbyists.extend(lobbyists)
            self.db.close()

        return all_lobbyists

    def scrape_all_lobbyists(self):
        alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        all_lobbyists = {}

        for letter in alphabet:
            print(f"Scraping letter {letter}...")
            lobbyists = self.get_all_lobbyists_for_letter(letter)
            all_lobbyists[letter] = lobbyists

        return all_lobbyists

    def execute(self):
        all_lobbyists = self.scrape_all_lobbyists()

        # Extracting lobbyist IDs.
        lobbyist_ids = []
        for letter, lobbyists in all_lobbyists.items():
            for lobbyist in lobbyists:
                lobbyist_ids.append(lobbyist["registration_number"])
        
        # # Save lobbyist IDs in a file.
        # with open('lobbyist_ids.txt', 'w') as file:
        #     for id in lobbyist_ids:
        #         file.write(f"{id}\n")

        return lobbyist_ids
