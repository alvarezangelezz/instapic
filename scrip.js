/* ==========================================================================
   INSTAPIC - LÓGICA PRINCIPAL (ÁLBUMES, FILTROS CANVAS Y DESCARGAS)
   ========================================================================== */

// --- Base de Datos En Memoria (Inicial) ---
let albums = [
  { id: 'favoritos', name: 'Favoritos', icon: 'fa-heart' },
  { id: 'viajes', name: 'Viajes', icon: 'fa-plane' },
  { id: 'eventos', name: 'Eventos', icon: 'fa-calendar-star' }
];

let photos = [
  {
    id: 'p1',
    title: 'Atardecer en la Playa',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    albumId: 'viajes'
  },
  {
    id: 'p2',
    title: 'Montañas Nevadas',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    albumId: 'viajes'
  },
  {
    id: 'p3',
    title: 'Luces de la Ciudad',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
    albumId: 'favoritos'
  }
];

let currentAlbumId = 'all';
let selectedPhotoId = null;

// Parámetros de Filtros Actuales
let currentFilters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  sepia: 0,
  blur: 0
};

// --- Referencias al DOM ---
const photosGrid = document.getElementById('photosGrid');
const albumList = document.getElementById('albumList');
const currentAlbumName = document.getElementById('currentAlbumName');
const currentPhotosCount = document.getElementById('currentPhotosCount');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const fileUploadInput = document.getElementById('fileUploadInput');
const btnNewAlbum = document.getElementById('btnNewAlbum');

// Modales
const editorModal = document.getElementById('editorModal');
const btnCloseEditor = document.getElementById('btnCloseEditor');
const editorCanvas = document.getElementById('editorCanvas');
const ctx = editorCanvas.getContext('2d');

const moveModal = document.getElementById('moveModal');
const btnCloseMove = document.getElementById('btnCloseMove');
const moveAlbumSelect = document.getElementById('moveAlbumSelect');
const btnConfirmMove = document.getElementById('btnConfirmMove');
const btnCancelMove = document.getElementById('btnCancelMove');

// Sliders de Filtro
const sliderBrightness = document.getElementById('sliderBrightness');
const sliderContrast = document.getElementById('sliderContrast');
const sliderSaturate = document.getElementById('sliderSaturate');
const sliderSepia = document.getElementById('sliderSepia');
const sliderBlur = document.getElementById('sliderBlur');

const btnResetFilters = document.getElementById('btnResetFilters');
const btnSaveEdited = document.getElementById('btnSaveEdited');
const btnDownloadCurrent = document.getElementById('btnDownloadCurrent');

let loadedImageObject = new Image();

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
  renderSidebarAlbums();
  renderGallery();
  setupEventListeners();
});

// --- Renders ---
function renderSidebarAlbums() {
  // Limpiar lista preservando los fijos (Todas y Favoritos)
  albumList.innerHTML = `
    <li class="album-item ${currentAlbumId === 'all' ? 'active' : ''}" data-album-id="all">
      <div class="album-info"><i class="fa-solid fa-border-all"></i> <span>Todas las fotos</span></div>
      <span class="album-count">${photos.length}</span>
    </li>
  `;

  albums.forEach(alb => {
    const count = photos.filter(p => p.albumId === alb.id).length;
    const li = document.createElement('li');
    li.className = `album-item ${currentAlbumId === alb.id ? 'active' : ''}`;
    li.dataset.albumId = alb.id;
    li.innerHTML = `
      <div class="album-info"><i class="fa-solid ${alb.icon || 'fa-folder'}"></i> <span>${alb.name}</span></div>
      <span class="album-count">${count}</span>
    `;
    albumList.appendChild(li);
  });
}

function renderGallery() {
  const query = searchInput.value.toLowerCase().trim();
  
  // Filtrado por álbum y por búsqueda
  let filtered = photos.filter(photo => {
    const matchesAlbum = (currentAlbumId === 'all') || (photo.albumId === currentAlbumId);
    const matchesQuery = photo.title.toLowerCase().includes(query);
    return matchesAlbum && matchesQuery;
  });

  // Nombre del título
  if (currentAlbumId === 'all') {
    currentAlbumName.textContent = 'Todas las fotos';
  } else {
    const alb = albums.find(a => a.id === currentAlbumId);
    currentAlbumName.textContent = alb ? alb.name : 'Álbum';
  }
  
  currentPhotosCount.textContent = `${filtered.length} foto(s)`;

  photosGrid.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    filtered.forEach(photo => {
      const card = createPhotoCard(photo);
      photosGrid.appendChild(card);
    });
  }
}

