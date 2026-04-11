# Penta-App Spring Boot Backend

This is a Spring Boot implementation of the backend services for the Penta-App study platform.

## Features
- **NLP Proxy**: Forwards requests to the Python NLP service (DialoGPT).
- **File Upload**: Handles file uploads with a 100MB limit.
- **REST API**: Provides endpoints for the React frontend.

## Prerequisites
- Java 17 or higher
- Maven 3.6 or higher

## Getting Started

1. **Navigate to the backend directory**:
   ```bash
   cd spring-boot-backend
   ```

2. **Build the application**:
   ```bash
   mvn clean install
   ```

3. **Run the application**:
   ```bash
   mvn spring-boot:run
   ```

The backend will start on `http://localhost:8080`.

## API Endpoints

- `POST /api/nlp`: Process NLP commands (chat, summarize, sentiment).
- `GET /api/nlp/health`: Check the health of the NLP service.
- `POST /api/upload`: Upload files to the `uploads/` directory.

## Configuration

You can modify the configuration in `src/main/resources/application.properties`.

- `server.port`: The port the backend runs on (default 8080).
- `nlp.service.url`: The URL of the Python NLP service (default http://localhost:5000).
- `upload.dir`: The directory where uploaded files are stored.
