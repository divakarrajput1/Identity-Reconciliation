#  Bitespeed Backend Task – Identity Reconciliation

This project implements an **Identity Reconciliation Service** using:

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma ORM

The service identifies and links customer contacts based on email and phone number, maintaining a consistent primary–secondary relationship.

---

##  Problem Statement

When a customer interacts multiple times using different emails or phone numbers, we need to:

- Detect if they already exist
- Link related contacts
- Maintain a single **primary contact**
- Mark others as **secondary contacts**
- Return consolidated contact information

---

## Setup Instructions
1. Clone Repository
```bash
git clone <your-repo-url>
cd bitespeed-backend
```
2. Install Dependencies
```bash
npm install
```
3. Setup Environment Variables
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/bitespeed"
PORT=3000
```
4. Run Prisma Migration
```bash
npx prisma migrate dev --name init
```
5. Start Server
```bash
npm run dev
```
Server runs at - http://localhost:3000

##  API Endpoint
Request Body
```bash
{
  "email": "test@example.com",
  "phoneNumber": "123456"
}
```
Response Body
```bash
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["test@example.com"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2, 3]
  }
}
```

## Architecture
```bash
bitespeed-backend/
│
├── src/
│   ├── server.ts
│   ├── app.ts
│   │
│   ├── routes/
│   │   └── identify.route.ts
│   │
│   ├── controllers/
│   │   └── identify.controller.ts
│   │
│   ├── services/
│       └── identify.service.ts
│   
├── prisma/
├── package.json
├── tsconfig.json
```
