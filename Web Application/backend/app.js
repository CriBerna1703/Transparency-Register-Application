const express = require('express');
const bodyParser = require('body-parser');
const lobbyistRoutes = require('./routes/lobbyistRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const directorateRoutes = require('./routes/directorateRoutes');
const commissionRepresentativeRoutes = require('./routes/commissionRepresentativeRoutes');

// Creazione dell'app Express
const app = express();

const cors = require('cors'); // Importa il middleware CORS

// Configura CORS
const corsOptions = {
    origin: 'http://localhost:4200', // Permetti richieste solo da questa origine
    methods: 'GET', // Specifica i metodi HTTP consentiti
    allowedHeaders: 'Content-Type,Authorization', // Specifica gli header consentiti
};

app.use(cors(corsOptions)); // Applica il middleware CORS

// Middleware
app.use(bodyParser.json());

// Rotte
app.use('/api/lobbyists', lobbyistRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/directorates', directorateRoutes);
app.use('/api/commission-representatives', commissionRepresentativeRoutes);

module.exports = app;
