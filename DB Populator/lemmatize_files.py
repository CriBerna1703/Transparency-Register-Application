import os
import nltk
import spacy
import string
import re

# Scarica risorse necessarie (solo alla prima esecuzione)
nltk.download('stopwords')
from nltk.corpus import stopwords

# Stopword in inglese + personalizzate
stop_words = set(stopwords.words('english'))
stop_words.update(["non", "union", "european", "single", "new", "eu"])

# Inizializza SpaCy
nlp = spacy.load("en_core_web_sm")

# === Funzione: rimozione punteggiatura + stopword ===
def clean_text(text):
    text = re.sub(r"[-]", " ", text)
    punctuation_to_remove = string.punctuation.replace("/", "")  # rimuove tutto tranne gli slash
    text = text.translate(str.maketrans("", "", punctuation_to_remove))
    words = text.split()
    filtered = [w for w in words if w.lower() not in stop_words]
    return ' '.join(filtered)

# === Funzione: lemmatizzazione ===
def lemmatize(text):
    doc = nlp(text)
    return ' '.join([token.lemma_ for token in doc if not token.is_punct and not token.is_space])

# === Cartelle ===
input_dir = 'Lobbyist_files'
output_dir = 'Lemmatized_Files'
os.makedirs(output_dir, exist_ok=True)

# === Elabora ogni file ===
for filename in os.listdir(input_dir):
    if filename.endswith('.txt'):
        with open(os.path.join(input_dir, filename), 'r', encoding='utf-8') as f:
            lines = f.readlines()

        processed_lines = []

        for line in lines:
            stripped = line.strip()
            if stripped == "":
                processed_lines.append("")
                continue
            cleaned = clean_text(stripped)
            lemmatized = lemmatize(cleaned)
            processed_lines.append(lemmatized)

        # Scrivi il file di output
        output_path = os.path.join(output_dir, filename)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(processed_lines))
