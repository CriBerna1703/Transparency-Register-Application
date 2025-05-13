const { spawn } = require('child_process');
const path = require('path');

async function computeSimilarities(req, res) {
  const texts = req.body.texts;
  console.log('📥 Payload ricevuto:', JSON.stringify(texts, null, 2));

  if (!Array.isArray(texts) || texts.some(t => typeof t.id !== 'string' || typeof t.text !== 'string')) {
    console.error('❌ Formato input non valido');
    return res.status(400).json({ error: 'Invalid input format' });
  }

  const scriptPath = path.join(__dirname, 'similarityService.py');
  const py = spawn('python3', [scriptPath]);

  let output = '';
  let errorOutput = '';

  py.stdin.write(JSON.stringify({ texts }));
  py.stdin.end();

  py.stdout.on('data', (data) => {
    output += data.toString();
  });

  py.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.error('❗ stderr:', data.toString());
  });

  py.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Python exited with code:', code);
      console.error('❗ stderr:', errorOutput);
      return res.status(500).json({ error: 'Errore nel calcolo delle similarità' });
    }
    try {
      const result = JSON.parse(output);
      res.json(result);
    } catch (err) {
      console.error('❌ Errore nel parsing JSON:', err);
      console.error('📤 Output ricevuto dal Python:', output);
      res.status(500).json({ error: 'Errore nel parsing della risposta' });
    }
  });
}

module.exports = {
  computeSimilarities
};