function createPhotoCard(photo) {
  const card = document.createElement('div');
  card.className = 'photo-card';
  card.innerHTML = `
    <div class="card-img-wrapper">
      <img src="${photo.url}" alt="${photo.title}">
      <div class="card-overlay">
        <button class="btn-icon btn-edit" title="Editar Filtros"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
        <button class="btn-icon btn-move" title="Mover de Álbum"><i class="fa-solid fa-folder-arrow-up"></i></button>
        <button class="btn-icon btn-download" title="Descargar"><i class="fa-solid fa-download"></i></button>
        <button class="btn-icon btn-delete" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
    <div class="card-info">
      <span class="card-title">${photo.title}</span>
    </div>
  `;

  // Eventos de botones
  card.querySelector('.btn-edit').addEventListener('click', () => openEditor(photo.id));
  card.querySelector('.btn-move').addEventListener('click', () => openMoveModal(photo.id));
  card.querySelector('.btn-download').addEventListener('click', () => downloadPhoto(photo));
  card.querySelector('.btn-delete').addEventListener('click', () => deletePhoto(photo.id));

  return card;
}

// --- Gestión de Eventos y Carga ---
function setupEventListeners() {
  // Cambio de Álbum activo
  albumList.addEventListener('click', (e) => {
    const item = e.target.closest('.album-item');
    if (!item) return;
    currentAlbumId = item.dataset.albumId;
    renderSidebarAlbums();
    renderGallery();
  });

  // Crear nuevo álbum
  btnNewAlbum.addEventListener('click', () => {
    const name = prompt('Nombre del nuevo álbum:');
    if (name && name.trim()) {
      const newId = 'alb_' + Date.now();
      albums.push({ id: newId, name: name.trim(), icon: 'fa-folder' });
      renderSidebarAlbums();
    }
  });

  // Búsqueda
  searchInput.addEventListener('input', renderGallery);

  // Subida de Archivos Local (Phone / PC)
  fileUploadInput.addEventListener('change', handleFileUpload);

  // Modales
  btnCloseEditor.addEventListener('click', () => editorModal.classList.add('hidden'));
  btnCloseMove.addEventListener('click', () => moveModal.classList.add('hidden'));
  btnCancelMove.addEventListener('click', () => moveModal.classList.add('hidden'));

  // Aplicar movimiento
  btnConfirmMove.addEventListener('click', () => {
    const targetAlbumId = moveAlbumSelect.value;
    const photo = photos.find(p => p.id === selectedPhotoId);
    if (photo) {
      photo.albumId = targetAlbumId;
      renderSidebarAlbums();
      renderGallery();
      moveModal.classList.add('hidden');
    }
  });

  // Controles del Editor
  setupEditorListeners();
}

// Subida de fotos local
function handleFileUpload(e) {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newPhoto = {
        id: 'img_' + Date.now() + Math.random().toString(36).substr(2, 4),
        title: file.name.split('.')[0] || 'Nueva Foto',
        url: event.target.result,
        albumId: currentAlbumId === 'all' ? 'favoritos' : currentAlbumId
      };
      photos.unshift(newPhoto);
      renderSidebarAlbums();
      renderGallery();
    };
    reader.readAsDataURL(file);
  });
}

// --- Modal de Editor & Canvas ---
function openEditor(photoId) {
  selectedPhotoId = photoId;
  const photo = photos.find(p => p.id === photoId);
  if (!photo) return;

  resetFilters();
  editorModal.classList.remove('hidden');

  loadedImageObject = new Image();
  loadedImageObject.crossOrigin = 'anonymous';
  loadedImageObject.src = photo.url;
  loadedImageObject.onload = () => {
    drawCanvas();
  };
}

function drawCanvas() {
  if (!loadedImageObject.src) return;

  editorCanvas.width = loadedImageObject.naturalWidth || 800;
  editorCanvas.height = loadedImageObject.naturalHeight || 600;

  // Cadena de filtro CSS para Canvas
  ctx.filter = `
    brightness(${currentFilters.brightness}%)
    contrast(${currentFilters.contrast}%)
    saturate(${currentFilters.saturate}%)
    sepia(${currentFilters.sepia}%)
    blur(${currentFilters.blur}px)
  `;

  ctx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
  ctx.drawImage(loadedImageObject, 0, 0, editorCanvas.width, editorCanvas.height);
}

