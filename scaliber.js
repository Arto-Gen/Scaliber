let notes = JSON.parse(localStorage.getItem('scaliber-notes')) || [];
let currentNoteId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderNoteList();
    if(notes.length > 0) loadNote(notes[0].id);
});

// Rich Text Formatting
function format(command, value = null) {
    document.execCommand(command, false, value);
}

// Theme Toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

// Create New Note
document.getElementById('new-note-btn').addEventListener('click', () => {
    const newNote = {
        id: Date.now(),
        title: "Untitled Note",
        content: "",
        favorite: false
    };
    notes.unshift(newNote);
    saveNotes();
    renderNoteList();
    loadNote(newNote.id);
});

function saveNotes() {
    localStorage.setItem('scaliber-notes', JSON.stringify(notes));
}

function renderNoteList() {
    const list = document.getElementById('note-list');
    list.innerHTML = notes.map(note => `
        <div class="note-item" onclick="loadNote(${note.id})">
            <span>${note.favorite ? '⭐' : '📝'} ${note.title.substring(0, 15)}</span>
            <i class="fas fa-trash delete-icon" onclick="deleteNote(${note.id}, event)"></i>
        </div>
    `).join('');
}

function loadNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    currentNoteId = id;
    document.getElementById('note-title').value = note.title;
    document.getElementById('editor').innerHTML = note.content;
    updateFavIcon(note.favorite);
    document.querySelectorAll('.note-item').forEach(item => item.classList.toggle('active', item.getAttribute('onclick').includes(id)));
}

// Auto-save on input
document.querySelector('.content-area').addEventListener('input', () => {
    if (!currentNoteId) return;
    const note = notes.find(n => n.id === currentNoteId);
    note.title = document.getElementById('note-title').value;
    note.content = document.getElementById('editor').innerHTML;
    saveNotes();
    renderNoteList();
});

// AI Summarizer (Simulated logic)
function summarizeText() {
    const text = document.getElementById('editor').innerText;
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
    
    if (sentences.length <= 3) {
        alert("Text is already short enough!");
        return;
    }

    // Simple simulation: takes first, middle, and last sentence
    const summary = [sentences[0], sentences[Math.floor(sentences.length/2)], sentences[sentences.length-1]];
    
    const summaryDiv = document.createElement('div');
    summaryDiv.style.background = "#7c4dff22";
    summaryDiv.style.padding = "15px";
    summaryDiv.style.margin = "10px 0";
    summaryDiv.style.borderRadius = "8px";
    summaryDiv.innerHTML = `<strong>AI Summary:</strong><br>${summary.join(' ')}`;
    document.getElementById('editor').prepend(summaryDiv);
}

// Flashcard Logic
function generateFlashcards() {
    const text = document.getElementById('editor').innerText;
    const lines = text.split('\n').filter(line => line.includes(':'));
    
    if (lines.length === 0) {
        alert("To make flashcards, use the format 'Question : Answer' on new lines!");
        return;
    }

    const container = document.getElementById('flashcard-container');
    container.innerHTML = lines.map(line => {
        const [q, a] = line.split(':');
        return `<div class="card" onclick="this.classList.toggle('flipped')" 
                style="border:1px solid #ccc; padding:20px; margin:10px; cursor:pointer; text-align:center;">
                <div class="front"><strong>Q:</strong> ${q}</div>
                <div class="back" style="color:blue; margin-top:10px;">(Click to flip)</div>
                <div class="answer" style="display:none"><strong>A:</strong> ${a}</div>
                </div>`;
    }).join('');
    
    document.getElementById('flashcard-modal').style.display = "block";
}

function closeModal() {
    document.getElementById('flashcard-modal').style.display = "none";
}

function toggleFavorite() {
    const note = notes.find(n => n.id === currentNoteId);
    note.favorite = !note.favorite;
    saveNotes();
    renderNoteList();
    updateFavIcon(note.favorite);
}

function updateFavIcon(isFav) {
    const btn = document.getElementById('fav-btn');
    btn.innerHTML = isFav ? '<i class="fas fa-star" style="color:gold"></i>' : '<i class="far fa-star"></i>';
}

let currentCardIndex = 0;
let flashcardsArray = [];

