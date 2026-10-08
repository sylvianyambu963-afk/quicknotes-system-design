const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadBtn = document.querySelector("#load-btn");
const status = document.querySelector("#status");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitBtn = document.querySelector("#submit-btn");
const notesList = document.querySelector("#notes-list");

let notes = [];

function setStatus(message, type = "") {
    status.textContent = message;
    status.className = type ? `status-${type}` : "";
}

async function request(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

function renderNotes() {
    notesList.textContent = "";

    if (notes.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.textContent = "No notes to display.";
        emptyMessage.className = "empty-state";
        notesList.appendChild(emptyMessage);
        return;
    }

    notes.forEach((note) => {
        const item = document.createElement("li");
        item.className = "note";

        const title = document.createElement("h3");
        title.textContent = note.title;

        const body = document.createElement("p");
        body.textContent = note.body;

        item.appendChild(title);
        item.appendChild(body);

        notesList.appendChild(item);
    });
}

async function loadNotes() {
    loadBtn.disabled = true;
    setStatus("Loading notes...");

    try {
        notes = await request(`${API_URL}?_limit=10`);

        renderNotes();

        if (notes.length > 0) {
            setStatus(
                `Loaded ${notes.length} notes from the server.`,
                "success"
            );
        } else {
            setStatus("No notes were found.", "success");
        }
    } catch (error) {
        setStatus(
            "Sorry, we could not load the notes. Please try again.",
            "error"
        );
    } finally {
        loadBtn.disabled = false;
    }
}

async function createNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title) {
        setStatus("Please enter a title.", "error");
        titleInput.focus();
        return;
    }

    if (title.length > 100) {
        setStatus("Title must be 100 characters or fewer.", "error");
        titleInput.focus();
        return;
    }

    submitBtn.disabled = true;
    setStatus("Creating note...");

    try {
        const newNote = await request(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                body: body,
                userId: 1
            })
        });

        notes.unshift(newNote);
        renderNotes();

        setStatus(
            `Note created (status 201, id ${newNote.id}).`,
            "success"
        );

        noteForm.reset();
    } catch (error) {
        setStatus(
            "Sorry, we could not create the note. Please try again.",
            "error"
        );
    } finally {
        submitBtn.disabled = false;
    }
}

loadBtn.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

renderNotes();