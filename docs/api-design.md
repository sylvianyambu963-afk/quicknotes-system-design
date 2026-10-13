# QuickNotes API Design

## 1. Overview

The QuickNotes API allows authenticated users to create, retrieve, update, and delete their notes.

**Base URL:** `https://api.quicknotes.example.com/api/v1`

**Data format:** JSON

**Authentication:** Bearer token in the `Authorization` header.

Example:

`Authorization: Bearer <access_token>`

All note operations must verify that the authenticated user owns the requested note. The example domain is a placeholder and must be replaced by the deployed API URL.

## 2. Note Data Model

A note returned by the API has the following structure:

```json
{
  "id": 101,
  "user_id": 25,
  "title": "Meeting Notes",
  "content": "Discuss project milestones.",
  "tags": ["work", "planning"],
  "created_at": "2026-10-13T08:00:00Z",
  "updated_at": "2026-10-13T08:30:00Z"
}
```

The API should not expose password hashes, access tokens, or other private authentication data.

## 3. Endpoints

### 3.1 Create a Note

- **Method:** `POST`
- **Path:** `/notes`
- **Success status:** `201 Created`

Request body:

```json
{
  "title": "Meeting Notes",
  "content": "Discuss project milestones.",
  "tags": ["work", "planning"]
}
```

The server validates the input, obtains the user identity from the authenticated session, creates the note, and associates any valid tags owned by that user.

Example response:

```json
{
  "data": {
    "id": 101,
    "title": "Meeting Notes",
    "content": "Discuss project milestones.",
    "tags": ["work", "planning"],
    "created_at": "2026-10-13T08:00:00Z",
    "updated_at": "2026-10-13T08:00:00Z"
  }
}
```

### 3.2 List Notes

- **Method:** `GET`
- **Path:** `/notes`
- **Success status:** `200 OK`

Optional query parameters:

- `page`: page number, starting at 1.
- `limit`: number of notes per page, with a maximum of 100.
- `search`: searches note titles and content.
- `tag`: filters notes by tag name.

Example request:

`GET /notes?page=1&limit=20&tag=work`

Example response:

```json
{
  "data": [
    {
      "id": 101,
      "title": "Meeting Notes",
      "content": "Discuss project milestones.",
      "tags": ["work"],
      "created_at": "2026-10-13T08:00:00Z",
      "updated_at": "2026-10-13T08:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 1,
    "total_pages": 1
  }
}
```

Only notes belonging to the authenticated user are returned. An empty result is represented by an empty `data` array.

### 3.3 Get a Single Note

- **Method:** `GET`
- **Path:** `/notes/{id}`
- **Success status:** `200 OK`

Example request:

`GET /notes/101`

Example response:

```json
{
  "data": {
    "id": 101,
    "title": "Meeting Notes",
    "content": "Discuss project milestones.",
    "tags": ["work", "planning"],
    "created_at": "2026-10-13T08:00:00Z",
    "updated_at": "2026-10-13T08:30:00Z"
  }
}
```

Return `404 Not Found` if the note does not exist or is not accessible to the authenticated user.

### 3.4 Update a Note

- **Method:** `PATCH`
- **Path:** `/notes/{id}`
- **Success status:** `200 OK`

PATCH updates only the supplied fields.

Example request:

`PATCH /notes/101`

Request body:

```json
{
  "title": "Updated Meeting Notes",
  "content": "Review milestones and deadlines."
}
```

Example response:

```json
{
  "data": {
    "id": 101,
    "title": "Updated Meeting Notes",
    "content": "Review milestones and deadlines.",
    "tags": ["work", "planning"],
    "created_at": "2026-10-13T08:00:00Z",
    "updated_at": "2026-10-13T09:00:00Z"
  }
}
```

The server must validate the submitted fields and confirm note ownership before saving changes.

### 3.5 Delete a Note

- **Method:** `DELETE`
- **Path:** `/notes/{id}`
- **Success status:** `204 No Content`

Example request:

`DELETE /notes/101`

On success, the server deletes the note and returns an empty response body. Related junction records in `note_tags` should be removed through the database's foreign key rules.

Return `404 Not Found` if the note does not exist or is not accessible to the authenticated user.

### 3.6 List Tags