function generateFlashcards() {
    let editor = document.getElementById('editor');
    let text = editor.innerText;
    
    // 1. Try to find manual cards (Question : Answer)
    let lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => (line.includes(':') || line.includes('-')) && line.length > 5);

    if (lines.length > 0) {
        flashcardsArray = lines.map(line => {
            const separator = line.includes(':') ? ':' : '-';
            const parts = line.split(separator);
            const words = parts[1].trim().split(/\s+/);
            return { 
                q: parts[0].trim(), 
                a: words.slice(0, 7).join(' ') + (words.length > 7 ? '...' : '') 
            };
        });
    } else {
        // 2. If no colons found, turn the AI Summary into a card
        const summaryMatch = text.match(/AI Summary:\s*([\s\S]+)/i);
        if (summaryMatch) {
            const fullSummary = summaryMatch[1].trim();
            const words = fullSummary.split(/\s+/);
            flashcardsArray = [{
                q: "What is the summary of these notes?",
                a: words.slice(0, 10).join(' ') + "..."
            }];
        } else {
            alert("To make cards, use 'Question : Answer' or generate an AI Summary first!");
            return;
        }
    }

    currentCardIndex = 0;
    showCard(currentCardIndex);
    document.getElementById('flashcard-modal').style.display = "block";
}

function showCard(index) {
    const container = document.getElementById('flashcard-container');
    const card = flashcardsArray[index];
    updateProgress();

    // Smart Font Scaling: smaller font for longer stories
    const textLength = Math.max(card.q.length, card.a.length);
    let fontSize = '1.4rem';
    if (textLength > 200) fontSize = '1.1rem';
    if (textLength > 500) fontSize = '0.95rem';

    container.innerHTML = `
        <div class="flashcard-wrapper">
            <div class="flashcard-inner" id="card-inner" onclick="this.classList.toggle('is-flipped')">
                <div class="card-front" style="font-size: ${fontSize};">
                    <button class="speaker-btn" onclick="readText(event, '${card.q.replace(/'/g, "\\'")}')">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <span style="font-size: 0.7rem; color: #888; text-transform: uppercase; margin-bottom: 5px; display: block;">Question</span>
                    <div>${card.q}</div>
                    <small style="margin-top: auto; padding-top: 15px; color: #7c4dff; font-size: 0.8rem; display: block; text-align: center;">Tap to flip</small>
                </div>
                <div class="card-back" style="font-size: ${fontSize};">
                    <button class="speaker-btn" onclick="readText(event, '${card.a.replace(/'/g, "\\'")}')">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <span style="font-size: 0.7rem; opacity: 0.8; text-transform: uppercase; margin-bottom: 5px; display: block;">Answer</span>
                    <div>${card.a}</div>
                </div>
            </div>
        </div>

        <div class="modal-controls">
            <button onclick="prevCard()" class="nav-btn" ${index === 0 ? 'disabled style="opacity:0.3"' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
            <span style="font-weight: bold; font-size: 0.9rem;">${index + 1} / ${flashcardsArray.length}</span>
            <button onclick="nextCard()" class="nav-btn" ${index === flashcardsArray.length - 1 ? 'disabled style="opacity:0.3"' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

function nextCard() {
    if (currentCardIndex < flashcardsArray.length - 1) {
        currentCardIndex++;
        showCard(currentCardIndex);
    }
}

function prevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        showCard(currentCardIndex);
    }
}

function updateProgress() {
    const percent = ((currentCardIndex + 1) / flashcardsArray.length) * 100;
    document.getElementById('progress-bar').style.width = percent + '%';
}
// Function to handle the voice
function readText(event, text) {
    // Prevent the card from flipping when clicking the speaker button
    event.stopPropagation();
    
    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for better clarity
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
}

// Update showCard to include the speaker icons


function exportToPDF() {
    const element = document.getElementById('editor');
    const title = document.getElementById('note-title').value || "Untitled Note";

    // Create a temporary container for a clean PDF layout
    const opt = {
        margin:       [1, 1, 1, 1], // top, left, bottom, right in inches
        filename:     `${title}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // We create a wrapper so the title is included in the PDF export
    const pdfContent = document.createElement('div');
    pdfContent.innerHTML = `
        <h1 style="font-family: Arial; color: #37352f;">${title}</h1>
        <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;">
        <div style="font-family: Arial; line-height: 1.6;">${element.innerHTML}</div>
    `;

    // New way to trigger the download
    html2pdf().set(opt).from(pdfContent).save();
}

function shuffleCards() {
    if (flashcardsArray.length === 0) return;
    
    // Fisher-Yates shuffle algorithm
    for (let i = flashcardsArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flashcardsArray[i], flashcardsArray[j]] = [flashcardsArray[j], flashcardsArray[i]];
    }
    
    // Reset to the first card and update the display
    currentCardIndex = 0;
    showCard(currentCardIndex);
}

