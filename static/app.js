// State
let files = []; // Array of { file: File, objectUrl: string }

// DOM elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const previewSection = document.getElementById('preview-section');
const previewList = document.getElementById('preview-list');
const imageCount = document.getElementById('image-count');
const clearBtn = document.getElementById('clear-btn');
const convertBtn = document.getElementById('convert-btn');
const btnText = document.getElementById('btn-text');
const btnSpinner = document.getElementById('btn-spinner');
const errorMsg = document.getElementById('error-msg');
const slidesResult = document.getElementById('slides-result');
const slidesLink = document.getElementById('slides-link');
const marginInput = document.getElementById('margin');
const marginValue = document.getElementById('margin-value');
const layoutSelect = document.getElementById('layout');
const marginGroup = document.getElementById('margin-group');

// Margin slider display
marginInput.addEventListener('input', () => {
  marginValue.textContent = marginInput.value;
});

// Hide margin slider when layout is 'fit' (margin=0) or 'fill'
layoutSelect.addEventListener('change', () => {
  if (layoutSelect.value === 'fit' || layoutSelect.value === 'fill') {
    marginGroup.style.opacity = '0.4';
    marginGroup.style.pointerEvents = 'none';
  } else {
    marginGroup.style.opacity = '1';
    marginGroup.style.pointerEvents = '';
  }
});

// File input change
fileInput.addEventListener('change', () => {
  addFiles(Array.from(fileInput.files));
  fileInput.value = '';
});

// Dropzone click
dropzone.addEventListener('click', () => fileInput.click());

// Drag & drop on dropzone
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('drag-over');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('drag-over');
  const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  addFiles(dropped);
});

// Clear all
clearBtn.addEventListener('click', () => {
  files.forEach(f => URL.revokeObjectURL(f.objectUrl));
  files = [];
  renderList();
});

// Output format change: update button label
document.querySelectorAll('input[name="output_format"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const isGoogleSlides = document.querySelector('input[name="output_format"]:checked').value === 'google_slides';
    btnText.textContent = isGoogleSlides ? 'Google Slidesに変換' : '変換してダウンロード';
    slidesResult.classList.add('hidden');
  });
});

// Convert
convertBtn.addEventListener('click', doConvert);

function addFiles(newFiles) {
  const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
  imageFiles.forEach(f => {
    files.push({ file: f, objectUrl: URL.createObjectURL(f) });
  });
  renderList();
}

function removeFile(index) {
  URL.revokeObjectURL(files[index].objectUrl);
  files.splice(index, 1);
  renderList();
}

function renderList() {
  previewList.innerHTML = '';
  imageCount.textContent = files.length;

  if (files.length === 0) {
    previewSection.classList.add('hidden');
    convertBtn.disabled = true;
    return;
  }

  previewSection.classList.remove('hidden');
  convertBtn.disabled = false;

  files.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'preview-item';
    li.draggable = true;
    li.dataset.index = i;

    li.innerHTML = `
      <img class="preview-thumb" src="${item.objectUrl}" alt="${item.file.name}" />
      <span class="preview-name">${item.file.name}</span>
      <span class="preview-index">#${i + 1}</span>
      <button class="remove-btn" title="削除" data-index="${i}">✕</button>
    `;

    // Remove button
    li.querySelector('.remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFile(parseInt(e.currentTarget.dataset.index));
    });

    // Drag-to-reorder
    li.addEventListener('dragstart', onDragStart);
    li.addEventListener('dragover', onDragOver);
    li.addEventListener('dragleave', onDragLeave);
    li.addEventListener('drop', onDrop);
    li.addEventListener('dragend', onDragEnd);

    previewList.appendChild(li);
  });
}

// Drag-to-reorder logic
let dragSrcIndex = null;

function onDragStart(e) {
  dragSrcIndex = parseInt(e.currentTarget.dataset.index);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-target');
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-target');
}

function onDrop(e) {
  e.preventDefault();
  const targetIndex = parseInt(e.currentTarget.dataset.index);
  e.currentTarget.classList.remove('drag-target');
  if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;

  // Reorder
  const moved = files.splice(dragSrcIndex, 1)[0];
  files.splice(targetIndex, 0, moved);
  renderList();
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  dragSrcIndex = null;
  document.querySelectorAll('.preview-item').forEach(el => el.classList.remove('drag-target'));
}

async function doConvert() {
  if (files.length === 0) return;

  setLoading(true);
  hideError();
  slidesResult.classList.add('hidden');

  const outputFormat = document.querySelector('input[name="output_format"]:checked').value;

  const formData = new FormData();
  files.forEach(item => formData.append('files', item.file));
  formData.append('slide_size', document.getElementById('slide-size').value);
  formData.append('layout', layoutSelect.value);
  formData.append('margin', (parseInt(marginInput.value) / 100).toFixed(2));

  const titlePrefix = document.getElementById('title-prefix').value.trim();
  if (titlePrefix) {
    formData.append('title_prefix', titlePrefix);
  }

  const endpoint = outputFormat === 'google_slides' ? '/convert/google-slides' : '/convert';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`サーバーエラー (${response.status}): ${text}`);
    }

    if (outputFormat === 'google_slides') {
      const data = await response.json();
      slidesLink.href = data.url;
      slidesResult.classList.remove('hidden');
    } else {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'presentation.pptx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    showError(err.message || '変換中にエラーが発生しました');
  } finally {
    setLoading(false);
  }
}

function setLoading(loading) {
  const isGoogleSlides = document.querySelector('input[name="output_format"]:checked').value === 'google_slides';
  convertBtn.disabled = loading || files.length === 0;
  if (loading) {
    btnText.textContent = '変換中...';
  } else {
    btnText.textContent = isGoogleSlides ? 'Google Slidesに変換' : '変換してダウンロード';
  }
  btnSpinner.classList.toggle('hidden', !loading);
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
}

function hideError() {
  errorMsg.classList.add('hidden');
}
