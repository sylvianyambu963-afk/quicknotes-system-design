# QuickNotes System Design: Data Model

## 1. Overview

QuickNotes is a note-taking application where users can create, read, update, and delete their notes. Users can also organize notes using tags.

The production database will use **PostgreSQL**, a relational database that supports foreign keys, transactions, constraints, and SQL joins.

## 2. Entities and Relationships

The database contains four tables:

1. **users** — stores registered user accounts.
2. **notes** — stores notes owned by users.
3. **tags** — stores tags belonging to users.
4. **note_tags** — connects notes to tags through a many-to-many relationship.

### Relationships

- One user can own many notes.
- One user can create many tags.
- One note can have many tags.
- One tag can be assigned to many notes.
- The `note_tags` junction table connects notes and tags.

A user must only access their own notes and tags. The application must enforce ownership checks on every relevant request.

## 3. Database Schema

The following PostgreSQL statements create all four tables. Create the parent tables before the tables that reference them.

### Table 1: users

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Stores user profile and authentication information.

- `id` uniquely identifies each user.
- `email` must be unique.
- `password_hash` stores a secure password hash, never a plaintext password.
- `created_at` records when the account was created.

### Table 2: notes

```sql
CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:** Stores each user's notes.

- `id` uniquely identifies each note.
- `user_id` links a note to its owner.
- Deleting a user deletes their notes through the foreign key.
- `updated_at` should be refreshed by the application or a database trigger whenever a note changes.

### Table 3: tags

```sql
CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tag_per_user UNIQUE (user_id, name)
);
```

**Purpose:** Stores tags created by individual users.

The unique constraint prevents one user from creating duplicate tags with the same name, while allowing different users to use the same tag name.

### Table 4: note_tags

```sql
CREATE TABLE note_tags (
    note_id BIGINT NOT NULL REFERENCES notes(id)
        ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id)
        ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);
```

**Purpose:** Implements the many-to-many relationship between notes and tags.

- A note can have multiple tags.
- A tag can be used by multiple notes.
- The composite primary key prevents the same tag from being assigned to the same note more than once.
- Deleting a note or tag automatically removes its associated junction records.

## 4. SQL Queries

The following queries demonstrate common operations required by the application.

### Query 1: Retrieve a user's notes

```sql
SELECT id, title, content, created_at, updated_at
FROM notes
WHERE user_id = 1
ORDER BY updated_at DESC;
```

**Purpose:** Retrieves notes belonging to user ID 1, with the most recently updated notes first.

In production, the user ID must come from the authenticated session or token, not from an untrusted client value alone.

### Query 2: Retrieve notes and their tags using JOIN

```sql
SELECT
    n.id AS note_id,
    n.title,
    t.name AS tag_name
FROM notes AS n
LEFT JOIN note_tags AS nt
    ON n.id = nt.note_id
LEFT JOIN tags AS t
    ON nt.tag_id = t.id
WHERE n.user_id = 1
ORDER BY n.id, t.name;
```

**Purpose:** Combines notes, the junction table, and tags. A `LEFT JOIN` also allows notes without tags to appear in the results.

### Query 3: Count notes for each user

```sql
SELECT
    u.id AS user_id,
    u.name,
    COUNT(n.id) AS total_notes
FROM users AS u
LEFT JOIN notes AS n
    ON u.id = n.user_id
GROUP BY u.id, u.name
ORDER BY total_notes DESC;
```

**Purpose:** Shows the number of notes belonging to each user, including users who have no notes.

### Query 4: Find notes with a particular tag

```sql
SELECT n.id, n.title, n.content
FROM notes AS n
JOIN note_tags AS nt
    ON n.id = nt.note_id
JOIN tags AS t
    ON nt.tag_id = t.id
WHERE n.user_id = 1
  AND t.user_id = n.user_id
  AND t.name = 'work'
ORDER BY n.updated_at DESC;
```

**Purpose:** Retrieves a user's notes tagged `work`. The ownership condition prevents tags owned by another user from being used to expose their data.

### Query 5: Update a note

```sql
UPDATE notes
SET title = 'Updated meeting notes',
    content = 'Revised content',
    updated_at = NOW()
WHERE id = 10
  AND user_id = 1
RETURNING id, title, content, updated_at;
```

**Purpose:** Updates a note only if it belongs to the specified user. If no row is returned, the note may not exist or may not belong to that user.

## 5. Indexing Strategy

Indexes improve lookup and sorting performance, but they consume storage and add work to insert, update, and delete operations.

### Index 1: Notes by user and update time

```sql
CREATE INDEX idx_notes_user_updated
ON notes (user_id, updated_at DESC);
```

**Reason:** Supports the common operation of listing one user's notes in recently updated order. The leading `user_id` column helps filter notes by owner.

### Index 2: Tags by user

The unique constraint on `(user_id, name)` in the `tags` table automatically creates a unique index. It supports looking up a tag by name for a particular user and prevents duplicates.

No separate index on the same column combination is needed.

### Index 3: Reverse note-tag lookup

```sql
CREATE INDEX idx_note_tags_tag_note
ON note_tags (tag_id, note_id);
```

**Reason:** The primary key on `(note_id, tag_id)` supports finding tags for a note. This additional index supports the reverse operation of finding notes associated with a tag.

### Index 4: User email

The `UNIQUE` constraint on `users.email` automatically creates a unique index. This supports login lookups and prevents duplicate email addresses.

Indexes should be reviewed using query plans and production metrics as usage grows.

## 6. Data Integrity and Security

The schema uses:

- **Primary keys** to identify rows uniquely.
- **Foreign keys** to maintain relationships between tables.
- **NOT NULL constraints** to require essential values.
- **Unique constraints** to prevent duplicate email addresses and duplicate tag names per user.
- **Transactions** to keep related changes consistent.
- **Ownership checks** to prevent users from accessing or modifying another user's notes and tags.
- **Secure password hashing** rather than plaintext password storage.

When assigning a tag to a note, the application should verify that the note and tag belong to the same user within a transaction. Foreign keys alone do not guarantee that both records share the same owner.

## 7. SQL Versus NoSQL

### Why PostgreSQL is the primary choice

PostgreSQL is a good fit because QuickNotes has clear relationships among users, notes, and tags.

Its advantages include:

- Transactions and relational constraints for data consistency.
- SQL joins for retrieving notes and tags.
- Unique constraints for enforcing data rules.
- Indexes for efficient lookups.
- A mature ecosystem for backups, monitoring, replication, and scaling.

### Why not use NoSQL as the primary database?

A document database could store notes and tags in flexible documents, but relationships, shared tags, and consistency rules may require additional application logic or duplicated data.

At this stage, the structured relationships and transactional requirements make PostgreSQL the simpler primary choice.

NoSQL could be considered later for specific workloads, such as caching or flexible event data, if measured requirements justify it. It is not necessary to introduce a second database solely because the system may reach one million registered users.

## 8. Scaling Considerations

To support growth:

1. Add indexes based on actual query patterns and measured performance.
2. Use connection pooling to control the number of active database connections.
3. Paginate note-list responses rather than returning every note at once.
4. Add read replicas if read traffic grows beyond the primary database's capacity, while directing writes to the primary.
5. Use automated backups and test restoration procedures.
6. Monitor query latency, storage growth, connection utilization, and replication lag.
7. Consider partitioning or sharding only if measurements show that simpler scaling approaches are insufficient.

## 9. Conclusion

This data model provides four related tables, executable PostgreSQL schema definitions, SQL queries with joins, an indexing strategy, and a database technology justification. It supports the core QuickNotes features while providing a foundation for data integrity, user isolation, and future scaling.