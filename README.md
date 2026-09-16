# 🎨Blog: Full-Stack Blogging & Social Platform

A responsive blog web application built from scratch. 
This platform supports user authentication, front-end interactions without full page reloads, a multi-level nested comment system, and an integrated WYSIWYG editor.

---
## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js, REST API with JWT (jsonwebtoken)
* **Frontend:** JavaScript (ES6+), Handlebars.js (Templating Engine), HTML5, CSS3
* **WYSIWYG Library:** Quill.js
* **Database:** MariaDB

---
## 📸 Demo

### Home Page (RWD)
<img src="./assets/home.png" width="600" alt="computer demo">
<img src="./assets/RWD.png" width="205" alt="mobile demo">

---
### Login Page
<img src="./assets/login.png" width="600" alt="computer demo">

---
### Add & Delete Comment Demo
![comment](assets/comment.gif)

---
## 📁 Project Architecture & Router Structure

The backend follows a modular design, decoupling routing logic into specific domains for maintainability:

```text
├── public/                 # Static assets (client-side JS, CSS, images)
├── middleware/             # Authentication middleware for routes to use
│   ├── auth.js             # Session check for the web pages
│   └── jwt-auth.js         # JWT Bearer token check for the REST API
├── routes/                 # Express modular routers
│   ├── main-routes.js      # Publicly accessible routes
│   ├── account-routes.js   # Auth routes (Register, Login, Profile Edit/Delete)
│   ├── post-routes.js      # Article operations (CRUD, Likes, Image uploads)
│   ├── comment-routes.js   # Nested comment operations (Create, Edit, Delete)
│   └── api-routes.js       # JSON REST API for posts (see "REST API" below)
├── utils/                  # Helpers shared by page routes and the API (HTML sanitizing)
├── views/                  # Handlebars views and layouts
│   ├── account/            
│   ├── layouts/            # Two layouts for different url to use
│   ├── partials/           # (comment, navbarTop, navbarBottom, postModal) 
│   └── home.handlebars     # Home page
├── db/                     # Set up database and all the SQL query functions
│   ├── db-connect.js       # connect to database
│   ├── post-dao.js         # functions related to posts/comments/likes tables
│   └── users-dao.js        # functions related to users/user_profiles tables
├── scripts/init-db.js      # Creates the schema and loads the demo data (npm run init-db)
├── .env.sample             # Template for required environment variables
├── *app.js*                # Main server entry point
├── init-db.sql             # Schema + demo data (users, posts, nested comments, likes)
└── package.json            # Dependencies and scripts
```

---
## 📊 Database Schema
![ERDiagram](assets/ERD.png)
---

## 🚀 Key Features

### 💬 Nested Comment System
* **Recursive Tree-Based Nesting:** Design a multi-level nested reply system (up to 3 levels: Comment ➡️ Reply ➡️ Sub-reply) by modeling comments as a **Tree Data Structure** (using self-referencing `parent_id` relations).
    Comments are loaded in creation order with a single SQL query, built into a tree, and rendered recursively with a Handlebars partial.
* **Flexible Moderation:** Comment authors can delete their own comments, while article authors hold full deletion privileges over any comment under their articles.
* **Collapsible UI:** Users can toggle the visibility of the comment section for a cleaner reading experience.

### 👤 User Account Management
* **Asynchronous Username Validation:** Use **AJAX / Fetch API** to check username availability instantly during registration without reloading the page.
* **Client-Side Password Matching:** Visual indicators ensure passwords match before enabling form submission.
* **Secure Authentication:** Passwords are securely **hashed and salted** before database storage. 
* **Custom Avatars & Profiles:** Users can choose predefined avatars, add bios, and update or delete their accounts (supports Cascading Deletes for user data).

### 📝 Article Management
* **WYSIWYG Rich Text Editing:** Integrated **Quill.js** to allow heading styles, bold, italic, underline, and list formatting without HTML exposure.
* **Image Upload Support:** Built-in capability to upload and attach a featured image per article.
* **Client-Side Sorting (No Reload):** Sort posts by date, category, username or title instantly in the browser, without a page reload or extra server request.
* **Interaction System:** Like/unlike via **AJAX (Fetch API)** without reloading the page; duplicate likes are prevented by a composite primary key, and the latest count is returned by the server.

