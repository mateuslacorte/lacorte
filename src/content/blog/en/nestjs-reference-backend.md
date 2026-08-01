---
title: NestJS Reference Backend
date: '2026-01-06'
tags:
  - portfolio
  - nestjs
  - backend
  - typescript
  - graphql
  - reference
description: >-
  A comprehensive NestJS backend template with everything you could possibly
  need. And probably a lot you don't. It's a reference project which you can use
  as a start point for anything.
---


I built this NestJS backend as a reference project and starting template for modern backend applications. After setting up the same features repeatedly across different projects, I decided to create a comprehensive base that includes all the common patterns and integrations you'd typically need.


## The Project


This is a production-ready NestJS backend template that provides a solid foundation for building scalable applications. It includes authentication, database integrations, caching, file uploads, real-time communication, and more—all properly structured and ready to use.


The goal was to create something that developers could clone and immediately start building their business logic on top of, without having to spend time setting up boilerplate code for common features.


## The Tech Stack


**Core Framework:**
- **NestJS** - Enterprise-grade Node.js framework
- **TypeScript** - For type safety and better developer experience
- **GraphQL (Apollo)** - Modern API query language
- **REST APIs** - Traditional HTTP endpoints


**Databases:**
- **MongoDB** (Mongoose/Typegoose) - Document database for flexible schemas
- **PostgreSQL** (TypeORM) - Relational database for structured data
- **Redis** - In-memory caching layer


**Authentication & Security:**
- **JWT** - Token-based authentication
- **Passport** - Authentication strategies
- **bcrypt** - Password hashing
- **Rate limiting** - Protection against abuse


**Real-time & Communication:**
- **WebSockets** (Socket.io) - Real-time bidirectional communication
- **Email** (Nodemailer) - SMTP email service
- **WhatsApp** - Messaging integration
- **Kafka** - Message queue for event-driven architecture


**Storage & Files:**
- **MinIO** - S3-compatible object storage
- **File upload service** - Handles multipart file uploads


**Logging & Monitoring:**
- **Logtail** - Centralized log aggregation


**Documentation:**
- **Swagger** - Interactive API documentation
- **Wiki** - Built-in documentation system


**Other Features:**
- **Scheduled tasks** - Cron job support
- **Image processing** - Canvas/Jimp integration
- **QR code scanning** - Barcode reading capabilities


## Key Features


### Authentication & Authorization


Complete JWT-based authentication system with role-based access control (RBAC). Includes login, registration, password reset, and refresh token functionality.


### Multi-Database Support


Flexible database architecture supporting both MongoDB (for document storage) and PostgreSQL (for relational data), allowing you to choose the right tool for each use case.


### Caching System


Redis-based caching with decorators for easy method-level caching. Includes interceptors for both Mongoose and TypeORM to automatically cache query results.


### File Upload Service


Robust file upload handling with MinIO integration for object storage. Supports validation, processing, and secure file serving.


### WebSocket Gateway


Abstract WebSocket gateway that makes it easy to add real-time features to your application. Includes message validation and handler patterns.


### GraphQL & REST


Both GraphQL and REST APIs are available, so you can choose the right approach for your frontend or use both simultaneously.


### Security Features


Built-in security module with IP blocking, rate limiting, and comprehensive request validation. Global JWT guard protects all routes by default.


### Documentation


Swagger UI for API documentation and a built-in wiki system for project documentation, making it easy to onboard new developers.


## Architecture


The project follows NestJS best practices with a modular architecture:
- **Modules** - Feature-based modules (auth, users, email, etc.)
- **Common** - Shared utilities and services (cache, file upload, WebSocket, security)
- **Config** - Centralized configuration management
- **DTOs** - Data transfer objects with validation
- **Guards** - Authentication and authorization guards
- **Interceptors** - Cross-cutting concerns (logging, caching)
- **Decorators** - Custom decorators for common patterns


Each module is self-contained and can be easily extended or removed based on your project needs.


## What Makes It Useful


This reference project saves significant development time by providing:
1. **Pre-configured integrations** - All the common services are already set up and working
2. **Best practices** - Code follows NestJS conventions and TypeScript best practices
3. **Type safety** - Full TypeScript support with proper typing throughout
4. **Documentation** - Well-documented code with examples
5. **Flexibility** - Modular design allows you to use only what you need
6. **Production-ready patterns** - Error handling, validation, logging, and security are all included


Instead of spending days or weeks setting up authentication, database connections, file uploads, and other common features, you can clone this project and start building your business logic immediately.


## Use Cases


This template is ideal for:
- **Starting new projects** - Get a head start with all common features
- **Learning NestJS** - See how to structure a real-world NestJS application
- **Reference implementation** - Use as a guide for your own projects
- **Rapid prototyping** - Quickly build MVPs with all features ready to go


Whether you're building a SaaS application, an API backend, or a real-time application, this template provides a solid foundation to build upon.


This NestJS reference backend is a comprehensive starting point for modern backend development. It includes all the common patterns and integrations you'll need, properly structured and ready to use. Instead of reinventing the wheel for every project, you can focus on what makes your application unique.


The project demonstrates real-world NestJS patterns and serves as both a template and a learning resource for building scalable backend applications.


If you wish to use it, [here is a link to it's GitHub](https://github.com/mateuslacorte/nestjs-backend).
