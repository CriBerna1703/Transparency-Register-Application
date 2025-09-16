const express = require('express');
const bodyParser = require('body-parser');
const lobbyistRoutes = require('./routes/lobbyistRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const directorateRoutes = require('./routes/directorateRoutes');
const commissionRepresentativeRoutes = require('./routes/commissionRepresentativeRoutes');
const similarityRoutes = require('./routes/similarityRoutes');
const cabinetRoutes = require('./routes/cabinetRoutes');
const authRoutes = require('./routes/authRoutes');

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

const authenticateToken = require('./middleware/auth');

// Rotte protette
app.use('/api/lobbyists', authenticateToken, lobbyistRoutes);
app.use('/api/fields', authenticateToken, fieldRoutes);
app.use('/api/memberships', authenticateToken, membershipRoutes);
app.use('/api/proposals', authenticateToken, proposalRoutes);
app.use('/api/meetings', authenticateToken, meetingRoutes);
app.use('/api/directorates', authenticateToken, directorateRoutes);
app.use('/api/commission-representatives', authenticateToken, commissionRepresentativeRoutes);
app.use('/api/similarities', authenticateToken, similarityRoutes);
app.use('/api/cabinets', authenticateToken, cabinetRoutes);

app.use('/api/auth', authRoutes);

module.exports = app;
