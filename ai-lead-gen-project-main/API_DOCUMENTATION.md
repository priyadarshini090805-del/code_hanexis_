# HaneXes API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:3000/api` or `https://api.hanexes.com/api`  
**Authentication:** JWT Bearer Token  

---

## Authentication Endpoints

### Get CSRF Token
```
GET /auth/csrf-token
```
**Response:**
```json
{
  "success": true,
  "csrfToken": "a1b2c3d4e5f6..."
}
```

### Register User
```
POST /auth/register
Content-Type: application/json
X-CSRF-Token: token_from_csrf_endpoint

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```
**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "user-123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json
X-CSRF-Token: token

{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "user-123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "USER"
    }
  }
}
```

### Refresh Token
```
POST /auth/refresh
Authorization: Bearer access_token

{
  "refreshToken": "eyJhbGc..."
}
```
**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer access_token
X-CSRF-Token: token
```
**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Forgot Password
```
POST /auth/forgot-password
Content-Type: application/json
X-CSRF-Token: token

{
  "email": "john@example.com"
}
```

### Reset Password
```
POST /auth/reset-password
Content-Type: application/json
X-CSRF-Token: token

{
  "token": "reset-token-from-email",
  "password": "NewSecure456!",
  "confirmPassword": "NewSecure456!"
}
```

### Get Sessions
```
GET /auth/sessions
Authorization: Bearer access_token
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "activeSessionCount": 2,
    "sessions": [...],
    "lastLogin": "2024-01-01T00:00:00Z",
    "lastLoginIp": "192.168.1.1"
  }
}
```

### Delete Session
```
DELETE /auth/sessions
Authorization: Bearer access_token
X-CSRF-Token: token

{
  "sessionId": "session-123"
}
```

### Logout All Devices
```
DELETE /auth/sessions
Authorization: Bearer access_token
X-CSRF-Token: token

{
  "logoutAllDevices": true
}
```

---

## Lead Management Endpoints

### List Leads
```
GET /leads?search=John&status=NEW&skip=0&take=20&sort=createdAt&order=desc
Authorization: Bearer access_token
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": "lead-123",
        "userId": "user-123",
        "firstName": "John",
        "lastName": "Smith",
        "email": "john@company.com",
        "company": "ABC Corp",
        "status": "NEW",
        "score": 75,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "skip": 0,
      "take": 20,
      "pages": 5
    }
  }
}
```

### Get Lead
```
GET /leads/lead-123
Authorization: Bearer access_token
```

### Create Lead
```
POST /leads
Authorization: Bearer access_token
Content-Type: application/json
X-CSRF-Token: token

{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@company.com",
  "phone": "+1234567890",
  "company": "ABC Corp",
  "jobTitle": "Manager",
  "linkedinUrl": "https://linkedin.com/in/johnsmith",
  "instagramHandle": "@johnsmith",
  "source": "LinkedIn",
  "notes": "Interested in our product"
}
```

### Update Lead
```
PUT /leads/lead-123
Authorization: Bearer access_token
Content-Type: application/json
X-CSRF-Token: token

{
  "firstName": "John",
  "company": "XYZ Inc",
  "status": "CONTACTED"
}
```

### Delete Lead
```
DELETE /leads/lead-123
Authorization: Bearer access_token
X-CSRF-Token: token
```

### Change Lead Status
```
POST /leads/lead-123/status
Authorization: Bearer access_token
Content-Type: application/json
X-CSRF-Token: token

{
  "status": "QUALIFIED"
}
```

### Add Tag to Lead
```
POST /leads/lead-123/tags
Authorization: Bearer access_token
Content-Type: application/json
X-CSRF-Token: token

{
  "tagId": "tag-456"
}
```

### Remove Tag from Lead
```
DELETE /leads/lead-123/tags?tagId=tag-456
Authorization: Bearer access_token
X-CSRF-Token: token
```

---

## Tag Management Endpoints

### List Tags
```
GET /tags
Authorization: Bearer access_token
```

### Create Tag
```
POST /tags
Authorization: Bearer access_token
Content-Type: application/json
X-CSRF-Token: token

{
  "name": "Hot Lead",
  "color": "#FF0000"
}
```

### Update Tag
```
PUT /tags/tag-123
Authorization: Bearer access_token
Content-Type: application/json
X-CSRF-Token: token

{
  "name": "Cold Lead",
  "color": "#0000FF"
}
```

### Delete Tag
```
DELETE /tags/tag-123
Authorization: Bearer access_token
X-CSRF-Token: token
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "email": ["Invalid email address"]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "CSRF token validation failed"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Lead not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too many login attempts. Please try again in 15 minutes."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Authentication Headers

All requests (except CSRF token and OAuth) require:
```
Authorization: Bearer <access_token>
X-CSRF-Token: <csrf_token>
```

---

## Rate Limiting

- **Auth endpoints:** 5 requests per 15 minutes per IP
- **API endpoints:** 100 requests per minute per user
- **Response headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Failed |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Enums

**LeadStatus:**
- NEW
- CONTACTED
- QUALIFIED
- CONVERTED
- LOST

**UserRole:**
- SUPER_ADMIN
- ADMIN
- MANAGER
- SALES
- USER

---

## Pagination

For list endpoints, use:
- `skip` - Number of records to skip (default: 0)
- `take` - Number of records to return (default: 20, max: 100)

Example: `/leads?skip=20&take=20` returns records 21-40

---

## Filtering & Search

**Lead endpoints support:**
- `search` - Search firstName, lastName, email, company, phone
- `status` - Filter by lead status
- `source` - Filter by lead source
- `sort` - Sort by: createdAt, updatedAt, firstName
- `order` - asc or desc

Example: `/leads?search=john&status=NEW&sort=createdAt&order=desc`

