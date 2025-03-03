import requests
from requests.adapters import HTTPAdapter, Retry
from datetime import datetime
from bs4 import BeautifulSoup

def get_soup(lobbyist_id):
    base_url = "https://ec.europa.eu/transparencyregister/public/PUBLIC/ORGANISATION/"
    url = f"{base_url}{lobbyist_id}?lang=it"
    try:
        session = requests.Session()
        retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
        adapter = HTTPAdapter(max_retries=retries)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        response = session.get(url, timeout=10)
        response.raise_for_status()

        return BeautifulSoup(response.text, 'html.parser')
    except requests.exceptions.RequestException as e:
        print(f"Error while connecting for lobbyist {lobbyist_id}: {e}")
        return None

def validate_date(date_string):
    """Validate and convert a string to MySQL datetime format, accepting multiple formats, or return NULL if invalid."""
    if date_string:
        # List of acceptable formats
        date_formats = ['%d/%m/%Y %H:%M:%S', '%d/%m/%Y']

        for date_format in date_formats:
            try:
                # Try converting the string to a datetime object using the current format.
                return datetime.strptime(date_string, date_format)
            except ValueError:
                # Keep trying with the next format.
                continue
        # If no format works, return None (equivalent to NULL in MySQL)
        return None
    return None  # Return NULL if string is empty or does not exist.
    
def extract_section_data_from_element(section_element):
    """
    Extract data from a table by also handling links and sections with a single td as headers.
    If there are <ul><li>, it returns a list of elements.
    """
    section_data = {}
    current_section = None  # To keep track of the current section

    rows = section_element.find_all('tr')
    for row in rows:
        cells = row.find_all('td')

        if len(cells) == 1:  # If it only has a td, it is a new section header.
            current_section = cells[0].get_text(strip=True)
            section_data[current_section] = {}  # Create a new empty subsection

        elif len(cells) == 2:  # If it has two td, they are key-value within the current section.
            key = cells[0].get_text(strip=True)

            # Check if there are <ul><li> elements in the second cell.
            ul = cells[1].find('ul')
            if ul:
                # If there are <ul>, collect the texts of the <li> in a list
                value = [li.get_text(strip=True) for li in ul.find_all('li')]
            else:
                # Otherwise, we merge the texts of all <span> in the second cell with a space between them.
                value = " ".join(span.get_text(strip=True) for span in cells[1].find_all('span'))
                if not value:  # If there are no <span>, get the text of the cell.
                    value = cells[1].get_text(strip=True)

            # If we extract links, check if the second td contains a link.
            link = cells[1].find('a')
            if link:
                link_text = link.get_text(strip=True)
                link_url = link.get('href')
                value = f"{link_url}"

            if current_section:  # Add to current subsection
                section_data[current_section][key] = value
            else:  # If there is no current section, add to root
                section_data[key] = value

    return section_data