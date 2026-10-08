# QuickNotes Data Model

## Overview

QuickNotes uses a relational SQL database because the system has structured data and clear relationships between users, notes, and tags.

## Entities

### 1. Users

| Column | Type | Key / Constraint |
|---|---|---|
| id | BIGINT | Primary Key |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

### 2. Notes

| Column | Type | Key / Constraint |
|---|---|---|
| id | BIGINT | Primary Key |
| user_id | BIGINT | Foreign Key → users.id |
| title | VARCHAR(100) | NOT NULL |
| body | TEXT | NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### 3. Tags

| Column | Type | Key / Constraint |
|---|---|---|
| id | BIGINT | Primary Key |
| name | VARCHAR(50) | UNIQUE, NOT NULL |

### 4. Note Tags

| Column | Type | Key / Constraint |
|---|---|---|
| note_id | BIGINT | Foreign Key → notes.id |
| tag_id | BIGINT | Foreign Key → tags.id |

The primary key of `note_tags` is the combination of `note_id` and `tag_id`.

## Relationships

### Users to Notes

One user can have many notes.

**Relationship: 1-to-many**

```text
users 1 ─────────── * notes