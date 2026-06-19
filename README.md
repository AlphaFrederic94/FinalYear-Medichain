# Medichain Backend

Medichain Backend is a microservice-based electronic health record platform. It separates identity, patient profiles, provider administration, and clinical record management into independent services behind a single API gateway.

## Architecture

The backend is organized around five services:

- `gateway`: public entry point for all API traffic
- `auth-service`: registration, login, token issuance, token refresh, and password management
- `patient-service`: patient profiles, allergies, emergency contacts, and patient analytics
- `provider-service`: facilities, staff profiles, specialties, and provider analytics
- `records-service`: encounters, diagnoses, prescriptions, vitals, documents, timelines, and records analytics

Supporting infrastructure:

- PostgreSQL database per service
- Redis for refresh-token storage and gateway rate limiting
- Swagger UI on each service for local API inspection

The gateway proxies requests from `/api/v1/*` to the individual services and validates JWTs before forwarding protected traffic. Each service owns its own database and business logic through Prisma, so responsibilities stay isolated and data models do not bleed across domains.

## Request Flow

1. A client sends a request to the gateway.
2. The gateway checks the JWT and attaches the user identity to the request context.
3. The gateway forwards the request to the target service.
4. The service validates input with Zod, applies authorization rules, and reads or writes through Prisma.
5. The service returns a wrapped JSON response in the form `{ success, data }`.

## Identity and Roles

Authentication is handled by `auth-service`.

- Patients register and receive a DID plus access and refresh tokens.
- Healthcare staff register with provider roles such as `DOCTOR`, `NURSE`, `PHARMACIST`, or `FACILITY_ADMIN`.
- Administrative roles include `MINISTRY_ADMIN` and `SUPER_ADMIN`.

The frontend maps backend roles into three UI categories:

- patient
- doctor
- admin

## Patient Service

The patient service stores the patient profile and related personal data.

Main responsibilities:

- return the signed-in patient profile
- update patient profile details
- manage allergies
- manage emergency contacts
- support provider search by DID, name, or phone
- expose patient analytics for admin views

## Provider Service

The provider service manages care delivery organizations and staff records.

Main responsibilities:

- register and list facilities
- create and edit staff records
- return the signed-in provider profile
- list specialties
- expose provider and facility analytics

## Records Service

The records service is the clinical core of the system.

Main responsibilities:

- create and read encounters
- add diagnoses
- issue and dispense prescriptions
- record vitals
- store medical document references
- build patient timelines and summaries
- aggregate provider and system analytics

Clinical reads are protected by JWT authentication and the records authorization middleware. Patients can access their own records, while provider roles can access clinical resources according to the current authorization rules.

## Data Storage

Each service uses its own Prisma schema and database:

- `auth_db`
- `patient_db`
- `provider_db`
- `records_db`

This keeps the service boundaries explicit and makes local development and deployment easier to reason about.

## Local Development

The repository includes `docker-compose.yml` for local development.

Common service ports:

- gateway: `3000`
- auth-service: `3001`
- patient-service: `3002`
- records-service: `3003`
- provider-service: `3004`
- Redis: `6379`

Each service exposes:

- `/health`
- Swagger UI under `/api-docs`
- a service-specific JSON spec endpoint

## Environment Variables

Important variables include:

- `JWT_SECRET`
- `INTERNAL_SERVICE_SECRET`
- `REDIS_URL`
- `DATABASE_URL`
- `AUTH_SERVICE_URL`
- `PATIENT_SERVICE_URL`
- `RECORDS_SERVICE_URL`
- `PROVIDER_SERVICE_URL`

The root `.env.example` contains the shared secrets used by the docker compose setup.

## API Surface

The frontend talks to the gateway using these base paths:

- `/api/v1/auth`
- `/api/v1/patients`
- `/api/v1/providers`
- `/api/v1/records`

The gateway rewrites those paths to the underlying service routes.

