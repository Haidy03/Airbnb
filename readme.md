# 🏠 Airbnb Clone & Services Marketplace
> **A Next-Gen Hospitality Platform:** Integrating Homes, Experiences, and On-Demand Services into a single ecosystem empowered by AI.

![Angular](https://img.shields.io/badge/Angular-17%2B-dd0031?style=flat&logo=angular)
![.NET](https://img.shields.io/badge/.NET-8.0-512bd4?style=flat&logo=dotnet)
![SQL Server](https://img.shields.io/badge/SQL_Server-2019%2B-CC2927?style=flat&logo=microsoft-sql-server)
![SignalR](https://img.shields.io/badge/SignalR-RealTime-blue?style=flat)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat&logo=openai)

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features & Modules](#-key-features--modules)
3. [System Architecture](#-system-architecture)
4. [Database Schema](#-database-schema)
5. [Tech Stack](#-tech-stack)
6. [Getting Started](#-getting-started)
7. [API Reference](#-api-reference)

---

## 🎯 Project Overview
This project is a full-stack platform developed as a graduation project for the **ITI Full Stack .NET Program**. It goes beyond traditional rental platforms by introducing a **Services Marketplace** (e.g., private chefs, cleaning, training) alongside **Property Rentals** and **Experiences**.

**Unique Selling Points (USPs):**
*   **Unified Booking System:** One account to book a villa, a tour, and a personal trainer.
*   **AI Assistant:** A GPT-4o powered chatbot using RAG (Retrieval-Augmented Generation) to recommend listings based on real-time database availability.
*   **Complex Availability Logic:** Handling both nightly bookings (Homes) and time-slot bookings (Services).

---

## ✨ Key Features & Modules

### 👤 Guest Module
*   **Smart Search:** Filter by location, dates, price, amenities, and category.
*   **AI Chat:** "Find me a villa in Cairo for 5 people" – The AI responds with actual listings.
*   **Real-Time Chat:** Instant messaging with Hosts via **SignalR**.
*   **Wishlists:** Save favorite homes and services.
*   **Trips Management:** View upcoming, past, and pending bookings.

### 🏠 Host Module
*   **Listing Wizard:** A multi-step process to create Properties, Services, or Experiences with draft saving capabilities.
*   **Calendar & Availability:** 
    *   *Properties:* Block specific dates and manage nightly rates.
    *   *Services:* Define working hours and duration slots (e.g., 10:00 AM - 11:00 AM).
*   **Earnings Dashboard:** Analytics for total revenue, monthly breakdown, and pending payouts.
*   **Request Management:** Accept or Reject booking requests.

### 👑 Admin Module
*   **Identity Verification:** Review uploaded ID documents for new hosts.
*   **Content Moderation:** Approve/Reject new listings before they go live.
*   **Analytics:** Platform-wide revenue, occupancy rates, and user growth charts.
*   **User Management:** Block users or resolve disputes.

---

## 🏗 System Architecture

The project follows a **Clean N-Tier Architecture** to ensure scalability and maintainability.

### 🔙 Backend (.NET 9 Web API)
1.  **Presentation Layer (Controllers):** Handles HTTP requests, validation, and JWT authorization.
2.  **Service Layer (Business Logic):**
    *   *Complex Logic:* `ServicesService` handles time-slot parsing and package pricing.
    *   *Integrations:* `PaymentService` (Stripe), `ChatService` (OpenAI), `EmailService` (MailKit).
3.  **Repository Layer (Data Access):**
    *   Implements the **Repository Pattern** to decouple EF Core from business logic.
    *   Uses **Transactions** (e.g., `DeletePropertyDeepAsync`) to ensure data integrity when deleting complex entities.

### 🎨 Frontend (Angular 17)
*   **Standalone Components:** Modern Angular structure without NgModules.
*   **Signals:** Used for reactive state management (e.g., Chat Inbox, Filters).
*   **Guards:** `HostGuard`, `AdminGuard`, and `AuthGuard` for route security.
*   **Interceptors:** Automatically attaches JWT tokens to outgoing requests.

---

## 🗄 Database Schema
The database (SQL Server) is designed with **Polymorphic Relationships** to handle different booking types.

### Key Tables
*   **AspNetUsers:** Extends IdentityUser (First Name, Last Name, Profile Pic, Verification Status).
*   **Properties:** Stores rental homes data (Location, Pricing, Amenities).
*   **Services:** Stores service data (Hourly Rate, Categories, `AvailabilityJson` for slots).
*   **Experiences:** Stores activity data (Group Size, Duration).
*   **Bookings / ServiceBookings / ExperienceBookings:** Dedicated tables for each type to handle specific logic (Nights vs. Slots).
*   **Conversations:** Central hub for chat, linking Users to a Context (PropertyId OR ServiceId OR ExperienceId).
*   **Reviews:** Polymorphic table handling reviews for Guests, Hosts, Properties, and Services.

---

## 🛠 Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | .NET 9.0 (Backend), Angular 17 (Frontend) |
| **Language** | C# (C Sharp), TypeScript |
| **Database** | Microsoft SQL Server |
| **ORM** | Entity Framework Core (Code-First) |
| **Real-Time** | SignalR (WebSockets) |
| **AI** | OpenAI API (GPT-4o) |
| **Maps** | Leaflet (ngx-leaflet) |
| **Payments** | Stripe & PayPal (ngx-paypal) |
| **Styling** | Bootstrap 5, Custom CSS, FontAwesome |
| **Email** | MailKit (SMTP) |

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   .NET 9.0 SDK
*   SQL Server

### 1. Backend Setup
1.  Navigate to the API folder.
2.  Update `appsettings.json` with your connection string and API keys.
3.  Apply Migrations:
    ```bash
    dotnet ef database update
    ```
4.  Run the API:
    ```bash
    dotnet run
    ```
    *Server starts at: `https://localhost:5202`*

### 2. Frontend Setup
1.  Navigate to the Angular project folder.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the application:
    ```bash
    ng serve
    ```
    *App runs at: `http://localhost:4200`*

---

## 🔌 API Reference
Once the backend is running, full Swagger documentation is available at:
👉 **`https://localhost:5202/swagger`**

### Key Endpoints
*   **Auth:** `POST /api/Auth/login`, `POST /api/Auth/register`, `POST /api/Auth/become-host`
*   **Properties:** `GET /api/Properties`, `POST /api/host/Property`
*   **Services:** `GET /api/Services`, `POST /api/Services/book`
*   **Chat:** `POST /api/Chat` (AI), `GET /api/Messages/conversations` (User Chat)
*   **Admin:** `GET /api/Admin/dashboard/stats`, `PUT /api/Admin/users/{id}/block`



