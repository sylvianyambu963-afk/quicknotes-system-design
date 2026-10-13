# QuickNotes System Architecture

## 1. Overview

QuickNotes is a note-taking application that allows users to create, view, update, delete, and organize notes using tags.

The frontend currently demonstrates API operations using JavaScript and JSONPlaceholder, a mock REST API. This document describes a proposed production architecture for supporting up to one million registered users. JSONPlaceholder does not provide the complete production backend described here.

## 2. Architecture Requirements

### Functional requirements
- Users can create and manage notes.
- Users can organize notes using tags.
- Users can retrieve their notes and search or filter them.
- The API validates requests and returns consistent responses.
- Users can access only their own private notes.

### Non-functional requirements
- Scalability to support growth in users and requests.
- Reliable data storage and recovery.
- Secure authentication and authorization.
- Responsive API performance under normal and peak traffic.
- Maintainability through separated frontend, backend, and database responsibilities.

## 3. High-Level Architecture

The proposed request path is:

Client browser → CDN and load balancer → Application servers → PostgreSQL database.

Supporting services include:
- Redis for caching frequently accessed data and managing short-lived sessions where appropriate.
- A message queue and background workers for non-critical tasks such as notifications.
- Monitoring and centralized logging for diagnosing errors and performance issues.
- Automated database backups and recovery procedures.

### Component responsibilities

**1. Client application**

The browser renders the interface and sends HTTP requests. JavaScript handles asynchronous operations, displays loading and error messages, and updates the interface when requests complete.

**2. CDN**

A content delivery network serves static assets such as CSS, JavaScript, and images from locations closer to users. Private note data must not be publicly cached.

**3. Load balancer**

The load balancer distributes requests across multiple application servers and routes traffic away from unhealthy instances.

**4. Application servers**

Backend servers authenticate users, validate input, enforce note ownership, implement business rules, and communicate with the database.

**5. PostgreSQL database**

PostgreSQL stores users, notes, tags, and note-tag relationships. Primary keys, foreign keys, unique constraints, and transactions protect data integrity.

**6. Redis cache**

Redis can cache selected non-sensitive data or frequently accessed results. Cache invalidation is required after updates. PostgreSQL remains the authoritative source for stored notes.

**7. Message queue and background workers**

Workers handle non-critical tasks such as sending notifications, processing exports, and retrying temporary failures. The system should not report a task as completed before the relevant operation succeeds.

**8. Monitoring and backups**

Monitoring collects request latency, error rates, CPU and memory use, database connection counts, and queue depth. Automated backups and tested restoration procedures support disaster recovery.

## 4. Traffic Estimates for One Million Registered Users

These estimates are planning assumptions, not measured production traffic.

Assume:
- Registered users: 1,000,000.
- Daily active users: 10% of registered users = 100,000.
- Average API requests per active user per day: 10.
- Read requests: 90% of all requests.
- Write requests: 10% of all requests.
- Peak traffic multiplier: 10 times the daily average.

### Daily request volume

100,000 active users × 10 requests = 1,000,000 API requests per day.

Average requests per second:

1,000,000 ÷ 86,400 ≈ 11.6 requests per second.

Estimated peak rate:

11.6 × 10 ≈ 116 requests per second.

### Read and write estimates

| Metric | Daily requests | Average requests/second |
|---|---:|---:|
| Read requests (90%) | 900,000 | 10.42 |
| Write requests (10%) | 100,000 | 1.16 |
| Total | 1,000,000 | 11.57 |

At the assumed tenfold peak, the system may experience approximately 104 read requests and 12 write requests per second.

These figures estimate request counts, not database queries. A single API request can execute multiple SQL queries, and some reads may be served from cache. Real capacity must be established through load testing and monitoring.

## 5. Request Flows

### 5.1 Reading notes

1. The user opens the notes page.
2. The frontend sends an authenticated `GET /api/v1/notes` request.
3. The load balancer forwards the request to a healthy application server.
4. The server verifies the user's identity and checks access permissions.
5. The server retrieves the user's notes from PostgreSQL, or uses a valid cache entry where appropriate.
6. The API returns a JSON response with pagination metadata.
7. The frontend renders the notes and displays an appropriate status message.

If the request fails, the frontend displays a useful error message and allows the user to retry.

### 5.2 Creating a note

1. The user enters a title and note body.
2. The frontend validates required fields and sends a `POST /api/v1/notes` request.
3. The server authenticates the user and validates the payload.
4. The server starts a database transaction.
5. PostgreSQL inserts the note using the authenticated user's ID.
6. If tags are supplied, the server validates them and creates the note-tag relationships in the same transaction.
7. The transaction commits after all required operations succeed; otherwise, it rolls back.
8. The server returns HTTP `201 Created` with the new note.
9. The frontend displays the new note and a success message.

