const dotenv = require('dotenv');
const path = require('path');

const envFile = process.env.DOCKER_ENV ? '.env.docker' : '.env.local';

dotenv.config({ path: path.resolve(__dirname, envFile) });

const app = require('./app');
const sequelize = require('./config/db');

// Porta del server
const PORT = process.env.PORT || 3000;

// Connessione al database e avvio del server
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connessione al database avvenuta con successo.');
        
        app.listen(PORT, () => {
            console.log(`Server in ascolto sulla porta ${PORT}`);
        });
    } catch (error) {
        console.error('Errore durante la connessione al database:', error);
        process.exit(1);
    }
})();
