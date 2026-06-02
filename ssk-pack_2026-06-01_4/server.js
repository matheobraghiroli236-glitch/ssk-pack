import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import os from 'os';
import { createReadStream } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'sskadmin123';

const IS_WINDOWS = os.platform() === 'win32';
const DATA_DIR = IS_WINDOWS ? 'C:\\ssk-data' : path.join(os.homedir(), 'ssk-data');

const DB_PATH              = path.join(DATA_DIR, 'packs.json');
const BUILDER_ITEMS_DB     = path.join(__dirname, 'database', 'builder-items.json');
const UPLOADS_DIR          = path.join(DATA_DIR, 'uploads');
const PACKS_DIR            = path.join(UPLOADS_DIR, 'packs');
const SCREENSHOTS_DIR      = path.join(UPLOADS_DIR, 'screenshots');
const VIDEOS_DIR           = path.join(UPLOADS_DIR, 'videos');
const BACKUP_DIR           = path.join(DATA_DIR, 'backups');

[DATA_DIR, UPLOADS_DIR, PACKS_DIR, SCREENSHOTS_DIR, VIDEOS_DIR, BACKUP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Dossier créé : ${dir}`);
  }
});

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, '[]', 'utf-8');
} else {
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    console.log(`✅ Base de données chargée : ${parsed.length} packs trouvés`);
  } catch {
    console.warn('⚠️ packs.json corrompu');
    fs.writeFileSync(DB_PATH, '[]', 'utf-8');
  }
}

function createBackup() {
  try {
    if (!fs.existsSync(DB_PATH)) return;
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const packs = JSON.parse(data);
    if (packs.length === 0) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = path.join(BACKUP_DIR, `packs-backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, data, 'utf-8');
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('packs-backup-') && f.endsWith('.json'))
      .sort();
    if (backups.length > 10) {
      backups.slice(0, backups.length - 10).forEach(f => fs.unlinkSync(path.join(BACKUP_DIR, f)));
    }
    console.log(`💾 Backup : ${packs.length} packs → ${backupFile}`);
  } catch (err) {
    console.error('Erreur backup:', err.message);
  }
}

setInterval(createBackup, 10 * 60 * 1000);
setTimeout(createBackup, 5000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));
// Serve builder item assets (sword textures, previews, etc.)
app.use('/builder-items', express.static(path.join(__dirname, 'public', 'builder-items')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'packFile') cb(null, PACKS_DIR);
    else if (file.fieldname === 'thumbnail') cb(null, SCREENSHOTS_DIR);
    else if (file.fieldname === 'previewVideo') cb(null, VIDEOS_DIR);
    else cb(new Error('Champ invalide'), null);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'packFile') {
      const isZip = file.mimetype === 'application/zip'
        || file.mimetype === 'application/x-zip-compressed'
        || path.extname(file.originalname).toLowerCase() === '.zip';
      isZip ? cb(null, true) : cb(new Error('Seuls les .zip sont autorisés !'), false);
    } else if (file.fieldname === 'thumbnail') {
      file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Seules les images sont autorisées !'), false);
    } else if (file.fieldname === 'previewVideo') {
      const ext = path.extname(file.originalname).toLowerCase();
      const isVideo = file.mimetype === 'video/mp4' || file.mimetype === 'video/webm'
        || ext === '.mp4' || ext === '.webm';
      isVideo ? cb(null, true) : cb(new Error('Seuls .mp4 ou .webm sont autorisés !'), false);
    } else {
      cb(null, false);
    }
  }
});

const builderStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { category } = req.body;
    const catDir = path.join(__dirname, 'public', 'builder-items', category || 'swords');
    if (!fs.existsSync(catDir)) {
      fs.mkdirSync(catDir, { recursive: true });
    }
    cb(null, catDir);
  },
  filename: (req, file, cb) => {
    const { category } = req.body;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'textureFile' ? 'item' : 'preview';
    cb(null, `${prefix}_${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const uploadBuilder = multer({
  storage: builderStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'textureFile') {
      const isImg = file.mimetype.startsWith('image/') || ext === '.png';
      isImg ? cb(null, true) : cb(new Error('La texture doit être une image !'), false);
    } else if (file.fieldname === 'previewFile') {
      const isMedia = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') ||
                      ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4', '.webm'].includes(ext);
      isMedia ? cb(null, true) : cb(new Error('L\'aperçu doit être une image ou une vidéo !'), false);
    } else {
      cb(null, false);
    }
  }
});


const getPacks = () => {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch { return []; }
};

const savePacks = (packs) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(packs, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erreur DB:', err);
    return false;
  }
};

app.get('/api/packs', (req, res) => res.json(getPacks()));

// ── BUILDER ITEMS API ────────────────────────────────────────────────────────
app.get('/api/builder/items', (req, res) => {
  try {
    const data = fs.existsSync(BUILDER_ITEMS_DB)
      ? JSON.parse(fs.readFileSync(BUILDER_ITEMS_DB, 'utf-8'))
      : {};
    res.json(data);
  } catch {
    res.json({});
  }
});

app.post(
  '/api/admin/builder/items',
  uploadBuilder.fields([
    { name: 'textureFile', maxCount: 1 },
    { name: 'previewFile', maxCount: 1 }
  ]),
  (req, res) => {
    const { password, category, name, internalPath } = req.body;
    const cleanupFiles = () => {
      if (req.files) {
        Object.values(req.files).flat().forEach(f => {
          try { fs.unlinkSync(f.path); } catch {}
        });
      }
    };
    if (password !== ADMIN_PASSWORD) {
      cleanupFiles();
      return res.status(401).json({ error: 'Mot de passe incorrect !' });
    }
    if (!category || !name || !internalPath) {
      cleanupFiles();
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires.' });
    }
    if (!req.files || !req.files.textureFile) {
      cleanupFiles();
      return res.status(400).json({ error: 'Veuillez téléverser un fichier de texture PNG.' });
    }
    try {
      const textureFilename = req.files.textureFile[0].filename;
      const fileUrl = `/builder-items/${category}/${textureFilename}`;
      let previewUrl = fileUrl; // par défaut l'aperçu est la texture elle-même
      if (req.files.previewFile) {
        const previewFilename = req.files.previewFile[0].filename;
        previewUrl = `/builder-items/${category}/${previewFilename}`;
      }
      let data = {};
      if (fs.existsSync(BUILDER_ITEMS_DB)) {
        try {
          data = JSON.parse(fs.readFileSync(BUILDER_ITEMS_DB, 'utf-8'));
        } catch {
          data = {};
        }
      }
      if (!data[category]) {
        data[category] = [];
      }
      const newId = `${category.replace(/s$/, '')}_${Date.now()}`;
      const newItem = {
        id: newId,
        name,
        preview: previewUrl,
        file: fileUrl,
        internalPath
      };
      data[category].push(newItem);
      fs.writeFileSync(BUILDER_ITEMS_DB, JSON.stringify(data, null, 2), 'utf-8');
      res.json({ success: true, item: newItem });
    } catch (err) {
      cleanupFiles();
      res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'élément : ' + err.message });
    }
  }
);

// ── MODIFIER L'IMAGE D'UN ÉLÉMENT DU BUILDER ────────────────────────────────
const editBuilderStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { category } = req.params;
    const catDir = path.join(__dirname, 'public', 'builder-items', category || 'swords');
    if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });
    cb(null, catDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `item_${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  }
});
const uploadEditBuilder = multer({
  storage: editBuilderStorage,
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Seules les images sont autorisées.'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/api/admin/builder/items/edit/:category/:id',
  uploadEditBuilder.single('newImage'),
  (req, res) => {
    const { password } = req.body;
    const { category, id } = req.params;

    if (password !== ADMIN_PASSWORD) {
      if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(401).json({ error: 'Mot de passe incorrect !' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie.' });
    }
    if (!fs.existsSync(BUILDER_ITEMS_DB)) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(404).json({ error: 'Base de données du builder introuvable.' });
    }

    try {
      const data = JSON.parse(fs.readFileSync(BUILDER_ITEMS_DB, 'utf-8'));
      if (!data[category]) {
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.status(404).json({ error: 'Catégorie introuvable.' });
      }
      const idx = data[category].findIndex(item => item.id === id);
      if (idx === -1) {
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.status(404).json({ error: 'Élément introuvable.' });
      }

      const item = data[category][idx];
      const newFileUrl = `/builder-items/${category}/${req.file.filename}`;

      // Supprimer l'ancienne image (file) si elle n'est pas utilisée comme preview différente
      const oldFile = item.file;
      const oldPreview = item.preview;

      // Mettre à jour file et preview (si preview était égal à file, on met à jour les deux)
      const previewWasFile = (oldPreview === oldFile);
      item.file = newFileUrl;
      if (previewWasFile) item.preview = newFileUrl;

      // Supprimer les anciens fichiers
      [oldFile, previewWasFile ? null : oldPreview].filter(Boolean).forEach(url => {
        if (url && url.startsWith('/builder-items/')) {
          const fp = path.join(__dirname, 'public', url);
          if (fs.existsSync(fp)) try { fs.unlinkSync(fp); } catch {}
        }
      });

      fs.writeFileSync(BUILDER_ITEMS_DB, JSON.stringify(data, null, 2), 'utf-8');
      res.json({ success: true, item: data[category][idx] });

    } catch (err) {
      try { fs.unlinkSync(req.file.path); } catch {}
      res.status(500).json({ error: 'Erreur : ' + err.message });
    }
  }
);

app.post('/api/admin/builder/items/delete/:category/:id', (req, res) => {
  const { password } = req.body;
  const { category, id } = req.params;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Mot de passe incorrect !' });
  }
  if (!fs.existsSync(BUILDER_ITEMS_DB)) {
    return res.status(404).json({ error: 'Base de données du builder introuvable.' });
  }
  try {
    const data = JSON.parse(fs.readFileSync(BUILDER_ITEMS_DB, 'utf-8'));
    if (!data[category]) {
      return res.status(404).json({ error: 'Catégorie introuvable.' });
    }
    const idx = data[category].findIndex(item => item.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Élément introuvable.' });
    }
    const item = data[category][idx];
    [item.preview, item.file].forEach(url => {
      if (url && url.startsWith('/builder-items/')) {
        const fp = path.join(__dirname, 'public', url);
        if (fs.existsSync(fp)) {
          try { fs.unlinkSync(fp); } catch {}
        }
      }
    });
    data[category].splice(idx, 1);
    fs.writeFileSync(BUILDER_ITEMS_DB, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression : ' + err.message });
  }
});


app.post('/api/admin/verify', (req, res) => {
  req.body.password === ADMIN_PASSWORD
    ? res.json({ success: true })
    : res.status(401).json({ error: 'Mot de passe incorrect !' });
});

app.post('/api/packs/download/:id', (req, res) => {
  const packs = getPacks();
  const idx = packs.findIndex(p => p.id === req.params.id);
  if (idx !== -1) {
    packs[idx].downloads = (packs[idx].downloads || 0) + 1;
    savePacks(packs);
    res.json({ success: true, downloads: packs[idx].downloads, url: packs[idx].downloadUrl });
  } else {
    res.status(404).json({ error: 'Pack non trouvé' });
  }
});

app.post('/api/packs/like/:id', (req, res) => {
  const packs = getPacks();
  const idx = packs.findIndex(p => p.id === req.params.id);
  if (idx !== -1) {
    packs[idx].likes = (packs[idx].likes || 0) + 1;
    savePacks(packs);
    res.json({ success: true, likes: packs[idx].likes });
  } else {
    res.status(404).json({ error: 'Pack non trouvé' });
  }
});

app.delete('/api/packs/:id', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Mot de passe incorrect !' });
  const packs = getPacks();
  const idx = packs.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Pack non trouvé.' });
  const pack = packs[idx];
  [pack.thumbnailUrl, pack.downloadUrl, pack.previewVideoUrl].filter(Boolean).forEach(url => {
    if (url && !url.includes('default-thumb')) {
      const filename = path.basename(url);
      [path.join(PACKS_DIR, filename), path.join(SCREENSHOTS_DIR, filename), path.join(VIDEOS_DIR, filename)]
        .forEach(fp => { if (fs.existsSync(fp)) try { fs.unlinkSync(fp); } catch {} });
    }
  });
  packs.splice(idx, 1);
  savePacks(packs);
  createBackup();
  res.json({ success: true });
});

app.post(
  '/api/packs/upload',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'packFile', maxCount: 1 },
    { name: 'previewVideo', maxCount: 1 }
  ]),
  (req, res) => {
    const { password, name, creator, description, resolution, category, versions, tags, externalUrl, isExternal } = req.body;
    const cleanupFiles = () => {
      if (req.files) Object.values(req.files).flat().forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
    };
    if (password !== ADMIN_PASSWORD) { cleanupFiles(); return res.status(401).json({ error: 'Mot de passe incorrect !' }); }
    if (!name || !creator || !description || !resolution || !category || !versions) { cleanupFiles(); return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires.' }); }
    const packs = getPacks();
    const newId = Date.now().toString();
    const isExt = isExternal === 'true';
    let downloadUrl = '';
    if (isExt) {
      downloadUrl = externalUrl;
      if (req.files && req.files.packFile) try { fs.unlinkSync(req.files.packFile[0].path); } catch {}
    } else {
      if (!req.files || !req.files.packFile) {
        if (req.files && req.files.thumbnail) try { fs.unlinkSync(req.files.thumbnail[0].path); } catch {}
        return res.status(400).json({ error: 'Veuillez téléverser un fichier .zip.' });
      }
      downloadUrl = `/uploads/packs/${req.files.packFile[0].filename}`;
    }
    let thumbnailUrl = '/uploads/screenshots/default-thumb.jpg';
    if (req.files && req.files.thumbnail) thumbnailUrl = `/uploads/screenshots/${req.files.thumbnail[0].filename}`;
    let previewVideoUrl = null;
    if ((category === 'Sky' || category === 'Overlay') && req.files && req.files.previewVideo) {
      previewVideoUrl = `/uploads/videos/${req.files.previewVideo[0].filename}`;
    }
    const newPack = {
      id: newId, name, creator, description, resolution, category,
      versions: Array.isArray(versions) ? versions : [versions],
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      downloadUrl, isExternal: isExt, thumbnailUrl, previewVideoUrl,
      screenshots: [thumbnailUrl], downloads: 0, likes: 0,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    packs.unshift(newPack);
    if (savePacks(packs)) { createBackup(); res.json({ success: true, pack: newPack }); }
    else res.status(500).json({ error: 'Impossible de sauvegarder.' });
  }
);

app.get('/api/admin/backups', (req, res) => {
  try {
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('packs-backup-') && f.endsWith('.json'))
      .sort().reverse()
      .map(f => {
        const data = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, f), 'utf-8'));
        return { filename: f, count: data.length, date: f.replace('packs-backup-', '').replace('.json', '') };
      });
    res.json({ backups, dataDir: DATA_DIR });
  } catch {
    res.json({ backups: [], dataDir: DATA_DIR });
  }
});

