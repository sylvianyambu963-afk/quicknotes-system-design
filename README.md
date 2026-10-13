# QuickNotes System Design

QuickNotes is a note-taking application prototype and system design project developed as part of the Power Learn Project Software Engineering course.

The project demonstrates frontend API integration and documents how the application could evolve into a secure, scalable production service.

## Project Objectives

- Demonstrate asynchronous JavaScript and REST API operations.
- Build a simple interface for managing notes.
- Design a relational database for users, notes, and tags.
- Document API endpoints, request validation, and error handling.
- Plan a scalable architecture for up to one million registered users.
- Apply security, reliability, and maintainability principles.

## Features

- Load notes from a mock REST API.
- Create notes through asynchronous requests.
- Delete notes using HTTP requests.
- Display loading, success, empty, and error states.
- Disable relevant buttons while requests are pending.
- Safely render user-provided content using `textContent`.
- Separate API request logic into a reusable JavaScript module.

The current prototype uses JSONPlaceholder for demonstration. Some production features described in the design documents, including authentication, persistent relational storage, and full tag management, require a real backend implementation.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Fetch API and asynchronous programming
- JSONPlaceholder mock REST API
- Markdown for technical documentation
- Git and GitHub for version control

## Project Structure

```text
quicknotes-system-design/
├── index.html
├── style.css
├── api.js
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md
```

The exact filenames should match the files present in the repository.

## Documentation

### 1. API Design

See [`docs/api-design.md`](docs/api-design.md).

This document describes REST endpoints, HTTP methods, request and response examples, authentication, validation rules, pagination, and standard error responses.

### 2. Data Model

See [`docs/data-model.md`](docs/data-model.md).

This document defines the PostgreSQL schema for users, notes, tags, and note-tag relationships. It also includes SQL table creation scripts, joins, indexes, and data-integrity rules.

### 3. System Architecture

See [`docs/architecture.md`](docs/architecture.md).

This document describes the proposed production architecture, traffic estimates for one million registered users, request flows, scaling strategies, security, and single points of failure.

## Running the Prototype

1. Clone the repository:

   ```bash
   git clone https://github.com/sylvianyambu963-afk/quicknotes-system-design.git
   ```

2. Open the project folder.

3. Open `index.html` in a browser or run it using the VS Code Live Server extension.

4. Test the available note operations and observe how the interface handles loading states, successful requests, and errors.

Internet access is required for requests to JSONPlaceholder. The prototype's behavior depends on the endpoints implemented in `api.js`.

## Production Architecture

The proposed production version would use:

- A frontend application for user interaction.
- A REST API for authentication and business logic.
- PostgreSQL for persistent storage.
- Database transactions and constraints for data integrity.
- Appropriate indexes and pagination for efficient queries.
- A load balancer and multiple application servers for scalability.
- Monitoring, backups, and recovery procedures for reliability.

The documented architecture is a design proposal, not a claim that these production services have already been deployed.

## Security Considerations

The production design requires authenticated access to private notes, server-side ownership checks, parameterized SQL queries, secure password hashing, HTTPS, input validation, rate limiting, and careful handling of error messages.

Client-side validation improves usability but cannot replace server-side security controls.

## Testing and Verification

The project should be checked for the following behaviors:

- Notes load successfully when the API is available.
- Network and HTTP errors produce understandable feedback.
- Invalid input is rejected.
- Buttons are disabled during pending operations where appropriate.
- User content is rendered safely.
- Database relationships and constraints prevent invalid records.
- API documentation agrees with the proposed database model.
- The architecture's traffic assumptions and failure mitigations are documented.

The mock API does not prove that the proposed production database or backend has been implemented.

## Reflection

This project helped me understand that building a working frontend is only one part of software engineering. A production application also requires clear API contracts, a complete database model, reliable error handling, security controls, and a scalable architecture.

One of my key lessons was the importance of documenting database relationships and defining how requests move through the system. Incomplete documentation can leave important implementation decisions unclear, even when the client-side code works correctly.

I also learned that scalability planning requires explicit assumptions about active users, request frequency, read and write workloads, and peak traffic. These estimates must eventually be validated through testing rather than treated as guaranteed performance figures.

The project strengthened my understanding of asynchronous JavaScript, HTTP methods, relational database design, SQL joins, indexing, and system reliability.

Going forward, I will improve my work by completing technical documentation before submission, testing each requirement against the assessment rubric, validating edge cases, and keeping the implementation and design documents consistent.

## Future Improvements

- Implement a real backend with authentication and authorization.
- Connect the API to a PostgreSQL database.
- Add complete tag creation and management.
- Introduce automated unit and integration tests.
- Add pagination and search.
- Implement structured logging, monitoring, and backup procedures.
- Conduct load testing before making production performance claims.

## Repository

GitHub: https://github.com/sylvianyambu963-afk/quicknotes-system-design

## Conclusion

QuickNotes demonstrates foundational frontend API integration and provides a documented plan for a secure, maintainable, and scalable note-taking service. The prototype and its design documents form a foundation for future backend development.