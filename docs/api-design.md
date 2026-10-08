# QuickNotes API Design

## Overview

The QuickNotes API is a RESTful API that uses JSON for requests and responses.

Base URL:

`https://api.quicknotes.example.com/api/v1`

Protected endpoints use bearer token authentication.

## REST Endpoints

| Method | Path | Description | Success Status |
|---|---|---|---|
| GET | `/notes` | List notes for the authenticated user | 200 OK |
| POST | `/notes` | Create a new note | 201 Created |
| GET | `/notes/{id}` | Get one note by ID | 200 OK |
| PATCH | `/notes/{id}` | Update an existing note | 200 OK |
| DELETE | `/notes/{id}` | Delete a note | 204 No Content |
| GET | `/tags` | List available tags | 200 OK |
| POST | `/tags` | Create a new tag | 201 Created |
| GET | `/users/me` | Get the current user's profile | 200 OK |

## Create Note

### POST `/notes`

Creates a new note for the authenticated user.

### Request

```json
{
  "title": "Meeting notes",
  "body": "Discuss the project roadmap.",
  "tagIds": [1, 2]
}