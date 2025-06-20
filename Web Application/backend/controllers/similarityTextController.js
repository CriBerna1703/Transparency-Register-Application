const { spawn } = require('child_process');
const path = require('path');

async function computeTextSimilarities(req, res) {
  const { startDate, endDate, lobbyist_ids } = req.body;

  const scriptPath = path.join(__dirname, 'similarityService.py');
  const py = spawn('python3', [scriptPath]);
  let output = '';
  let errorOutput = '';

  const payload = { startDate, endDate, lobbyist_ids };
  py.stdin.write(JSON.stringify(payload));
  py.stdin.end();

  py.stdout.on('data', (data) => {
    output += data.toString();
  });

  py.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  py.on('close', (code) => {
    if (code !== 0) {
      console.error('Python error:', errorOutput);
      return res.status(500).json({ error: 'Errore nel calcolo delle similarità' });
    }
    try {
      const result = JSON.parse(output);
      res.json(result);
    } catch (err) {
      console.error('Parsing error:', err);
      res.status(500).json({ error: 'Errore nel parsing della risposta' });
    }
  });
}

module.exports = {
  computeTextSimilarities
};
