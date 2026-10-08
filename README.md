# QuickNotes System Design

QuickNotes is a simple note-taking web application that demonstrates how a frontend client communicates with a REST API.

The project includes:

- Loading notes using GET.
- Creating notes using POST.
- Deleting notes using DELETE.
- Client-side validation.
- Loading, success, error, and empty states.
- API and system architecture documentation.
- A relational database design for users, notes, and tags.

## How to Run the API Client

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Open `index.html`.
4. Use the VS Code Live Server extension to start the application.
5. Click **Load notes** to retrieve notes from JSONPlaceholder.
6. Use the form to create a note.
7. Use the **Delete** button to delete a note.

The application requires an internet connection because it uses the JSONPlaceholder practice API.

## Project Files

```text
quicknotes-system-design/
├── index.html
├── api.js
├── style.css
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md