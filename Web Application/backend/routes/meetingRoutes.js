const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');

router.get('/filter', meetingController.getFilteredMeetings);
router.get('/:lobbyist_id', meetingController.getMeetingsByLobbyist);
router.get('/:lobbyist_id/:meeting_number', meetingController.getMeetingByLobbyistAndNumber);

module.exports = router;
