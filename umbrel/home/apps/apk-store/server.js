import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5176;

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/api/apks', (req, res) => {
  const apksDir = path.join(__dirname, 'public', 'apks');
  
  try {
    if (!fs.existsSync(apksDir)) {
      fs.mkdirSync(apksDir, { recursive: true });
      return res.json([]);
    }

    const files = fs.readdirSync(apksDir).filter(file => file.endsWith('.apk'));
    
    const apps = files.map((file, index) => {
      const stats = fs.statSync(path.join(apksDir, file));
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      return {
        id: index + 1,
        name: file.replace('.apk', ''),
        filename: file,
        size: `${sizeInMB} MB`,
        icon: '📱',
        downloadUrl: `/apks/${file}`
      };
    });

    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar APKs' });
  }
});

app.use('/apks', express.static(path.join(__dirname, 'public', 'apks')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});