- **Method:** `GET`
- **Path:** `/tags`
- **Success status:** `200 OK`

Example response:

```json
{
  "data": [
    {
      "id": 1,
      "name": "work"
    },
    {
      "id": 2,
      "name": "personal"
    }
  ]
}
```

Only tags belonging to the authenticated user should be returned.

## 4. HTTP Status Codes

| Status code | Meaning | Example |
|---|---|---|
| `200 OK` | Request succeeded | A note was retrieved or updated. |
| `201 Created` | Resource created | A note was created successfully. |
| `204 No Content` | Successful request with no response body | A note was deleted. |
| `400 Bad Request` | Invalid request data | A title is missing or a field has the wrong type. |
| `401 Unauthorized` | Authentication missing or invalid | The bearer token is absent or expired. |
| `403 Forbidden` | Authenticated user lacks permission | An operation is explicitly disallowed by policy. |
| `404 Not Found` | Resource does not exist or is not accessible | A note ID cannot be found for that user. |
| `409 Conflict` | Request conflicts with existing state | A duplicate tag name violates a uniqueness rule. |
| `422 Unprocessable Content` | Well-formed input fails semantic validation | A field combination violates business rules. |
| `429 Too Many Requests` | Rate limit exceeded | A client sends too many requests. |
| `500 Internal Server Error` | Unexpected server failure | An unhandled server error occurs. |

The API should use status codes consistently and must not expose internal stack traces or sensitive information.

## 5. Standard Error Response Format

All error responses use a consistent JSON structure.

Example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {
        "field": "title",
        "message": "Title is required."
      }
    ],
    "request_id": "req-example-123"
  }
}
```

The `details` array can identify specific validation failures. The `request_id` helps developers trace errors through logs without revealing private information.

### Example: 400 Bad Request

Request body:

```json
{
  "title": "",
  "content": "Some content"
}
```

Response status: `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must not be empty.",
    "details": [
      {
        "field": "title",
        "message": "A non-empty title is required."
      }
    ],
    "request_id": "req-example-124"
  }
}
```

### Example: 401 Unauthorized

Response status: `401 Unauthorized`

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required.",
    "details": [],
    "request_id": "req-example-125"
  }
}
```

### Example: 404 Not Found

Response status: `404 Not Found`

```json
{
  "error": {
    "code": "NOTE_NOT_FOUND",
    "message": "The requested note was not found.",
    "details": [],
    "request_id": "req-example-126"
  }
}
```

Using the same response structure makes errors easier for frontend clients to process. For privacy, the API can return the same not-found response when a note belongs to another user.

## 6. Validation Rules

- `title` must be a non-empty string and must not exceed 200 characters.
- `content` must be a string and must respect the configured maximum request size.
- `tags` must be an array of valid tag names or identifiers.
- The server must reject unknown or unsupported fields where appropriate.
- The note ID must be valid for the requested operation.
- The server must validate ownership before returning, changing, or deleting a note.
- Query parameters such as `page` and `limit` must contain valid positive integers.
- The server must use parameterized SQL queries to reduce SQL injection risks.

## 7. Authentication, Authorization, and Security

- Require authentication for private note and tag operations.
- Store passwords using a secure password-hashing algorithm.
- Obtain the current user ID from the validated authentication context.
- Enforce note and tag ownership on every request.
- Use HTTPS in production.
- Validate all incoming data on the server, even if the frontend also validates it.
- Apply rate limiting and sensible request-size limits.
- Avoid logging passwords, access tokens, or private note contents.
- Use pagination to prevent large, expensive responses.

## 8. Pagination and Performance

The list endpoint returns a limited number of notes per page instead of retrieving every note at once.

The server should:
1. Apply the authenticated user's ownership filter.
2. Apply search and tag filters when supplied.
3. Sort by `updated_at` in descending order.
4. Apply pagination.
5. Return pagination metadata with the result.

Database indexes should support frequent filters and sorting, particularly `notes(user_id, updated_at)`.

For very large datasets, cursor-based pagination can be introduced to avoid the performance cost of large offsets.

## 9. Conclusion

This API specification defines the core note and tag endpoints, example request and response payloads, consistent HTTP status codes, structured errors, validation rules, security requirements, and pagination. It gives frontend and backend developers a shared contract for implementing QuickNotes reliably.