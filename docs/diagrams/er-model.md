# Entity-Relationship (ER) Model

## Overview
The ER Model defines the database structure, showing entities, their attributes, and relationships between them.

## Diagram

```mermaid
erDiagram
    USER ||--o| PROFILE : has
    USER ||--o{ POST : creates
    USER ||--o{ COMMENT : writes
    POST ||--o{ COMMENT : contains
    POST }o--o{ CATEGORY : "belongs to"
    POST }o--o{ POST_CATEGORY : through
    CATEGORY }o--o{ POST_CATEGORY : through
    
    USER {
        varchar user_id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        timestamp created_at
        timestamp updated_at
        boolean is_active
        varchar role
    }
    
    PROFILE {
        varchar profile_id PK
        varchar user_id FK
        varchar first_name
        varchar last_name
        text bio
        varchar avatar_url
        varchar location
        date date_of_birth
        timestamp created_at
        timestamp updated_at
    }
    
    POST {
        varchar post_id PK
        varchar user_id FK
        varchar title
        text content
        varchar status
        integer view_count
        timestamp published_at
        timestamp created_at
        timestamp updated_at
    }
    
    COMMENT {
        varchar comment_id PK
        varchar post_id FK
        varchar user_id FK
        text content
        varchar parent_comment_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    CATEGORY {
        varchar category_id PK
        varchar name UK
        text description
        varchar slug UK
        timestamp created_at
        timestamp updated_at
    }
    
    POST_CATEGORY {
        varchar post_id FK
        varchar category_id FK
        timestamp created_at
    }
```

## Entity Descriptions

### USER
Stores user account information and credentials.
- **Primary Key**: user_id
- **Unique Keys**: username, email
- **Relationships**: 
  - Has one PROFILE
  - Creates many POSTs
  - Writes many COMMENTs

### PROFILE
Contains detailed user profile information.
- **Primary Key**: profile_id
- **Foreign Keys**: user_id (references USER)
- **Relationships**: Belongs to one USER

### POST
Represents content created by users.
- **Primary Key**: post_id
- **Foreign Keys**: user_id (references USER)
- **Relationships**: 
  - Belongs to one USER
  - Contains many COMMENTs
  - Belongs to many CATEGORYs (through POST_CATEGORY)

### COMMENT
Represents user comments on posts.
- **Primary Key**: comment_id
- **Foreign Keys**: 
  - post_id (references POST)
  - user_id (references USER)
  - parent_comment_id (references COMMENT, for nested comments)
- **Relationships**: 
  - Belongs to one POST
  - Belongs to one USER
  - Can have parent COMMENT (for threading)

### CATEGORY
Represents classification categories for posts.
- **Primary Key**: category_id
- **Unique Keys**: name, slug
- **Relationships**: Associated with many POSTs (through POST_CATEGORY)

### POST_CATEGORY
Junction table for many-to-many relationship between posts and categories.
- **Composite Primary Key**: (post_id, category_id)
- **Foreign Keys**: 
  - post_id (references POST)
  - category_id (references CATEGORY)

## Indexing Strategy
- Primary keys on all tables
- Unique indexes on username, email (USER)
- Unique indexes on name, slug (CATEGORY)
- Foreign key indexes for improved join performance
- Index on post.published_at for chronological queries
- Index on comment.post_id for efficient comment retrieval

## Data Constraints
- user.email must be valid email format
- user.password_hash must be securely hashed
- post.status enum: ['draft', 'published', 'archived']
- user.role enum: ['user', 'moderator', 'admin']
- Timestamps automatically managed by database
