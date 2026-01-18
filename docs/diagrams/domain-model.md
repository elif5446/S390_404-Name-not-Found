# Domain Model

## Overview
The Domain Model represents the key concepts and relationships in the problem domain of our application.

## Diagram

```mermaid
classDiagram
    class User {
        +String userId
        +String username
        +String email
        +String password
        +Date createdAt
        +login()
        +logout()
        +updateProfile()
    }
    
    class Profile {
        +String profileId
        +String firstName
        +String lastName
        +String bio
        +String avatarUrl
        +updateInfo()
    }
    
    class Post {
        +String postId
        +String title
        +String content
        +Date publishedAt
        +String status
        +create()
        +update()
        +delete()
    }
    
    class Comment {
        +String commentId
        +String content
        +Date createdAt
        +create()
        +update()
        +delete()
    }
    
    class Category {
        +String categoryId
        +String name
        +String description
        +addPost()
        +removePost()
    }
    
    User "1" -- "1" Profile : has
    User "1" -- "*" Post : creates
    User "1" -- "*" Comment : writes
    Post "1" -- "*" Comment : has
    Post "*" -- "*" Category : belongs to
```

## Key Entities

### User
Represents a registered user in the system with authentication capabilities.

### Profile
Contains detailed information about a user including personal details and preferences.

### Post
Represents content created by users that can be published and categorized.

### Comment
Represents user feedback and discussion on posts.

### Category
Represents a way to organize and classify posts.

## Relationships
- Each User has one Profile
- Users can create multiple Posts
- Users can write multiple Comments
- Posts can have multiple Comments
- Posts can belong to multiple Categories
