require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/artists',   require('./routes/artists'));
app.use('/api/albums',    require('./routes/albums'));
app.use('/api/tracks',    require('./routes/tracks'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/search',    require('./routes/search'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Soundwave API' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Soundwave API listening on port ${PORT}`));