### 5.3 Updating or deleting a note

1. The frontend sends an authenticated `PATCH` or `DELETE` request.
2. The server verifies the user's identity.
3. The database operation includes both the note ID and authenticated user ID.
4. If the note belongs to that user, the operation proceeds.
5. The API returns the appropriate success response.
6. The frontend refreshes or updates the displayed notes.

A user must not be able to update or delete another user's note by changing the note ID.

## 6. Database Design and Performance

The production data model uses four relational tables:

- `users`: account information.
- `notes`: note content and ownership.
- `tags`: reusable tag names.
- `note_tags`: the many-to-many relationship between notes and tags.

### Indexing

Recommended indexes include:
- Unique index on `users.email`.
- Index on `notes(user_id, updated_at DESC)` for listing a user's latest notes.
- Composite primary key on `note_tags(note_id, tag_id)`.
- Additional index on `note_tags(tag_id, note_id)` for finding notes by tag.

Indexes should be reviewed against actual query plans. Excessive indexes consume storage and slow down inserts and updates.

### Pagination

The API should return a limited number of notes per request. Cursor-based pagination is a useful option for large datasets because it avoids increasingly expensive offset scans.

### Transactions

Creating a note and its tag relationships should use a database transaction so partial changes are not left behind if an operation fails.

## 7. Scalability Strategy

### Application layer

Run multiple stateless application instances behind the load balancer. Add instances when monitoring shows sustained increases in traffic or resource usage.

### Database layer

Begin with a properly indexed PostgreSQL primary database and connection pooling. Add read replicas for read-heavy workloads when appropriate, while accounting for replication lag.

Writes should be directed to the authoritative primary database. If the workload eventually exceeds a single database's capacity, evaluate partitioning or sharding using measured evidence.

### Caching

Cache static content and carefully selected read-heavy data. Invalidate or update cache entries after writes. Do not treat cached note data as the authoritative record.

### Asynchronous processing

Move non-critical operations to a queue. Use retry limits, idempotent jobs, and a dead-letter mechanism for repeatedly failing tasks.

## 8. Single Points of Failure and Mitigation

| Potential failure | Impact | Mitigation |
|---|---|---|
| Single application server | API becomes unavailable if the server fails | Multiple instances and health checks |
| Single load balancer | Requests cannot reach healthy servers if it fails | Redundant load-balancing infrastructure |
| Primary database failure | Reads and writes may become unavailable | Replication, automated recovery, backups, and tested failover |
| Cache outage | Slower requests or temporary loss of cached data | Treat cache as optional; fall back safely to the database |
| Queue or worker failure | Background tasks are delayed | Durable queues, retries, monitoring, and dead-letter handling |
| Network or cloud-region outage | Users may lose access to services | Recovery plans, backups, and a tested secondary-region strategy where justified |
| Credential compromise | Unauthorized access to notes | Strong authentication, authorization, secret management, and audit logging |

Redundancy reduces individual points of failure but does not guarantee uninterrupted service. Failover, recovery time, and recovery point objectives must be defined and tested.

## 9. Security and Reliability

- Use HTTPS for all production traffic.
- Hash passwords using a suitable password-hashing algorithm.
- Authenticate requests and authorize access to every private note.
- Use parameterized SQL queries.
- Validate request bodies and limit payload sizes.
- Apply rate limiting to reduce abuse.
- Keep secrets outside source code.
- Avoid logging passwords, access tokens, or private note content.
- Monitor failures and suspicious activity.
- Test database backup restoration regularly.

## 10. Trade-offs

### PostgreSQL versus NoSQL

PostgreSQL provides relational integrity, joins, and transactions, making it suitable for notes and tags. A NoSQL database might offer different scaling characteristics but would introduce different data consistency and relationship-management considerations.

### Cache versus database reads

Caching reduces repeated database work and can improve response times. However, invalidation introduces complexity and can cause stale results. The database remains authoritative.

### Synchronous versus asynchronous operations

Synchronous requests are appropriate for actions where the user needs an immediate result, such as saving a note. Queues are better for non-critical background work, but introduce eventual completion and retry handling.

### Replication versus sharding

Read replicas can improve read capacity but may return slightly stale data. Sharding can distribute large workloads but increases operational complexity. Both should be introduced when actual performance data justifies them.

## Conclusion

The proposed QuickNotes architecture separates the browser, API services, database, and background processing. It supports growth through horizontal application scaling, efficient SQL queries, caching, and optional database replication.

Security, note ownership, transaction integrity, monitoring, and recovery procedures remain essential at every scale. Traffic assumptions must be validated with realistic load tests before production deployment.