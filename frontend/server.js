const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3200;

// Servir archivos estáticos del build
app.use(express.static(path.join(__dirname, 'build')));

// Para React Router - todas las rutas van al index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