function setupEditorListeners() {
  // Sliders
  const updateFilter = () => {
    currentFilters.brightness = sliderBrightness.value;
    currentFilters.contrast = sliderContrast.value;
    currentFilters.saturate = sliderSaturate.value;
    currentFilters.sepia = sliderSepia.value;
    currentFilters.blur = sliderBlur.value;

    document.getElementById('valBrightness').textContent = `${currentFilters.brightness}%`;
    document.getElementById('valContrast').textContent = `${currentFilters.contrast}%`;
    document.getElementById('valSaturate').textContent = `${currentFilters.saturate}%`;
    document.getElementById('valSepia').textContent = `${currentFilters.sepia}%`;
    document.getElementById('valBlur').textContent = `${currentFilters.blur}px`;

    drawCanvas();
  };

  [sliderBrightness, sliderContrast, sliderSaturate, sliderSepia, sliderBlur].forEach(s => {
    s.addEventListener('input', updateFilter);
  });

  // Presets Rápidos
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const preset = btn.dataset.preset;
      resetFilters(false);

      if (preset === 'vintage') {
        currentFilters.sepia = 50;
        currentFilters.contrast = 120;
        currentFilters.brightness = 90;
      } else if (preset === 'bw') {
        currentFilters.saturate = 0;
        currentFilters.contrast = 130;
      } else if (preset === 'warm') {
        currentFilters.sepia = 30;
        currentFilters.brightness = 110;
      } else if (preset === 'cool') {
        currentFilters.contrast = 110;
        currentFilters.brightness = 105;
      } else if (preset === 'dramatic') {
        currentFilters.contrast = 160;
        currentFilters.saturate = 140;
      }

      syncSlidersUI();
      drawCanvas();
    });
  });

  btnResetFilters.addEventListener('click', () => {
    resetFilters();
    drawCanvas();
  });

  // Guardar imagen con filtros en la app
  btnSaveEdited.addEventListener('click', () => {
    const dataUrl = editorCanvas.toDataURL('image/jpeg', 0.9);
    const photo = photos.find(p => p.id === selectedPhotoId);
    if (photo) {
      photo.url = dataUrl;
      renderGallery();
      editorModal.classList.add('hidden');
    }
  });

  // Descargar foto editada directo al dispositivo
  btnDownloadCurrent.addEventListener('click', () => {
    const dataUrl = editorCanvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `InstaPic_${Date.now()}.jpg`;
    a.click();
  });
}

function resetFilters(updateCanvas = true) {
  currentFilters = { brightness: 100, contrast: 100, saturate: 100, sepia: 0, blur: 0 };
  syncSlidersUI();
  if (updateCanvas) drawCanvas();
}

function syncSlidersUI() {
  sliderBrightness.value = currentFilters.brightness;
  sliderContrast.value = currentFilters.contrast;
  sliderSaturate.value = currentFilters.saturate;
  sliderSepia.value = currentFilters.sepia;
  sliderBlur.value = currentFilters.blur;

  document.getElementById('valBrightness').textContent = `${currentFilters.brightness}%`;
  document.getElementById('valContrast').textContent = `${currentFilters.contrast}%`;
  document.getElementById('valSaturate').textContent = `${currentFilters.saturate}%`;
  document.getElementById('valSepia').textContent = `${currentFilters.sepia}%`;
  document.getElementById('valBlur').textContent = `${currentFilters.blur}px`;
}

// --- Mover Foto ---
function openMoveModal(photoId) {
  selectedPhotoId = photoId;
  moveAlbumSelect.innerHTML = '';

  albums.forEach(alb => {
    const option = document.createElement('option');
    option.value = alb.id;
    option.textContent = alb.name;
    moveAlbumSelect.appendChild(option);
  });

  moveModal.classList.remove('hidden');
}

// --- Descargar / Eliminar ---
function downloadPhoto(photo) {
  const a = document.createElement('a');
  a.href = photo.url;
  a.download = `${photo.title}.jpg`;
  a.click();
}

function deletePhoto(photoId) {
  if (confirm('¿Seguro que deseas eliminar esta imagen?')) {
    photos = photos.filter(p => p.id !== photoId);
    renderSidebarAlbums();
    renderGallery();
  }
}