const fs = require('fs');
const path = require('path');

const TEXTS_FOLDER = path.join(__dirname, '..', 'Lobbyist_files');

exports.getLobbyistText = (req, res) => {
    const lobbyistId = req.params.id;
    const filePath = path.join(TEXTS_FOLDER, `${lobbyistId}.txt`);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.warn(`File non trovato: ${filePath}`);
            return res.status(404).json({ error: `Text not found for lobbyist ${lobbyistId}` });
        }
        res.json({ text: data });
    });
};
