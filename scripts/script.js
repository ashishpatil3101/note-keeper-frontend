const menuButton = document.querySelector('.menu-button');
const sidebar = document.querySelector('#sidebar');
const addNoteButton = document.querySelector('.add-note-button');
const addNoteSection = document.querySelector('#add-note-section');
const addNoteForm = document.getElementById('add-note-form');
const modal = document.getElementById('myModal');
const modalMessage = document.getElementById('modal-message');
const closeButton = document.querySelector('.close');
const notesContainer = document.getElementById('notes-container');
const allNotesSection = document.querySelector('#all-notes-section');
const trashButton = document.getElementById('trash-button');
const archiveButton = document.querySelector('.archive-button');
const allNotesButton = document.querySelector('.all-notes-button');
const viewHeader = document.querySelector('.view-header');
const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('search-input');
const sidebarMenu = document.getElementById('sidebar-menu');
const labelsSection = document.createElement('div'); // Container for labels
labelsSection.id = 'labels-section';
let currentFilter = 'all';

async function handleFetchResponse(response) {
  if (response.status === 401) {
    // Redirect to login page if unauthorized
    window.location.href = 'login.html'; 
    return;
  }
  return response.json();
}

menuButton.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

document.addEventListener('click', (event) => {
  if (!menuButton.contains(event.target) && !sidebar.contains(event.target)) {
    sidebar.classList.remove('open');
  }
});

function hideAddNoteSection() {
  addNoteSection.classList.remove('visible');
  allNotesSection.style.display = 'block';
}

addNoteButton.addEventListener('click', (event) => {
  event.preventDefault();
  addNoteSection.classList.add('visible');
  allNotesSection.style.display = 'none';
});

allNotesButton.addEventListener('click', async (event) => {
  event.preventDefault();
  hideAddNoteSection();
  await fetchNotes('all');
});

trashButton.addEventListener('click', async (event) => {
  event.preventDefault();
  hideAddNoteSection();
  await fetchNotes('trash');
});

archiveButton.addEventListener('click', async (event) => {
  event.preventDefault();
  hideAddNoteSection();
  await fetchNotes('archive');
});

searchButton.addEventListener('click', async () => {
  const query = searchInput.value;
  if (query) {
    hideAddNoteSection();
    await fetchNotes('search', query);
  }
});

addNoteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = document.getElementById('title').value;
  const text = document.getElementById('text').value;
  const color = document.getElementById('color').value;
  const tags = document.getElementById('tags').value.split(',');
  const labels = document.getElementById('labels').value.split(',');
  const reminderDate = document.getElementById('reminder-date').value;
  try {
    const response = await fetch('http://localhost:5000/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Add token to the request headers
      },
      body: JSON.stringify({ title, text, color, tags, labels, reminderDate }),
    });

    const savedNote = await handleFetchResponse(response);
    if (savedNote) {
      addNoteForm.reset();
      addNoteSection.classList.remove('visible');
      allNotesSection.style.display = 'block';
      showModal('Note saved successfully!');
      // await fetchNotes('all');
      await fetchLabels()
    }
  } catch (error) {
    console.error('Error saving note:', error);
    showModal('Failed to save note. Please try again later.');
  }
});

function showModal(message) {
  modalMessage.textContent = message;
  modal.style.display = 'block';
}

closeButton.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

document.addEventListener('click', async (event) => {
  if (event.target.closest('.move-to-trash-button')) {
    const button = event.target.closest('.move-to-trash-button');
    const noteId = button.dataset.noteId;
    if (currentFilter === 'trash') {
      const successMessage = `Note deleted successfully!`;
      const errorMessage = `Failed to delete note. Please try again later.`;
      await handleAction(`http://localhost:5000/api/notes/delete/${noteId}`, successMessage, errorMessage, 'DELETE');
    } else {
      const successMessage = `Note moved to trash successfully!`;
      const errorMessage = `Failed to move note to trash. Please try again later.`;
      await handleAction(`http://localhost:5000/api/notes/trash/${noteId}`, successMessage, errorMessage);
    }
  }
});