app.post('/api/admin/restore/:filename', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Mot de passe incorrect !' });
  const backupFile = path.join(BACKUP_DIR, req.params.filename);
  if (!fs.existsSync(backupFile)) return res.status(404).json({ error: 'Backup non trouvé.' });
  try {
    const data = fs.readFileSync(backupFile, 'utf-8');
    const packs = JSON.parse(data);
    fs.writeFileSync(DB_PATH, data, 'utf-8');
    res.json({ success: true, count: packs.length });
  } catch {
    res.status(500).json({ error: 'Impossible de restaurer.' });
  }
});

app.get('/api/admin/full-backup', async (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Mot de passe incorrect !' });
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="ssk-backup-${timestamp}.zip"`);
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', err => { throw err; });
    archive.pipe(res);
    if (fs.existsSync(DB_PATH)) archive.file(DB_PATH, { name: 'packs.json' });
    if (fs.existsSync(UPLOADS_DIR)) archive.directory(UPLOADS_DIR, 'uploads');
    await archive.finalize();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: 'Erreur backup.' });
  }
});

const restoreUpload = multer({ dest: os.tmpdir() });
app.post('/api/admin/full-restore', restoreUpload.single('backupFile'), async (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(401).json({ error: 'Mot de passe incorrect !' });
  }
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });
  try {
    const { default: unzipper } = await import('unzipper');
    const extractDir = path.join(os.tmpdir(), `ssk-restore-${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });
    await createReadStream(req.file.path).pipe(unzipper.Extract({ path: extractDir })).promise();
    const jsonPath = path.join(extractDir, 'packs.json');
    if (!fs.existsSync(jsonPath)) {
      fs.rmSync(extractDir, { recursive: true });
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Backup invalide : packs.json manquant.' });
    }
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const packs = JSON.parse(raw);
    fs.writeFileSync(DB_PATH, raw, 'utf-8');
    const uploadsInZip = path.join(extractDir, 'uploads');
    if (fs.existsSync(uploadsInZip)) {
      const copyRecursive = (src, dest) => {
        fs.mkdirSync(dest, { recursive: true });
        for (const item of fs.readdirSync(src)) {
          const s = path.join(src, item);
          const d = path.join(dest, item);
          fs.statSync(s).isDirectory() ? copyRecursive(s, d) : fs.copyFileSync(s, d);
        }
      };
      copyRecursive(uploadsInZip, UPLOADS_DIR);
    }
    fs.rmSync(extractDir, { recursive: true });
    fs.unlinkSync(req.file.path);
    createBackup();
    res.json({ success: true, count: packs.length, message: `${packs.length} packs restaurés !` });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Erreur restore : ' + err.message });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log('==================================================');
  console.log('🚀 SSK PACK en ligne !');
  console.log(`💻 Accès Local: http://localhost:${PORT}`);
  console.log(`🔒 Mot de passe Admin: ${ADMIN_PASSWORD}`);
  console.log(`💾 Données : ${DATA_DIR}`);
  console.log('==================================================');
});