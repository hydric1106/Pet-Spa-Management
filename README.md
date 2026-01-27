# 🐾 Paws & Bubbles - Pet Spa Management System

A modern desktop application for managing pet spa operations, built with **JavaFX** and **Spring Boot**.

![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-green)
![JavaFX](https://img.shields.io/badge/JavaFX-21.0.1-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)

## 📋 Overview

Paws & Bubbles is a comprehensive management system designed for pet spa businesses. It provides a centralized dashboard for managing bookings, staff schedules, services, and customer records — all in one place.

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

2. Update the database credentials in `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/pbl3
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### Running the Application

```bash
# Clone the repository
git clone https://github.com/your-username/PetSpaDesktop.git
cd PetSpaDesktop

# Build and run with Maven
mvn clean javafx:run
```

### Building a JAR

```bash
mvn clean package
java -jar target/petspa-desktop-1.0.0-SNAPSHOT.jar
```

## 🖥️ Screenshots

*Coming soon...*

## 📝 Architecture

This is a **hybrid application** that combines:
- **JavaFX** for the desktop window and WebView rendering
- **Spring Boot** for backend logic, dependency injection, and database operations
- **HTML/CSS/JS** rendered in WebView for modern UI

The application uses a **JavaBridge** to enable communication between the JavaScript frontend and Java backend services.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work*

## 🙏 Acknowledgments

- Spring Boot Team
- JavaFX Community
- Tailwind CSS

---

<p align="center">
  Made with ❤️ for pet care professionals
</p>