document.addEventListener('click', async (event) => {
  if (event.target.closest('.note-archive-button')) {
    const button = event.target.closest('.note-archive-button');
    const noteId = button.dataset.noteId;
    const successMessage = currentFilter === 'archive' ? `Note unarchived successfully!` : `Note archived successfully!`;
    const errorMessage = currentFilter === 'archive' ? `Failed to unarchive note. Please try again later.` : `Failed to archive note. Please try again later.`;
    await handleAction(`http://localhost:5000/api/notes/archive/${noteId}`, successMessage, errorMessage);
  }
});

async function handleAction(apiEndpoint, successMessage, errorMessage, method = 'PUT') {
  try {
    const response = await fetch(apiEndpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
    });
    if (!response.ok) {
      throw new Error(errorMessage);
    }
    showModal(successMessage);
    await fetchNotes(currentFilter);
  } catch (error) {
    console.error('Error:', error);
    showModal(errorMessage);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await fetchNotes('all');
  await fetchLabels();
  
});

async function fetchNotes(filter = 'all', query = '') {
  currentFilter = filter;
  updateViewHeader(query);
  try {
    let endpoint;

    if (filter === 'trash') {
      endpoint = `http://localhost:5000/api/notes/true/false`;
    } else if (filter === 'archive') {
      endpoint = 'http://localhost:5000/api/notes/false/true';
    } else if (filter === 'search') {
      endpoint = `http://localhost:5000/api/notes/search?query=${query}`;
    } else if (filter === 'label') {
      endpoint = `http://localhost:5000/api/notes/false/false/${query}`;
    } else if (filter === 'reminder') {
      endpoint = 'http://localhost:5000/api/notes/reminders';
    } else {
      endpoint = 'http://localhost:5000/api/notes/false/false';
    }
    
    console.log(endpoint)
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Add token to the request headers
      }
    });
    
    const notes = await handleFetchResponse(response);
    if (notes) {
      renderNotes(notes.data, query);
    }
  } catch (error) {
    console.error('Error fetching notes:', error);
    alert('Failed to fetch notes. Please try again later.');
  }
}

function renderNotes(notes, query) {
  console.log(notes)
  notesContainer.innerHTML = '';
  updateViewHeader(query);
  notes.forEach(note => {
    const noteElement = document.createElement('div');
    noteElement.classList.add('note');
    noteElement.style.backgroundColor = note.color;
    noteElement.innerHTML = `
      <div class="note-title">${note.title}</div>
      <div class="note-text">${note.text}</div>
      <div class="note-tags">${note.tags.join(' | ')}</div>
      <div class="note-labels">
        ${note.labels.map(label => `<span class="note-label" data-label="${label}">${label}</span>`).join(' | ')}
      </div>
      ${note.reminder ? `<div class="note-reminder">Reminder: ${new Date(note.reminder).toLocaleDateString()}</div>` : ''}
      <div class="note-actions">
        <button class="move-to-trash-button" data-note-id="${note._id}">
          <i class="ri-delete-bin-4-line"></i>
        </button>
        ${currentFilter !== 'trash' ? `<button class="note-archive-button" data-note-id="${note._id}">
          <i class="ri-inbox-archive-line"></i>
        </button>` : ''}
        <div class="note-color-picker-wrapper">
          <input type="color" class="note-color-picker" data-note-id="${note._id}" value="${note.color}">
          <span class="note-color-picker-icon ri-palette-line"></span>
        </div>
      </div>
    `;
    notesContainer.appendChild(noteElement);
  });

  document.querySelectorAll('.note-color-picker').forEach(input => {
    input.addEventListener('input', async (event) => {
      const noteId = event.target.dataset.noteId;
      const newColor = event.target.value;
      await updateNoteColor(noteId, newColor);
      // Reflect color change in the note
      const noteElement = event.target.closest('.note');
      if (noteElement) {
        noteElement.style.backgroundColor = newColor;
      }
    });
  });

  document.querySelectorAll('.note-label').forEach(labelElement => {
    labelElement.addEventListener('click', async (event) => {
      const label = event.target.dataset.label;
      await fetchNotes('label', label);
    });
  });
}

