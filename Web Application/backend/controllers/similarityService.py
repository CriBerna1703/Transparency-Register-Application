import sys
import json
from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
from sklearn.metrics.pairwise import cosine_similarity
import itertools

def main():
    input_data = json.load(sys.stdin)

    model = SentenceTransformer('all-MiniLM-L6-v2')
    kw_model = KeyBERT(model)

    texts = input_data.get("texts", [])
    keywords_map = {
        entry["id"]: [kw for kw, _ in kw_model.extract_keywords(entry["text"], top_n=15, stop_words='english')]
        for entry in texts if entry["text"].strip()
    }

    embeddings_map = {
        id_: model.encode(keywords, convert_to_tensor=False)
        for id_, keywords in keywords_map.items()
    }

    results = []
    ids = list(embeddings_map.keys())

    for id1, id2 in itertools.combinations(ids, 2):
        emb1 = embeddings_map[id1]
        emb2 = embeddings_map[id2]
        sim_matrix = cosine_similarity(emb1, emb2)

        max_pairs = [
            (keywords_map[id1][i], keywords_map[id2][row.argmax()], row[row.argmax()])
            for i, row in enumerate(sim_matrix)
        ]

        top_pairs = sorted(max_pairs, key=lambda x: x[2], reverse=True)[:8]
        shared_keywords = set(w1 for w1, _, _ in top_pairs).union(w2 for _, w2, _ in top_pairs)

        similarity_score = float(sum(sim for _, _, sim in top_pairs) / len(top_pairs))

        results.append({
            "lobbyist1": id1,
            "lobbyist2": id2,
            "similarity": similarity_score,
            "shared_keywords": list(shared_keywords)[:8]
        })

    json.dump({"similarities": results}, sys.stdout)

if __name__ == "__main__":
    main()
