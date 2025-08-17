# Artsy - Full-Stack Angular Art Gallery Platform

A comprehensive full-stack web application built with Angular and Node.js that serves as an online art gallery and educational platform. Users can showcase their artwork, engage with a creative community, rate and comment on paintings, enroll in art courses, and apply to become instructors.

## 📑 Table of Contents

-  [Features](#-features)
-  [Technology Stack](#-technology-stack)
-  [Prerequisites](#-prerequisites)
-  [Frontend Implementation](#-frontend-implementation)
-  [Backend Implementation](#-backend-implementation)
-  [Installation](#-installation)
-  [API Documentation](#-api-documentation)
-  [Project Structure](#-project-structure)
-  [Usage](#-usage)
-  [License](#-license)

## ✨ Features

-  **User Authentication** - Secure registration, login, and logout functionality with JWT tokens
-  **Artwork Management** - Create, read, update, and delete paintings with full CRUD operations
-  **Community Gallery** - Browse and discover artworks from all community members
-  **Interactive Engagement** - Rate paintings (1-5 stars) and participate in nested comment discussions
-  **Course System** - Browse, enroll in, and manage art courses across various disciplines
-  **Teacher Platform** - Apply to become an instructor and create/manage courses
-  **User Dashboard** - Personalized profile to manage paintings, track course enrollments, and monitor activity
-  **Admin Panel** - Comprehensive administration tools for user management and content moderation
-  **Responsive Design** - Optimized layout for desktop, tablet, and mobile devices

## 💻 Usage

1. **Register** - Create a new account with email and password
2. **Browse Gallery** - Explore community artworks with filtering options
3. **Upload Art** - Share your creations with title, description, and dimensions
4. **Engage** - Rate and comment on other artists' work
5. **Enroll in Courses** - Join art courses to improve your skills
6. **Apply as Teacher** - Submit an application to become an instructor
7. **Admin Access** - Use `doriadmin@gmail.com` for admin panel access

## 🚀 Technology Stack

### Frontend

-  **Angular 18.2.12** - Component-based SPA framework
-  **TypeScript** - Type-safe JavaScript development
-  **RxJS** - Reactive programming for async operations
-  **Angular Router** - Client-side routing and navigation
-  **Reactive Forms** - Dynamic form handling and validation
-  **Font Awesome** - Icon library integration
-  **Custom Typography** - Orpheus Pro & Adobe Garamond Pro fonts

### Backend

-  **Node.js** - JavaScript runtime environment
-  **Express.js** - Web application framework
-  **MongoDB** - NoSQL database for data persistence
-  **Mongoose** - MongoDB object modeling and validation
-  **JWT** - Secure token-based authentication
-  **bcrypt** - Password hashing and security
-  **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

-  Node.js (v18.0.0 or higher)
-  MongoDB (v5.0 or higher)
-  npm (v9.0.0 or higher) or yarn
-  Angular CLI
-  Git for version control

## 🎨 Frontend Implementation

The frontend leverages Angular's powerful features to create a dynamic, maintainable, and scalable single-page application.

### Architecture & Best Practices

-  **Standalone Components** - Utilizing Angular's latest standalone component architecture for better tree-shaking and faster builds
-  **Lazy Loading** - Implementing route-based code splitting for optimized initial load times
-  **Service-Oriented Architecture** - Centralized ApiService handling all HTTP communications with interceptors for authentication
-  **Reactive Programming** - Extensive use of RxJS observables for asynchronous data flow and state management
-  **Route Guards** - Implementing AuthGuard, GuestGuard, AdminGuard, and TeacherGuard for role-based access control
-  **Responsive Design** - Mobile-first approach with CSS Grid and Flexbox layouts

### Reusable Components

-  **ConfirmationModal** - Shared modal component for delete confirmations and user actions
-  **Navigation Component** - Dynamic navigation bar adapting to user authentication state
-  **Form Validators** - Custom validation directives for form inputs
-  **Star Rating Component** - Reusable rating system across paintings and courses

### Key Components

#### Authentication System

-  **RegisterComponent** - User registration with form validation and error handling
-  **LoginComponent** - Secure login with JWT token storage
-  **LogoutComponent** - Graceful logout with token cleanup
-  **AuthGuard** - Route protection for authenticated routes

#### CRUD Operations

-  **UploadComponent** - Create new paintings with image URL, dimensions, and metadata
-  **GalleryComponent** - Read and display paintings with filtering and pagination
-  **EditPaintingComponent** - Update existing paintings with real-time preview
-  **Profile Management** - Delete paintings with confirmation dialogs

#### User Profile & Dashboard

-  **ProfileComponent** - Comprehensive user profile with editable fields
-  **TeacherDashboardComponent** - Dedicated dashboard for course management
-  **AdminLayoutComponent** - Admin panel with nested routing and statistics
-  **CourseDetailsComponent** - Detailed course view with enrollment functionality

### Angular Features Utilized

-  **Dependency Injection** - Service injection for API calls and shared functionality
-  **Two-way Data Binding** - Real-time form updates with `[(ngModel)]`
-  **Structural Directives** - Dynamic rendering with `*ngIf`, `*ngFor`
-  **Pipes** - Data transformation with built-in and custom pipes
-  **HTTP Interceptors** - Automatic token attachment to API requests
-  **Form Controls** - Reactive forms with validation and error states

## 🔧 Backend Implementation

The backend is built with Node.js and Express.js, providing a robust RESTful API that connects to a MongoDB database.

### Features

-  **RESTful API Endpoints** - Well-structured routes following REST conventions
-  **JWT Authentication** - Secure token-based authentication with expiration handling
-  **MongoDB Integration** - Efficient database operations with Mongoose ODM
-  **Data Validation** - Schema-based validation with custom error messages
-  **Error Handling** - Centralized error handling with appropriate HTTP status codes
-  **File Structure** - MVC architecture with separated controllers, models, and routes
-  **Middleware** - Custom middleware for authentication, validation, and CORS
-  **Password Security** - bcrypt hashing with salt rounds for password protection
-  **Relationship Management** - MongoDB references and population for related data
-  **Aggregation Pipeline** - Complex queries for statistics and ratings

## 🔧 Installation

### Backend Setup

1. Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

2. Start the backend server:

```bash
npm run dev  # Development mode with nodemon
# or
npm start    # Production mode
```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. Open a new terminal and navigate to the Angular directory:

```bash
cd Artsy
npm install
```

2. Start the Angular development server:

```bash
ng serve
```

The application will be accessible at `http://localhost:4200`

3. For production build:

```bash
ng build --configuration production
```

## 📡 API Documentation

### Base URL

```
http://localhost:8000/atp
```

### Main Endpoints

| Method | Endpoint              | Description         | Auth Required |
| ------ | --------------------- | ------------------- | ------------- |
| POST   | `/users/register`     | User registration   | No            |
| POST   | `/users/login`        | User authentication | No            |
| GET    | `/users/profile`      | Get user profile    | Yes           |
| GET    | `/paintings/catalog`  | Get all paintings   | No            |
| POST   | `/paintings/upload`   | Upload new painting | Yes           |
| PUT    | `/paintings/:id`      | Update painting     | Yes           |
| DELETE | `/paintings/:id`      | Delete painting     | Yes           |
| GET    | `/courses`            | Get all courses     | No            |
| POST   | `/courses`            | Create course       | Teacher       |
| POST   | `/courses/:id/enroll` | Enroll in course    | Yes           |

## 📁 Project Structure

```
artsy/
├── .angular/                    # Frontend Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/          # Admin panel components
│   │   │   ├── guards/         # Route protection
│   │   │   ├── shared/         # Reusable components
│   │   │   ├── api.service.ts  # API communication
│   │   │   └── app.routes.ts   # Application routing
│   │   └── environments/       # Environment configurations
│   └── angular.json            # Angular workspace config
│
└── server/                     # Backend Application
    ├── src/
    │   ├── controllers/        # Business logic
    │   ├── models/            # Database schemas
    │   ├── routes/            # API endpoints
    │   └── index.js           # Server entry point
    └── package.json           # Dependencies
```

## 📄 License

This project is developed for academic purposes as part of an Angular development examination.