async function updateNoteColor(noteId, color) {
  try {
    const response = await fetch(`http://localhost:5000/api/notes/color/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Add token to the request headers
      },
      body: JSON.stringify({ color }),
    });
    await handleFetchResponse(response);
    if (!response.ok) {
      throw new Error('Failed to update note color');
    }
  } catch (error) {
    console.error('Error updating note color:', error);
    showModal('Failed to update note color. Please try again later.');
  }
}

async function fetchLabels() {
  try {
    const response = await fetch('http://localhost:5000/api/notes/labels', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Add token to the request headers
      }
    });

    const labels = await handleFetchResponse(response);
    if (labels) {
      renderLabels(labels.data);
    }
  } catch (error) {
    console.error('Error fetching labels:', error);
    alert('Failed to fetch labels. Please try again later.');
  }
}

function renderLabels(labels) {
  labelsSection.innerHTML = '<h3 class="label-head">Labels</h3>';
  labels.forEach(label => {
    label = label.trim();
    const labelElement = document.createElement('div');
    labelElement.classList.add('sidebar-item');
    labelElement.classList.add('sidebar-label');
    labelElement.textContent = label;

    labelElement.addEventListener('click', async () => {
      await fetchNotes('label', label);
    });

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="ri-delete-bin-4-line"></i>';
    deleteButton.classList.add('delete-label-button');
    deleteButton.dataset.labelId = label;

    deleteButton.addEventListener('click', async (event) => {
      event.stopPropagation();
      const labelId = event.target.dataset.labelId;
      await deleteLabel(label);
    });

    labelElement.appendChild(deleteButton);
    labelsSection.appendChild(labelElement);
  });
  sidebarMenu.appendChild(labelsSection);
}

document.addEventListener('click', async (event) => {
  if (event.target.closest('.delete-label-button')) {
    const button = event.target.closest('.delete-label-button');
    const labelId = button.dataset.labelId;
    await deleteLabel(labelId);
  }
});

async function deleteLabel(labelId) {
  try {
    const response = await fetch(`http://localhost:5000/api/notes/labels/${labelId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Add token to the request headers
      }
    });
    if (!response.ok) {
      throw new Error('Failed to delete label');
    }
    await fetchLabels();
    showModal('Label deleted successfully!');
  } catch (error) {
    console.error('Error deleting label:', error);
    showModal('Failed to delete label. Please try again later.');
  }
}

function updateViewHeader(query) {
  switch (currentFilter) {
    case 'all':
      viewHeader.textContent = 'Notes';
      break;
    case 'trash':
      viewHeader.textContent = 'Trash';
      break;
    case 'archive':
      viewHeader.textContent = 'Archive';
      break;
    case 'search':
      viewHeader.textContent = 'Search Results';
      break;
    case 'label':
      viewHeader.textContent = 'Label: ' + query;
      break;
    case 'reminder':
      viewHeader.textContent = 'Upcoming reminder notes';
      break;
    default:
      viewHeader.textContent = 'All Notes';
  }
}

document.querySelector('.upcoming-reminders-button').addEventListener('click', async (event) => {
  event.preventDefault(); // Prevent default action
  hideAddNoteSection();
  await fetchNotes('reminder');
});

document.addEventListener('click', async (event) => {
  if (event.target.closest('.sidebar-label')) {
    const label = event.target.closest('.sidebar-label').textContent.trim();
    hideAddNoteSection();
    await fetchNotes('label', label);
  }
});
