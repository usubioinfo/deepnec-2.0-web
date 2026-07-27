// Author: Naveen Duhan
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from /deepnec-2.0
app.use('/deepnec-2.0', express.static(path.join(__dirname, 'build')));

// Fallback to index.html for any other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3361;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/deepnec-2.0`);
});
