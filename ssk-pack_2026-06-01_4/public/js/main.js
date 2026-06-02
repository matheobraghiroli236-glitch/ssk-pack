// État global de l'application
let packs = [];
let activeCategory = 'all';

// ── Favoris (stockés localement) ────────────────────────────────────────────
const FAV_KEY = 'ssk_favorites';
function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
}
function isFavorite(id) { return getFavorites().includes(id); }
function toggleFavorite(id) {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx === -1) { favs.push(id); } else { favs.splice(idx, 1); }
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  return idx === -1; // true = ajouté, false = retiré
}

// Éléments DOM
const searchInput = document.getElementById('searchInput');
const versionFilter = document.getElementById('versionFilter');
const resFilter = document.getElementById('resFilter');
const sortSelect = document.getElementById('sortSelect');
const categoryContainer = document.getElementById('categoryContainer');
const packsGrid = document.getElementById('packsGrid');

// Éléments de la Modale
const modalOverlay = document.getElementById('detailModalOverlay');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalPackName = document.getElementById('modalPackName');
const modalDescription = document.getElementById('modalDescription');
const modalImage = document.getElementById('modalImage');
const modalVideo = document.getElementById('modalVideo');
const modalVersions = document.getElementById('modalVersions');
const modalTags = document.getElementById('modalTags');
const modalCreator = document.getElementById('modalCreator');
const modalResolution = document.getElementById('modalResolution');
const modalCategory = document.getElementById('modalCategory');
const modalDownloads = document.getElementById('modalDownloads');
const modalLikes = document.getElementById('modalLikes');
const modalDlBtn = document.getElementById('modalDlBtn');

// Charger les packs au démarrage
document.addEventListener('DOMContentLoaded', () => {
  fetchPacks();
  setupEventListeners();
});

// Récupérer la liste des packs depuis l'API
async function fetchPacks() {
  try {
    const response = await fetch('/api/packs');
    if (!response.ok) throw new Error('Impossible de charger les packs.');
    packs = await response.json();
    renderCatalog();
  } catch (error) {
    console.error('Erreur lors du chargement des packs:', error);
    packsGrid.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-red)"></i>
        <p>Erreur lors du chargement des packs. Assurez-vous que le serveur tourne correctement.</p>
      </div>
    `;
  }
}

// Configurer les écouteurs d'événements
function setupEventListeners() {
  // Filtres
  searchInput.addEventListener('input', renderCatalog);
  versionFilter.addEventListener('change', renderCatalog);
  resFilter.addEventListener('change', renderCatalog);
  sortSelect.addEventListener('change', renderCatalog);

  // Boutons de catégorie
  categoryContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('cat-pill')) {
      categoryContainer.querySelectorAll('.cat-pill').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      activeCategory = e.target.dataset.category;
      renderCatalog();
    }
  });

  // Fermer la modale
  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Fermer avec la touche Echap
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// Filtrer et trier les packs, puis les afficher
function renderCatalog() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedVersion = versionFilter.value;
  const selectedResolution = resFilter.value;
  const selectedSort = sortSelect.value;

  // 1. Filtrer
  let filteredPacks = packs.filter(pack => {
    // Filtre de recherche
    const matchesSearch = 
      pack.name.toLowerCase().includes(searchTerm) ||
      pack.creator.toLowerCase().includes(searchTerm) ||
      pack.description.toLowerCase().includes(searchTerm) ||
      pack.tags.some(tag => tag.toLowerCase().includes(searchTerm));

    // Filtre de catégorie (avec support Favoris)
    const matchesCategory = activeCategory === 'all'
      || (activeCategory === 'favoris' ? isFavorite(pack.id) : pack.category === activeCategory);

    // Filtre de version
    const matchesVersion = selectedVersion === 'all' || pack.versions.includes(selectedVersion);

    // Filtre de résolution
    const matchesResolution = selectedResolution === 'all' || pack.resolution === selectedResolution;

    // Filtre de pays
    return matchesSearch && matchesCategory && matchesVersion && matchesResolution;
  });

  // 2. Trier
  if (selectedSort === 'latest') {
    filteredPacks.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
  } else if (selectedSort === 'downloads') {
    filteredPacks.sort((a, b) => b.downloads - a.downloads);
  } else if (selectedSort === 'likes') {
    filteredPacks.sort((a, b) => b.likes - a.likes);
  }

  // 3. Afficher
  if (filteredPacks.length === 0) {
    packsGrid.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-magnifying-glass"></i>
        <p>Aucun pack de texture ne correspond à vos filtres de recherche.</p>
      </div>
    `;
    return;
  }

  packsGrid.innerHTML = filteredPacks.map((pack, i) => createCardHTML(pack, i)).join('');

  // Associer les événements sur les boutons des cartes générées
  attachCardEvents();
}

