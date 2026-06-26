# AfriHealth Chain EHR Backend

AfriHealth Chain EHR Backend is a highly secure, microservice-based electronic health record (EHR) platform. It separates identity management, patient profiles, provider administration, clinical records, and on-chain blockchain audits into independent microservices behind a unified API gateway.

---

## 🏗️ Architecture

The backend is composed of five specialized Node.js microservices and supporting infrastructure:

*   **`gateway`** (Port `3000`): The public entry point. Handles request routing, rate limiting, and JWT validation.
*   **`auth-service`** (Port `3001`): Manages identity registration, authentication, token issuance/refresh, password policies, and Decentralized Identifier (DID) registration.
*   **`patient-service`** (Port `3002`): Manages patient demographic profiles, allergies, emergency contacts, and provider-led patient profile updates.
*   **`records-service`** (Port `3003`): The clinical core. Manages encounters, clinical findings, diagnoses, prescriptions, vitals, and file uploads. Enforces blockchain-based consent verification.
*   **`provider-service`** (Port `3004`): Manages medical facility registration, clinical staff profiles, specialties, and provider onboarding verification.
*   **`blockchain-service`** (Port `3005`): Simulates and coordinates on-chain operations (anchoring records, issuing consent tokens, revoking consent, checking permission scopes, and auditing read logs).

### Infrastructure Components
*   **PostgreSQL**: Independent databases are provisioned for each microservice to maintain strict schema isolation:
    *   `auth_db`
    *   `patient_db`
    *   `provider_db`
    *   `records_db`
    *   `blockchain_db`
*   **Redis**: Used for API Gateway rate-limiting and active session/refresh-token caching.

---

## 🚀 Docker Setup & Installation

### Prerequisites
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ensure it is running)
*   Node.js (for optional local script execution)

### Step-by-Step Deployment

1.  **Clone & Navigate to Backend Root**
    ```bash
    cd "erh-micro-backend"
    ```

2.  **Environment Variables Configuration**
    Confirm that the `.env` file exists at the root of the backend directory. If not, copy it from `.env.example`:
    ```bash
    cp .env.example .env
    ```

3.  **Start all Services**
    Build and launch all services in the background using Docker Compose:
    ```bash
    docker compose up --build -d
    ```
    This launches all databases, Redis, the API Gateway, and the five backend microservices.

4.  **Verify Running Containers**
    Ensure all containers are running and healthy:
    ```bash
    docker ps
    ```
    You should see `afrihealth-gateway`, `afrihealth-auth`, `afrihealth-patient`, `afrihealth-records`, `afrihealth-provider`, `afrihealth-blockchain`, along with the five PostgreSQL DB containers and the Redis container.

---

## 🗄️ Database Migrations & Seeding

Since databases are run in isolated containers, you must deploy Prisma migrations and seed the initial dataset (clinicians, test patients, facilities, and mock encounters) before starting.

We have included automated helper scripts at the root of `erh-micro-backend/` to run these commands sequentially across all containers:

*   **On Windows (Command Prompt / PowerShell)**:
    ```cmd
    .\migrate-and-seed.bat
    ```
*   **On macOS / Linux / Git Bash**:
    ```bash
    chmod +x migrate-and-seed.sh
    ./migrate-and-seed.sh
    ```

### Manual Migration & Seeding (Alternative)
If you prefer to run commands manually, run the following Docker Exec operations in your terminal:

```bash
# 1. Run database migrations
docker exec -it afrihealth-auth npx prisma migrate deploy
docker exec -it afrihealth-patient npx prisma migrate deploy
docker exec -it afrihealth-provider npx prisma migrate deploy
docker exec -it afrihealth-records npx prisma migrate deploy
docker exec -it afrihealth-blockchain npx prisma migrate deploy

# 2. Seed initial data
docker exec -it afrihealth-auth npx prisma db seed
docker exec -it afrihealth-patient npx prisma db seed
docker exec -it afrihealth-provider npx prisma db seed
docker exec -it afrihealth-records npx prisma db seed
docker exec -it afrihealth-blockchain npx prisma db seed
```

---

## 📊 Monitoring Logs & The Blockchain Audit Trail

To monitor backend performance, trace request pathways, and verify on-chain transaction anchors, you can view container logs in real time.

### ⛓️ Tracking Blockchain Service Logs
The `blockchain-service` is responsible for anchoring clinical records, creating consent tokens, and keeping access audit logs. Stream its logs with:
```bash
docker logs -f afrihealth-blockchain
```
*   Look for outputs like:
    *   `Blockchain client POST error` or success logs for anchoring/verifying hashes.
    *   `Grant consent: patient did:... -> provider did:...`
    *   `Check consent status...`

### 🩺 Monitoring Clinical Records & Consent Checks
The `records-service` performs on-chain checks through the blockchain service whenever a provider attempts to read or write a record. Stream its logs with:
```bash
docker logs -f afrihealth-records
```

### 🌐 Viewing Gateway/All Service Logs
To view logs across all microservices simultaneously:
```bash
docker compose logs -f
```
To view logs for a specific service (e.g. Gateway):
```bash
docker logs -f afrihealth-gateway
```

---

## 🔒 On-Chain Consent & Access Model

1.  **Patient Control**: Patients grant explicitly scoped consent policies (`RECORDS`, `PRESCRIPTIONS`, `DOCUMENTS`, `VITALS`) to a doctor's DID with a time expiration (e.g., 2 hours, 24 hours). This transaction is signed and registered on the simulated blockchain ledger.
2.  **On-Chain Verification**: When a provider requests patient data, the `records-service` intercepts the request, runs the `consentCheck` middleware, and queries `blockchain-service` on-chain status.
3.  **Immutable Audit Logs**: Every clinical access event is permanently logged as a block audit trail on the ledger, verifiable via `GET /blockchain/audit/:patientDid`.