function changeLineHeight(value) {
    document.getElementById('editor').style.lineHeight = value;
}

function toggleCheckbox() {
    // Inserts a clickable checkbox into the editor
    const checkboxHtml = '<input type="checkbox" style="width: 18px; height: 18px; vertical-align: middle;">&nbsp;';
    document.execCommand('insertHTML', false, checkboxHtml);
}

function updateEditorStats() {
    const text = document.getElementById('editor').innerText.trim();
    const words = text.length > 0 ? text.split(/\s+/).length : 0;
    const readingTime = Math.ceil(words / 200); // Average reading speed of 200 wpm

    document.getElementById('word-count').innerText = `${words} words`;
    document.getElementById('reading-time').innerText = `${readingTime} min read`;
}

// Locate this existing block and add the new line:
document.querySelector('.content-area').addEventListener('input', () => {
    if (!currentNoteId) return;
    /* ... existing logic ... */
    updateEditorStats(); // <--- Add this line here
});

function loadNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    currentNoteId = id;

    // Get the elements
    const titleInput = document.getElementById('note-title');
    const editorDiv = document.getElementById('editor');

    // Remove the class if it exists to reset the animation
    titleInput.classList.remove('fade-in');
    editorDiv.classList.remove('fade-in');

    // Trigger a "reflow" to make the browser recognize the class removal
    void titleInput.offsetWidth; 

    // Add data and the animation class
    titleInput.value = note.title;
    editorDiv.innerHTML = note.content;
    
    titleInput.classList.add('fade-in');
    editorDiv.classList.add('fade-in');

    updateFavIcon(note.favorite);
    updateEditorStats(); // Updates stats for the newly loaded note
}

function generateFlashcards() {
    // 1. Get the editor content
    let editor = document.getElementById('editor');
    
    // 2. Clone it and remove the AI Summary div so it doesn't become a flashcard
    let tempDiv = editor.cloneNode(true);
    const summaryBlocks = tempDiv.querySelectorAll('div[style*="background"]');
    summaryBlocks.forEach(block => block.remove());

    const text = tempDiv.innerText;
    
    // 3. Filter for valid Q:A lines
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => (line.includes(':') || line.includes('-')) && line.length > 5);
    
    if (lines.length === 0) {
        alert("No flashcards found! Use 'Question : Answer' format.");
        return;
    }

    flashcardsArray = lines.map(line => {
        const separator = line.includes(':') ? ':' : '-';
        const parts = line.split(separator);
        return { 
            q: parts[0].trim(), 
            a: parts[1] ? parts[1].trim() : "No answer provided" 
        };
    });

    currentCardIndex = 0;
    showCard(currentCardIndex);
    document.getElementById('flashcard-modal').style.display = "block";
}

function toggleSidebarMobile() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Close sidebar when a note is clicked on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && e.target.closest('.note-item')) {
        document.querySelector('.sidebar').classList.remove('active');
    }
});

function toggleSidebarMobile() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

function createNewNoteMobile() {
    // Triggers the hidden "New Note" button click
    document.getElementById('new-note-btn').click();
    // Close sidebar if it was open
    document.querySelector('.sidebar').classList.remove('active');
}

function toggleThemeMobile() {
    // Triggers the hidden "Theme Toggle" button click
    document.getElementById('theme-toggle').click();
}

// Auto-close sidebar when clicking outside on mobile
document.addEventListener('mousedown', (e) => {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
        if (!sidebar.contains(e.target) && !e.target.closest('.mobile-actions')) {
            sidebar.classList.remove('active');
        }
    }
});

function toggleCheckbox() {
    // This inserts a real, clickable checkbox into your editor
    const checkboxHtml = '<input type="checkbox" style="width: 18px; height: 18px; vertical-align: middle; cursor: pointer; margin-right: 5px;">&nbsp;';
    document.execCommand('insertHTML', false, checkboxHtml);
    
    // Focus back on the editor so the user can keep typing
    document.getElementById('editor').focus();
}

// Ensure the 'format' function handles justification
function format(command, value = null) {
    document.execCommand(command, false, value);
}

document.getElementById('note-title').addEventListener('focus', function() {
    this.select();
});

function deleteNote(id, event) {
    event.stopPropagation();
    if(confirm('Delete this note?')) {
        notes = notes.filter(n => n.id !== id);
        saveNotes();
        renderNoteList();
        if (notes.length > 0) loadNote(notes[0].id);
        else {
            document.getElementById('note-title').value = "";
            document.getElementById('editor').innerHTML = "";
        }
    }
}


