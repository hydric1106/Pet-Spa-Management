# 🐾 Pawradise Spa - Pet Spa Management System

A modern desktop application for managing pet spa operations, built with **JavaFX** and **Spring Boot**.

![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-green)
![JavaFX](https://img.shields.io/badge/JavaFX-21.0.1-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)

## 📋 Overview

Pawradise Spa is a comprehensive management system designed for pet spa businesses. It provides a centralized dashboard for managing bookings, staff schedules, services, and customer records — all in one place.

### Key Features

- **Pet Profiles** - Keep detailed records of every pet including health notes, medical history, and styling preferences
- **Client CRM** - Manage customer relationships with appointment tracking and direct messaging
- **Smart Scheduling** - Optimize staff time with an intuitive calendar system
- **Booking Management** - Handle appointments, confirmations, and cancellations
- **Service Management** - Configure and manage spa services and pricing
- **Staff Management** - Manage employee schedules and assignments

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Java 21** | Core programming language |
| **JavaFX 21** | Desktop UI framework with WebView |
| **Spring Boot 3.2** | Backend framework & dependency injection |
| **Spring Data JPA** | Database ORM |
| **MySQL** | Database |
| **Tailwind CSS** | UI styling (via WebView) |
| **Maven** | Build tool & dependency management |

## 📁 Project Structure

```
PetSpaDesktop/
├── src/
│   └── main/
│       ├── java/com/petspa/
│       │   ├── bridge/          # JavaScript-Java bridge
│       │   ├── config/          # Spring configuration
│       │   ├── controller/      # Controllers
│       │   ├── dto/             # Data Transfer Objects
│       │   ├── model/           # JPA Entities
│       │   ├── repository/      # Spring Data repositories
│       │   └── service/         # Business logic services
│       └── resources/
│           ├── ui/              # HTML/CSS/JS frontend
│           └── application.properties
├── pom.xml
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Java 21** or higher
- **Maven 3.8+**
- **MySQL 8.0+**

### Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE pbl3;
```

2. Create the configuration file `src/main/resources/application.properties`:
```properties
# PET SPA DESKTOP APPLICATION CONFIGURATION

# Application Info
spring.application.name=PetSpaDesktop

# DATABASE CONFIGURATION (MySQL)
spring.datasource.url=jdbc:mysql://localhost:3306/pbl3?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&characterEncoding=UTF-8
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA / HIBERNATE CONFIGURATION
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.jdbc.time_zone=UTC

# CONNECTION POOL (HikariCP)
spring.datasource.hikari.connection-timeout=20000
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.maximum-pool-size=12
spring.datasource.hikari.idle-timeout=300000
spring.datasource.hikari.max-lifetime=1200000

# LOGGING CONFIGURATION
logging.level.root=INFO
logging.level.com.petspa=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

> **Note:** Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your MySQL credentials. This file is not included in the repository for security reasons.

### Tailwind CSS Setup

This project uses Tailwind CSS for styling. You need to set it up before running the application:

1. Install Node.js dependencies:
```bash
npm install
```

2. Build CSS (one-time build with minification):
```bash
npm run build:css
```

3. Or run in watch mode during development (auto-rebuilds on changes):
```bash
npm run tailwind
```

### Running the Application

```bash
# Clone the repository
git clone https://github.com/your-username/PetSpaDesktop.git
cd PetSpaDesktop

# Install Tailwind CSS dependencies
npm install

# Build CSS
npm run build:css

# Build and run with Maven
mvn clean javafx:run
```

## 📝 Architecture

This is a **hybrid application** that combines:
- **JavaFX** for the desktop window and WebView rendering
- **Spring Boot** for backend logic, dependency injection, and database operations
- **HTML/CSS/JS** rendered in WebView for modern UI

The application uses a **JavaBridge** to enable communication between the JavaScript frontend and Java backend services.

## 👥 Authors

- Tran Minh Quang - Hydric
