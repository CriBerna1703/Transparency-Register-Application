import sys
import json
import os
from datetime import datetime
import numpy as np
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer

def parse_date(date_str):
    return datetime.strptime(date_str, "%d/%m/%Y")

def extract_blocks_within_dates(text, start_date, end_date):
    lines = text.strip().split('\n')
    filtered = []
    i = 0
    while i < len(lines) - 1:
        date_line = lines[i].strip()
        content_line = lines[i + 1].strip()
        try:
            date = datetime.strptime(date_line, "%d/%m/%Y")
            if start_date <= date <= end_date:
                filtered.append(content_line)
        except ValueError:
            pass
        i += 2
    return '\n'.join(filtered)

def main():
    input_data = json.load(sys.stdin)
    start_date = parse_date(input_data.get("startDate"))
    end_date = parse_date(input_data.get("endDate"))
    lobbyist_ids = set(input_data.get("lobbyist_ids", []))

    input_dir = 'Lemmatized_Files'

    # ✅ Cerca solo i file il cui nome (senza estensione) è in lobbyist_ids
    all_files = sorted([
        f for f in os.listdir(input_dir)
        if f.endswith('.txt') and os.path.splitext(f)[0] in lobbyist_ids
    ])

    D_triple_prime = {}
    for filename in all_files:
        with open(os.path.join(input_dir, filename), 'r', encoding='utf-8') as f:
            text = f.read()
            filtered = extract_blocks_within_dates(text, start_date, end_date)
            if filtered.strip():
                D_triple_prime[filename] = filtered

    if len(D_triple_prime) < 2:
        json.dump({"similarities": []}, sys.stdout)
        return

    documents = list(D_triple_prime.values())
    doc_names = list(D_triple_prime.keys())

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(documents)
    feature_names = vectorizer.get_feature_names_out()
    tfidf_dense = tfidf_matrix.toarray()

    tfidf_scores = np.sum(tfidf_dense, axis=0)
    mean = tfidf_scores.mean()
    std = tfidf_scores.std()
    threshold = mean + 0.5 * std
    selected_indices = np.where(tfidf_scores >= threshold)[0]
    selected_words = set(feature_names[i] for i in selected_indices)

    file_vectors = {}
    for filename, text in D_triple_prime.items():
        words = text.lower().split()
        word_counts = Counter(w for w in words if w in selected_words)
        file_vectors[filename] = word_counts

    results = []
    file_list = list(file_vectors.items())

    for i in range(len(file_list)):
        file1, vec1 = file_list[i]
        for j in range(i + 1, len(file_list)):
            file2, vec2 = file_list[j]
            common_words = set(vec1.keys()) & set(vec2.keys())
            similarity_score = sum(min(vec1[w], vec2[w]) for w in common_words)
            shared_keywords = sorted(common_words)[:8]

            results.append({
                "lobbyist1": os.path.splitext(file1)[0],
                "lobbyist2": os.path.splitext(file2)[0],
                "similarity_raw": similarity_score,
                "shared_keywords": shared_keywords
            })

    all_scores = [r["similarity_raw"] for r in results]
    min_sim = min(all_scores)
    max_sim = max(all_scores)
    range_sim = max_sim - min_sim if max_sim > min_sim else 1

    for r in results:
        r["similarity"] = round((r.pop("similarity_raw") - min_sim) / range_sim, 4)

    json.dump({"similarities": results}, sys.stdout)

if __name__ == "__main__":
    main()
