/// <reference lib="webworker" />

addEventListener('message', async ({ data }) => {
  const { lobbyistIds, chunkSize, apiUrl, token } = data;
  const results: any[] = [];

  for (let i = 0; i < lobbyistIds.length; i += chunkSize) {
    const batch = lobbyistIds.slice(i, i + chunkSize);

    try {
      const params = new URLSearchParams();
      params.set('lobbyist_ids', batch.join(','));

      const response = await fetch(`${apiUrl}/allLobbyists?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP ${response.status}`);
      }

      const batchData = await response.json();
      results.push(...batchData);

      postMessage({ progress: results.length, total: lobbyistIds.length });

    } catch (err) {
      console.error('Errore nel batch:', err);
      const message = err instanceof Error ? err.message : String(err);
      postMessage({ error: message });
    }
  }

  postMessage({ done: true, results });
});
