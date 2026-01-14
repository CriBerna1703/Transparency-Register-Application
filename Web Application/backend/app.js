const express = require('express');
const bodyParser = require('body-parser');
const lobbyistRoutes = require('./routes/lobbyistRoutes');
const allLobbyistRoutes = require('./routes/allLobbyistRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const directorateRoutes = require('./routes/directorateRoutes');
const commissionRepresentativeRoutes = require('./routes/commissionRepresentativeRoutes');
const similarityRoutes = require('./routes/similarityRoutes');
const cabinetRoutes = require('./routes/cabinetRoutes');

// Creazione dell'app Express
const app = express();

const cors = require('cors'); // Importa il middleware CORS

// Configura CORS
const corsOptions = {
    origin: '*',
    methods: 'GET, POST', 
    allowedHeaders: 'Content-Type,Authorization',
};

app.use(cors(corsOptions));

// Middleware
app.use(bodyParser.json());

// Rotte protette
app.use('/api/lobbyists', lobbyistRoutes);
app.use('/api/allLobbyists', allLobbyistRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/directorates', directorateRoutes);
app.use('/api/commission-representatives', commissionRepresentativeRoutes);
app.use('/api/similarities', similarityRoutes);
app.use('/api/cabinets', cabinetRoutes);

module.exports = app;