### 🔌 REST API
Besides the server-rendered pages (HTML forms, session login), the app exposes a JSON REST API for posts under `/api`.
Reading is public; creating, updating and deleting require a **JWT Bearer token**.

| Method | Endpoint | Auth | Success | Errors |
|---|---|---|---|---|
| `POST` | `/api/auth/token` | – | `200` token | `400` missing fields, `401` wrong credentials |
| `GET` | `/api/posts` | – | `200` list of posts | – |
| `GET` | `/api/posts/:id` | – | `200` post | `400` invalid id, `404` not found |
| `POST` | `/api/posts` | JWT | `201` created post + `Location` header | `400` invalid body, `401` no/invalid token |
| `PUT` | `/api/posts/:id` | JWT | `200` updated post | `400`, `401`, `404` not found or not your post |
| `DELETE` | `/api/posts/:id` | JWT | `204` no content | `400`, `401`, `404` not found or not your post |

Example:
```bash
# 1. log in and get a token
curl -X POST http://localhost:3000/api/auth/token \
     -H "Content-Type: application/json" \
     -d '{"username": "alice", "password": "demo1234"}'
# -> {"access_token": "eyJ...", "token_type": "Bearer", "expires_in": 3600}

# 2. create a post with the token
curl -X POST http://localhost:3000/api/posts \
     -H "Authorization: Bearer eyJ..." \
     -H "Content-Type: application/json" \
     -d '{"category": "tech", "title": "Hello API", "content": "<p>Posted with curl</p>"}'
```
`category` must be one of `mood`, `life`, `tech`, `economy`. Errors are returned as `{"error": "..."}`.

### 🔒 Security Practices

* **SQL Injection Prevention:**  Uses **Prepared Statements**.
* **Credential Protection:** Passwords are never stored in plaintext (Salted + Hashed).
* **Environment Isolation:** Sensitive details are managed via `.env` files and excluded from version control.

---

## ⚙️ Installation & Setup

### Prerequisites
* Node.js (v20 or higher)
* npm
* MariaDB Server installed and running

### 1. Clone the repository
```bash
git clone https://github.com/deeumiya-huang/node-express-blog.git
cd node-express-blog
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the provided sample environment file and populate it with your configuration:
```bash
cp .env.sample .env
```
Open `.env` and fill in your values:
```env
EXPRESS_PORT=3000
SESSION_SECRET=your_super_secret_session_key
JWT_SECRET=another_long_random_string

# MariaDB Connection Details
DB_HOST=localhost
DB_USER=your_mariadb_user
DB_PASSWORD=your_mariadb_password
DB_DATABASE=web_db
```
`DB_DATABASE` can be any name you like; the next step creates it if it does not exist.

### 4. Create the tables and load the demo data
```bash
npm run init-db
```
This reads the connection details from your `.env`, creates the database if it does not exist yet, and runs `init-db.sql`.
⚠️ It drops the existing blog tables first, so only run it on a database you are happy to reset.

### 5. Run the application
```bash
npm start
```
The server will start, and you can access it at `http://localhost:3000/`.

### 6. Log in with a demo account
The demo data includes five users, all with the password **`demo1234`**:

| Username | Posts | Comments |
|---|---|---|
| `alice` | 4 (2 with images) | yes |
| `ben` | 2 | yes |
| `chloe` | 1 | yes |
| `dan` | – | yes |
| `emma` | – | yes |

Log in as `alice` to try editing and deleting posts, or as anyone else to comment and like.

> **A note on images:** only the `demo-*` images referenced by `init-db.sql` are kept in this repo.
> Images uploaded while using the app are user data that belongs with the database, so
> `public/assets/post-img/` and `public/assets/post-thumbnail/` are git-ignored.
> The app creates those folders on start, so uploading works right after cloning.

---
## 📝 Credits & Acknowledgments
* **[Quill.js](https://quilljs.com/)** - A powerful, open-source WYSIWYG editor built for the modern web. Used under the MIT License to power the rich text creation and editing capabilities for articles within this platform.

---
## Author
* **Ching-shing (Deeumiya) Huang**

## License
this project is licensed under the **MIT License**.
