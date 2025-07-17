# Book Review API Documentation

## Overview
A RESTful API for managing a book review system with user authentication, role-based access control, and CRUD operations for books and reviews.

## Base URL
```
http://localhost:5000/api
```

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. After successful login, the token is:
- Stored as an HTTP-only cookie
- Valid for 24 hours
- Required for protected routes

## User Roles
- **Admin**: Can manage books (add, edit, delete) and all user operations
- **User**: Can manage their own reviews and view books

---

## Endpoints

# Book Management System API Documentation

## Base URL
```
http://localhost:3000/api
```

---

### 1. Get Books and Reviews (Separate)
**GET** `/getBooksAndReviews`

Returns books and reviews as separate arrays.

**Response:**
```json
{
  "books": [
    {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "year": 1925,
      "availability": true
    }
  ],
  "reviews": [
    {
      "id": 1,
      "user_id": 1,
      "book_id": 1,
      "rating": 5,
      "comment": "Excellent book!"
    }
  ]
}
```

### 2. Get Books with Reviews (Joined)
**GET** `/getBooksWithReviews`

Returns raw joined data from books and reviews tables.

**Response:**
```json
{
  "data": [
    {
      "book_id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "year": 1925,
      "availability": true,
      "review_id": 1,
      "user_id": 1,
      "rating": 5,
      "comment": "Excellent book!"
    }
  ]
}
```

### 3. Get Average Ratings
**GET** `/average-ratings`

Returns average ratings and review counts for all books.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "book_id": 1,
      "average_rating": 4.5,
      "total_reviews": 3
    }
  ]
}
```

### 4. Get Final Data (Grouped)
**GET** `/finalData`

Returns books with their reviews grouped together in a structured format.

**Response:**
```json
{
  "books": [
    {
      "book_id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "year": 1925,
      "availability": true,
      "reviews": [
        {
          "review_id": 1,
          "user_id": 1,
          "rating": 5,
          "comment": "Excellent book!"
        },
        {
          "review_id": 2,
          "user_id": 2,
          "rating": 4,
          "comment": "Good read"
        }
      ]
    }
  ]
}
```

**Error Response:**
```json
{
  "message": "Internal server error"
}
```

### 1. Authentication

#### Register User
```http
POST /register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response:**
```json
{
  "message": "User registered successfully"
}
```

**Status Codes:**
- `201`: Success
- `400`: Missing required fields
- `409`: Email already registered
- `500`: Server error

---

#### Login User
```http
POST /login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response:**
```json
{
  "message": "user login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing fields or invalid role
- `401`: Invalid credentials
- `404`: User not found
- `500`: Server error

---

### 2. Books (Admin Only)

#### Add Book
```http
POST /addBook
```
**Authentication Required**: Admin only

**Request Body:**
```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "year": 1925,
  "availability": true
}
```

**Response:**
```json
{
  "message": "Book added successfully",
  "bookId": 1
}
```

**Status Codes:**
- `201`: Success
- `400`: Missing required fields
- `403`: Forbidden (non-admin user)
- `500`: Server error

---

#### Edit Book
```http
PATCH /editBook
```
**Authentication Required**: Admin only

**Request Body:**
```json
{
  "book_id": 1,
  "title": "The Great Gatsby (Updated)",
  "author": "F. Scott Fitzgerald",
  "year": 1925,
  "availability": false
}
```

**Response:**
```json
{
  "message": "Book updated successfully"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing book ID
- `403`: Forbidden (non-admin user)
- `404`: Book not found
- `500`: Server error

---

#### Delete Book
```http
DELETE /deleteBook
```
**Authentication Required**: Admin only

**Request Body:**
```json
{
  "bookId": 1
}
```

**Response:**
```json
{
  "message": "Book deleted successfully"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing book ID
- `403`: Forbidden (non-admin user)
- `404`: Book not found
- `500`: Server error

---

### 3. Reviews (User Operations)

#### Add Review
```http
POST /addReview
```
**Authentication Required**: User or Admin

**Request Body:**
```json
{
  "book_id": 1,
  "rating": 5,
  "comment": "Excellent book! Highly recommended."
}
```

**Response:**
```json
{
  "message": "Review added successfully",
  "reviewId": 1
}
```

**Status Codes:**
- `201`: Success
- `400`: Missing required fields or invalid rating
- `401`: Unauthorized
- `500`: Server error

**Notes:**
- Rating must be between 1 and 5
- Comment is optional

---

#### Edit Review
```http
PATCH /editReview
```
**Authentication Required**: User or Admin (own reviews only)

**Request Body:**
```json
{
  "review_id": 1,
  "rating": 4,
  "comment": "Good book, but not perfect."
}
```

**Response:**
```json
{
  "message": "Review updated successfully"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing review ID or invalid rating
- `401`: Unauthorized
- `404`: Review not found or not owned by user
- `500`: Server error

---

#### Delete Review
```http
DELETE /deleteReview
```
**Authentication Required**: User or Admin (own reviews only)

**Request Body:**
```json
{
  "review_id": 1
}
```

**Response:**
```json
{
  "message": "Review deleted successfully"
}
```

**Status Codes:**
- `200`: Success
- `400`: Missing review ID
- `401`: Unauthorized
- `403`: Forbidden (not your review)
- `404`: Review not found
- `500`: Server error

---

### 4. Analytics

#### Get Average Ratings
```http
GET /average-ratings
```
**Authentication Required**: None

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "book_id": 1,
      "average_rating": 4.5,
      "total_reviews": 10
    },
    {
      "book_id": 2,
      "average_rating": 3.8,
      "total_reviews": 5
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `500`: Server error

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

## Common Error Responses

### 400 Bad Request
```json
{
  "message": "All fields are required"
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "message": "Only admin can edit books"
}
```

### 404 Not Found
```json
{
  "message": "Book not found"
}
```

### 409 Conflict
```json
{
  "message": "Email already registered"
}
```

### 500 Server Error
```json
{
  "message": "Server error",
  "error": "Database connection failed"
}
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user'
);
```

### Books Table
```sql
CREATE TABLE books (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  availability BOOLEAN DEFAULT TRUE
);
```

### Reviews Table
```sql
CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);
```

---

## Security Features

- **Password Hashing**: Uses bcrypt with salt rounds of 10
- **JWT Authentication**: Secure token-based authentication
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Role-Based Access Control**: Restricts admin operations
- **Input Validation**: Validates all user inputs
- **SQL Injection Prevention**: Uses parameterized queries

---


### Environment Variables Required:
```env
JWT_SECRET=your_jwt_secret_here
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=book_review_db
```

---
