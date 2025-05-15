import sys
import json
import os
from datetime import datetime
import numpy as np
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from math import sqrt

def parse_date(date_str):
    return datetime.strptime(date_str, "%d/%m/%Y")

def extract_blocks_within_dates(text, start_date, end_date):
    lines = [line.strip() for line in text.strip().split('\n') if line.strip()]  # elimina righe vuote
    filtered = []
    i = 0
    while i < len(lines) - 1:
        date_line = lines[i]
        content_line = lines[i + 1]

        try:
            date = datetime.strptime(date_line, "%d/%m/%Y")
            if start_date <= date <= end_date:
                filtered.append(content_line)
            i += 2  # salta la coppia data + contenuto
        except ValueError:
            i += 1  # se non è una data, passa alla riga successiva
    return '\n'.join(filtered)

def cosine_similarity(vec1, vec2):
    all_words = set(vec1.keys()).union(vec2.keys())
    dot_product = sum(vec1.get(w, 0) * vec2.get(w, 0) for w in all_words)
    norm1 = sqrt(sum(v ** 2 for v in vec1.values()))
    norm2 = sqrt(sum(v ** 2 for v in vec2.values()))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot_product / (norm1 * norm2)

def jaccard_similarity(vec1, vec2):
    intersection = sum(min(vec1.get(w, 0), vec2.get(w, 0)) for w in set(vec1) | set(vec2))
    union = sum(max(vec1.get(w, 0), vec2.get(w, 0)) for w in set(vec1) | set(vec2))
    if union == 0:
        return 0.0
    return intersection / union

def main():
    input_data = json.load(sys.stdin)
    start_date = parse_date(input_data.get("startDate"))
    end_date = parse_date(input_data.get("endDate"))
    print(f"Start date: {start_date.strftime('%d/%m/%Y')}", file=sys.stderr)
    print(f"End date: {end_date.strftime('%d/%m/%Y')}", file=sys.stderr)
    lobbyist_ids = set(input_data.get("lobbyist_ids", []))

    input_dir = 'Lemmatized_Files'
    all_files = sorted([
        f for f in os.listdir(input_dir)
        if f.endswith('.txt') and os.path.splitext(f)[0] in lobbyist_ids
    ])

    D_triple_prime = {}
    for filename in all_files:
        with open(os.path.join(input_dir, filename), 'r', encoding='utf-8-sig') as f:
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
    selected_keywords = sorted(selected_words)


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

            sim_raw = sum(min(vec1[w], vec2[w]) for w in common_words)
            sim_cosine = cosine_similarity(vec1, vec2)
            sim_jaccard = jaccard_similarity(vec1, vec2)

            shared_keywords = sorted(common_words)[:8]

            results.append({
                "lobbyist1": os.path.splitext(file1)[0],
                "lobbyist2": os.path.splitext(file2)[0],
                "similarity_raw": sim_raw,
                "similarity_cosine": round(sim_cosine, 4),
                "similarity_jaccard": round(sim_jaccard, 4),
                "shared_keywords": shared_keywords
            })

    all_scores = [r["similarity_raw"] for r in results]
    min_sim = min(all_scores)
    max_sim = max(all_scores)
    range_sim = max_sim - min_sim if max_sim > min_sim else 1

    for r in results:
        r["similarity_NumJaccard"] = round((r.pop("similarity_raw") - min_sim) / range_sim, 4)

    json.dump({
        "similarities": results,
        "selected_keywords": selected_keywords
    }, sys.stdout)

if __name__ == "__main__":
    main()