// Générer le code HTML d'une carte de pack
function createCardHTML(pack, index = 0) {
  const delay = Math.min(index * 0.06, 0.5).toFixed(2);
  const versionsBadges = pack.versions.map(v => `<span class="ver-badge">${v}</span>`).join('');
  const fav = isFavorite(pack.id);
  const heartIcon = fav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
  const favClass = fav ? ' is-favorited' : '';
  
  // Pour Overlay (et Sky) : si pas de thumbnail mais une vidéo, afficher la vidéo en preview
  const hasVideo = (pack.category === 'Overlay' || pack.category === 'Sky') && pack.previewVideoUrl;
  const hasThumb = pack.thumbnailUrl && pack.thumbnailUrl !== '/uploads/screenshots/default-thumb.jpg';
  const showVideo = hasVideo && !hasThumb;

  const mediaHTML = showVideo
    ? '<video src="' + pack.previewVideoUrl + '" muted autoplay loop playsinline style="width:100%;height:100%;object-fit:cover;"></video>'
    : '<img src="' + pack.thumbnailUrl + '" alt="' + pack.name + '" onerror="this.src=\'/uploads/screenshots/default-thumb.jpg\'">';

  return `
    <article class="pack-card" data-id="${pack.id}" style="animation-delay:${delay}s">
      <div class="card-image-wrapper">
        <span class="resolution-tag">${pack.resolution}</span>
        <span class="category-tag">${pack.category}</span>
        ` + mediaHTML + `
      </div>
      <div class="card-body">
        <div class="card-header-info">
          <h3 class="pack-title">${pack.name}</h3>
        </div>
        <p class="pack-creator">Par <span>${pack.creator}</span></p>
        <p class="pack-description">${pack.description}</p>
        <div class="versions-list">
          ${versionsBadges}
        </div>
        <div class="card-footer">
          <div class="stats-container">
            <div class="stat-item" title="Téléchargements">
              <i class="fa-solid fa-download"></i>
              <span class="dl-count-${pack.id}">${pack.downloads}</span>
            </div>
            <div class="stat-item" title="Abonnés / Likes">
              <i class="fa-solid fa-heart"></i>
              <span class="like-count-${pack.id}">${pack.likes}</span>
            </div>
          </div>
          <div class="card-actions">
            <button type="button" class="btn-card-icon like-btn${favClass}" data-id="${pack.id}" aria-label="Ajouter aux favoris" title="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
              <i class="${heartIcon}"></i>
            </button>
            <button type="button" class="btn-card-icon info-btn" data-id="${pack.id}" aria-label="Plus d'informations">
              <i class="fa-solid fa-circle-info"></i>
            </button>
            <button type="button" class="btn-card-dl dl-btn" data-id="${pack.id}">
              <i class="fa-solid fa-download"></i>
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

// Associer les clics sur les boutons des cartes
function attachCardEvents() {
  // Clic sur l'icône Info (Ouvrir la modale)
  document.querySelectorAll('.info-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const packId = btn.dataset.id;
      const pack = packs.find(p => p.id === packId);
      if (pack) openModal(pack);
    });
  });

  // Clic sur toute la carte (sauf boutons d'action) pour ouvrir la modale
  document.querySelectorAll('.pack-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Ignorer si on a cliqué sur un bouton d'action ou ses icônes
      if (e.target.closest('.card-actions') || e.target.closest('.btn-card-dl')) return;
      const packId = card.dataset.id;
      const pack = packs.find(p => p.id === packId);
      if (pack) openModal(pack);
    });
  });

  // Clic sur Like (toggle favori local)
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const packId = btn.dataset.id;

      const added = toggleFavorite(packId);
      const heartIcon = btn.querySelector('i');

      if (added) {
        heartIcon.className = 'fa-solid fa-heart';
        btn.classList.add('is-favorited');
        btn.title = 'Retirer des favoris';
        // Animation pop
        btn.style.transform = 'scale(1.3)';
        setTimeout(() => btn.style.transform = '', 200);
      } else {
        heartIcon.className = 'fa-regular fa-heart';
        btn.classList.remove('is-favorited');
        btn.title = 'Ajouter aux favoris';
        // Si on est dans le filtre Favoris, retirer la carte
        if (activeCategory === 'favoris') {
          const card = btn.closest('article');
          if (card) {
            card.style.transition = 'opacity 0.3s, transform 0.3s';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => renderCatalog(), 320);
          }
        }
      }
    });
  });

  // Clic sur Télécharger (carte)
  document.querySelectorAll('.dl-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const packId = btn.dataset.id;
      openRenamePopup(packId);
    });
  });
}

// Déclencher le téléchargement d'un pack et mettre à jour le compteur
// Popup de renommage avant téléchargement
// ── Icônes pack.png prédéfinies ─────────────────────────────────────────────
const PACK_ICONS = [
  // Épée rouge
  { id:'sword',    label:'Épée',      svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1a0a0e"/><line x1="8" y1="24" x2="24" y2="8" stroke="#ff2a4b" stroke-width="3" stroke-linecap="round"/><line x1="12" y1="22" x2="10" y2="24" stroke="#ff2a4b" stroke-width="2"/><circle cx="24" cy="8" r="2.5" fill="#ff2a4b"/><line x1="11" y1="17" x2="15" y2="13" stroke="rgba(255,42,75,0.4)" stroke-width="1.5"/></svg>` },
  // Bouclier
  { id:'shield',   label:'Bouclier',  svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0a0e1a"/><path d="M16 5 L27 9 L27 17 Q27 24 16 28 Q5 24 5 17 L5 9 Z" fill="none" stroke="#4a9eff" stroke-width="2"/><path d="M16 10 L22 13 L22 18 Q22 22 16 25 Q10 22 10 18 L10 13 Z" fill="rgba(74,158,255,0.15)"/></svg>` },
  // Diamant
  { id:'diamond',  label:'Diamant',   svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#071a1a"/><polygon points="16,5 26,13 16,27 6,13" fill="none" stroke="#00e5ff" stroke-width="2"/><polygon points="16,5 26,13 16,14 6,13" fill="rgba(0,229,255,0.2)"/><line x1="6" y1="13" x2="26" y2="13" stroke="#00e5ff" stroke-width="1.5"/></svg>` },
  // Feu
  { id:'fire',     label:'Feu',       svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1a0a00"/><path d="M16 26 Q8 22 9 15 Q10 10 14 8 Q12 13 15 14 Q13 9 18 5 Q17 12 21 13 Q24 14 23 18 Q22 22 16 26Z" fill="none" stroke="#ff6a00" stroke-width="1.5"/><path d="M16 26 Q9 22 10 16 Q11 12 14 10 Q13 14 16 15 Q18 11 20 14 Q22 16 21 19 Q20 22 16 26Z" fill="rgba(255,106,0,0.25)"/></svg>` },
  // Crâne
  { id:'skull',    label:'Crâne',     svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0d0d0d"/><ellipse cx="16" cy="14" rx="9" ry="8" fill="none" stroke="#e0e0e0" stroke-width="1.8"/><rect x="10" y="20" width="12" height="6" rx="1" fill="none" stroke="#e0e0e0" stroke-width="1.5"/><circle cx="12.5" cy="14" r="2.5" fill="#e0e0e0"/><circle cx="19.5" cy="14" r="2.5" fill="#e0e0e0"/><line x1="14" y1="22" x2="14" y2="26" stroke="#e0e0e0" stroke-width="1.5"/><line x1="18" y1="22" x2="18" y2="26" stroke="#e0e0e0" stroke-width="1.5"/></svg>` },
  // Étoile
  { id:'star',     label:'Étoile',    svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0e0e00"/><polygon points="16,4 19.5,13 29,13 21.5,18.5 24.5,28 16,22.5 7.5,28 10.5,18.5 3,13 12.5,13" fill="none" stroke="#ffd700" stroke-width="1.8"/><polygon points="16,8 18.5,14 25,14 19.8,17.8 22,24 16,20 10,24 12.2,17.8 7,14 13.5,14" fill="rgba(255,215,0,0.2)"/></svg>` },
  // Cube Minecraft
  { id:'cube',     label:'Cube',      svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0a1a0a"/><rect x="9" y="12" width="11" height="11" fill="none" stroke="#5dff5d" stroke-width="1.8"/><polygon points="9,12 15,7 26,7 20,12" fill="none" stroke="#5dff5d" stroke-width="1.5"/><polygon points="20,12 26,7 26,18 20,23" fill="rgba(93,255,93,0.15)" stroke="#5dff5d" stroke-width="1.5"/></svg>` },
  // Éclair
  { id:'bolt',     label:'Éclair',    svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0e0e1a"/><polygon points="19,4 10,18 16,18 13,28 22,14 16,14" fill="none" stroke="#a855f7" stroke-width="2"/><polygon points="19,4 11,18 16,18 13,28 22,14 16,14" fill="rgba(168,85,247,0.2)"/></svg>` },
  // Cible
  { id:'target',   label:'Cible',     svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1a0505"/><circle cx="16" cy="16" r="10" fill="none" stroke="#ff2a4b" stroke-width="1.8"/><circle cx="16" cy="16" r="6" fill="none" stroke="#ff2a4b" stroke-width="1.5"/><circle cx="16" cy="16" r="2.5" fill="#ff2a4b"/><line x1="16" y1="4" x2="16" y2="8" stroke="#ff2a4b" stroke-width="1.5"/><line x1="16" y1="24" x2="16" y2="28" stroke="#ff2a4b" stroke-width="1.5"/><line x1="4" y1="16" x2="8" y2="16" stroke="#ff2a4b" stroke-width="1.5"/><line x1="24" y1="16" x2="28" y2="16" stroke="#ff2a4b" stroke-width="1.5"/></svg>` },
  // Couronne
  { id:'crown',    label:'Couronne',  svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1a1000"/><polygon points="5,22 5,12 11,17 16,8 21,17 27,12 27,22" fill="none" stroke="#ffd700" stroke-width="2"/><rect x="5" y="22" width="22" height="3" rx="1" fill="none" stroke="#ffd700" stroke-width="1.8"/><circle cx="16" cy="8" r="1.5" fill="#ffd700"/><circle cx="5" cy="12" r="1.5" fill="#ffd700"/><circle cx="27" cy="12" r="1.5" fill="#ffd700"/></svg>` },
  // Potion
  { id:'potion',   label:'Potion',    svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0a001a"/><rect x="13" y="4" width="6" height="5" rx="1" fill="none" stroke="#c084fc" stroke-width="1.8"/><path d="M11 9 Q8 14 9 20 Q10 26 16 26 Q22 26 23 20 Q24 14 21 9Z" fill="none" stroke="#c084fc" stroke-width="1.8"/><path d="M11 9 Q8 14 9 20 Q10 26 16 26 Q22 26 23 20 Q24 14 21 9Z" fill="rgba(192,132,252,0.15)"/><circle cx="13" cy="18" r="1.5" fill="rgba(192,132,252,0.6)"/><circle cx="18" cy="21" r="1" fill="rgba(192,132,252,0.6)"/></svg>` },
  // Croix / Soin
  { id:'cross',    label:'Soin',      svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#001a0a"/><rect x="13" y="6" width="6" height="20" rx="2" fill="none" stroke="#00ff88" stroke-width="2"/><rect x="6" y="13" width="20" height="6" rx="2" fill="none" stroke="#00ff88" stroke-width="2"/></svg>` },
];

let _selectedIconId = null;

// ── Popup de renommage avant téléchargement ──────────────────────────────────
const renameModalOverlay = document.getElementById('renameModalOverlay');
const renameInput = document.getElementById('renameInput');
const renameExt = document.getElementById('renameExt');
const renameConfirmBtn = document.getElementById('renameConfirmBtn');
const renameCancelBtn = document.getElementById('renameCancelBtn');
const renameModalClose = document.getElementById('renameModalClose');

let _pendingDownloadId = null;

function openRenamePopup(packId) {
  const pack = packs.find(p => p.id === packId);
  if (!pack) return;
  _pendingDownloadId = packId;

  // Pré-remplir avec le nom du pack, nettoyé pour un nom de fichier
  const cleanName = pack.name.replace(/[^a-zA-Z0-9_\-. ]/g, '').trim() || 'pack';
  const isExternal = pack.isExternal || pack.downloadUrl.startsWith('http');
  const ext = isExternal ? '' : '.zip';
  renameInput.value = cleanName;
  renameExt.textContent = ext;
  renameExt.style.display = ext ? '' : 'none';

  // Générer la grille d'icônes
  const iconGrid = document.getElementById('iconGrid');
  const iconLabel = document.getElementById('iconSelectedLabel');
  _selectedIconId = null;
  iconLabel.textContent = 'Aucune icône sélectionnée — le pack.png original sera conservé';
  iconGrid.innerHTML = PACK_ICONS.map(icon => `
    <button type="button" class="icon-pick-btn" data-icon-id="${icon.id}" title="${icon.label}"
      style="background:var(--bg-tertiary);border:2px solid rgba(255,255,255,0.07);border-radius:8px;padding:6px;cursor:pointer;transition:all 0.2s;aspect-ratio:1;">
      ${icon.svg}
    </button>
  `).join('');

  iconGrid.querySelectorAll('.icon-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      iconGrid.querySelectorAll('.icon-pick-btn').forEach(b => {
        b.style.borderColor = 'rgba(255,255,255,0.07)';
        b.style.background = 'var(--bg-tertiary)';
      });
      if (_selectedIconId === btn.dataset.iconId) {
        // Désélectionner si re-clic
        _selectedIconId = null;
        iconLabel.textContent = 'Aucune icône sélectionnée — le pack.png original sera conservé';
      } else {
        _selectedIconId = btn.dataset.iconId;
        btn.style.borderColor = 'var(--accent-red)';
        btn.style.background = 'rgba(255,42,75,0.1)';
        const icon = PACK_ICONS.find(i => i.id === _selectedIconId);
        iconLabel.textContent = `Icône sélectionnée : ${icon.label}`;
      }
    });
  });

  renameModalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => renameInput.select(), 100);
}

function closeRenamePopup() {
  renameModalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  _pendingDownloadId = null;
  _selectedIconId = null;
}

renameModalClose.addEventListener('click', closeRenamePopup);
renameCancelBtn.addEventListener('click', closeRenamePopup);
renameModalOverlay.addEventListener('click', (e) => { if (e.target === renameModalOverlay) closeRenamePopup(); });
renameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') renameConfirmBtn.click(); });

renameConfirmBtn.addEventListener('click', () => {
  if (!_pendingDownloadId) return;
  const customName = renameInput.value.trim() || 'pack';
  const id = _pendingDownloadId;
  closeRenamePopup();
  triggerDownload(id, customName);
});

function triggerDownload(packId, customFileName) {
  return _triggerDownload(packId, customFileName);
}

async function _triggerDownload(packId, customFileName) {
  try {
    const response = await fetch(`/api/packs/download/${packId}`, { method: 'POST' });
    if (!response.ok) throw new Error('Impossible d\'initier le téléchargement.');
    
    const data = await response.json();
    
    // Mettre à jour l'état local
    const packIndex = packs.findIndex(p => p.id === packId);
    if (packIndex !== -1) {
      packs[packIndex].downloads = data.downloads;
      document.querySelectorAll(`.dl-count-${packId}`).forEach(el => el.innerText = data.downloads);
      if (document.getElementById('detailModalOverlay').classList.contains('active')) {
        modalDownloads.innerText = data.downloads;
      }
    }
    
    // Télécharger avec le nom personnalisé
    if (data.url.startsWith('http://') || data.url.startsWith('https://')) {
      window.open(data.url, '_blank');
    } else {
      const ext = data.url.substring(data.url.lastIndexOf('.')) || '.zip';
      const filename = (customFileName || 'pack') + ext;
      const link = document.createElement('a');
      link.href = data.url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error('Erreur lors du téléchargement:', err);
    alert('Impossible de télécharger le pack pour le moment.');
  }
}

// Ouvrir la fenêtre modale
function openModal(pack) {
  modalPackName.innerText = pack.name;
  modalDescription.innerText = pack.description;

  // Gérer la prévisualisation : vidéo pour Sky, image sinon
  modalImage.style.display = 'none';
  modalVideo.style.display = 'none';
  modalVideo.src = '';

  // Sky et Overlay : vidéo si pas de thumbnail, sinon image
  const _hasVideo = (pack.category === 'Sky' || pack.category === 'Overlay') && pack.previewVideoUrl;
  const _hasThumb = pack.thumbnailUrl && pack.thumbnailUrl !== '/uploads/screenshots/default-thumb.jpg';

  if (_hasVideo && !_hasThumb) {
    modalVideo.style.display = 'block';
    modalVideo.src = pack.previewVideoUrl;
    modalVideo.load();
  } else {
    modalImage.style.display = 'block';
    modalImage.src = pack.thumbnailUrl || '/uploads/screenshots/default-thumb.jpg';
    modalImage.onerror = () => { modalImage.src = '/uploads/screenshots/default-thumb.jpg'; };
  }
  
  modalCreator.innerText = pack.creator;
  modalResolution.innerText = pack.resolution;
  modalCategory.innerText = pack.category;
  modalDownloads.innerText = pack.downloads;
  modalLikes.innerText = pack.likes;

  // Vider et remplir les versions compatibles
  modalVersions.innerHTML = pack.versions.map(v => `<span class="ver-badge">${v}</span>`).join('');
  
  // Vider et remplir les tags
  modalTags.innerHTML = pack.tags.length > 0 
    ? pack.tags.map(t => `<span class="ver-badge" style="border-color: rgba(255,42,75,0.2); color: var(--accent-red);">${t}</span>`).join('')
    : '<span class="ver-badge" style="color: var(--text-muted)">Aucun tag</span>';

  // Configurer le bouton de téléchargement de la modale
  modalDlBtn.onclick = () => openRenamePopup(pack.id);

  // Afficher l'overlay
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden'; // Bloquer le défilement
}

// Fermer la modale
function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = ''; // Rétablir le défilement
  // Stopper la vidéo si elle est en lecture
  if (modalVideo) {
    modalVideo.pause();
    modalVideo.src = '';
  }
}
