# Shift Management API Documentation

## Overview

Shift Management API allows kasir to open/close shifts daily and admin to review/finalize them for audit purposes.

**Base URL:** `http://localhost:3000/api/shifts`

**Authentication:** All endpoints require JWT token in `Authorization: Bearer <token>` header.

---

## Endpoints

### 1. Open Shift

**POST** `/api/shifts/open`

Opens a new shift for the current user. Only one open shift per user per shop is allowed.

**Request Body:**
```json
{
  "startingCash": 500000,
  "notes": "Saldo kas dari shift kemarin" // optional
}
```

**Response (201):**
```json
{
  "shift": {
    "id": "shift-id-123",
    "userId": "user-id",
    "shopId": "shop-id",
    "startTime": "2026-05-25T14:00:00.000Z",
    "endTime": null,
    "expectedCash": 0,
    "actualCash": null,
    "expectedQRIS": 0,
    "actualQRIS": null,
    "variance": null,
    "status": "OPEN",
    "notes": "Saldo kas awal: Rp 500.000",
    "user": { ... },
    "shop": { ... }
  },
  "message": "Shift berhasil dibuka. Selamat bekerja!"
}
```

**Errors:**
- `409 Conflict` - User already has an open shift
- `401 Unauthorized` - Invalid/missing token

---

### 2. Close Shift

**POST** `/api/shifts/:id/close`

Closes an open shift. System automatically calculates expected cash/QRIS from transactions and compares with actual values.

**Request Body:**
```json
{
  "actualCash": 1250000,
  "actualQRIS": 350000,
  "notes": "Variance Rp 5.000 karena kembalian receh" // optional
}
```

**Response (200):**
```json
{
  "shift": {
    "id": "shift-id-123",
    "status": "CLOSED",
    "endTime": "2026-05-25T22:00:00.000Z",
    "expectedCash": 1245000,
    "actualCash": 1250000,
    "expectedQRIS": 350000,
    "actualQRIS": 350000,
    "variance": 5000,
    ...
  },
  "summary": {
    "expectedCash": 1245000,
    "actualCash": 1250000,
    "varianceCash": 5000,
    "expectedQRIS": 350000,
    "actualQRIS": 350000,
    "varianceQRIS": 0,
    "totalTransactions": 42
  },
  "message": "Shift berhasil ditutup. Terima kasih atas kerja keras Anda!"
}
```

**Errors:**
- `404 Not Found` - Shift not found
- `403 Forbidden` - Not shift owner and not admin
- `400 Bad Request` - Shift already closed/finalized

---

### 3. Get Current Shift

**GET** `/api/shifts/current`

Returns the currently open shift for the logged-in user, or null if no shift is open.

**Response (200):**
```json
{
  "shift": {
    "id": "shift-id-123",
    "status": "OPEN",
    ...
  },
  "transactionCount": 15
}
```

**Or if no open shift:**
```json
{
  "shift": null,
  "message": "Belum ada shift aktif."
}
```

---

### 4. List Shifts

**GET** `/api/shifts`

List all shifts with optional filters. Non-superadmin users only see shifts in their shop.

**Query Parameters:**
- `shopId` (optional) - Filter by shop
- `userId` (optional) - Filter by kasir
- `status` (optional) - Filter by status: `OPEN`, `CLOSED`, `FINALIZED`
- `startDate` (optional) - Filter from date (YYYY-MM-DD)
- `endDate` (optional) - Filter to date (YYYY-MM-DD)

**Example:**
```
GET /api/shifts?status=CLOSED&startDate=2026-05-01&endDate=2026-05-31
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "shift-id-123",
      "userId": "user-id",
      "shopId": "shop-id",
      "startTime": "2026-05-25T14:00:00.000Z",
      "endTime": "2026-05-25T22:00:00.000Z",
      "expectedCash": 1245000,
      "actualCash": 1250000,
      "variance": 5000,
      "status": "CLOSED",
      "user": { ... },
      "shop": { ... }
    }
  ],
  "total": 1
}
```

---

### 5. Get Shift Detail

**GET** `/api/shifts/:id`

Get detailed information about a shift, including all transactions during the shift.

**Response (200):**
```json
{
  "shift": {
    "id": "shift-id-123",
    ...full shift data
  },
  "transactions": {
    "data": [
      {
        "id": "trx-id",
        "transactionNumber": "TRX-20260525-001",
        "totalPrice": 125000,
        "status": "COMPLETED",
        "payments": [ ... ],
        "items": [ ... ]
      }
    ],
    "total": 42
  }
}
```

**Errors:**
- `404 Not Found` - Shift not found
- `403 Forbidden` - Non-superadmin trying to access shift from other shop

---

### 6. Finalize Shift (Admin Only)

**POST** `/api/shifts/:id/finalize`

Admin reviews and finalizes a closed shift. After finalization, the shift cannot be modified.

**Permissions:** `ADMIN` or `SUPER_ADMIN` only

**Request Body:**
```json
{
  "notes": "Variance approved, kembalian receh wajar" // optional
}
```

**Response (200):**
```json
{
  "shift": {
    "id": "shift-id-123",
    "status": "FINALIZED",
    "finalizedAt": "2026-05-26T08:00:00.000Z",
    "finalizedBy": "adminpusat",
    ...
  },
  "message": "Shift berhasil difinalisasi."
}
```

**Errors:**
- `404 Not Found` - Shift not found
- `400 Bad Request` - Shift not yet closed
- `403 Forbidden` - Not admin

---

## Shift Status Flow

```
OPEN → (kasir closes) → CLOSED → (admin finalizes) → FINALIZED
```

**OPEN**: Shift is active, kasir can do transactions  
**CLOSED**: Kasir has closed the shift, waiting for admin review  
**FINALIZED**: Admin has reviewed and approved, shift is locked

---

## Business Rules

1. **One Active Shift Per User**: A kasir can only have one `OPEN` shift at a time
2. **Expected Values Auto-calculated**: `expectedCash` and `expectedQRIS` are calculated from completed transactions during the shift
3. **Variance Threshold**: If variance > Rp 10.000, a warning message is returned
4. **Shop Scoping**: Non-superadmin users can only see/manage shifts in their shop
5. **Transactions Included**: All `COMPLETED` transactions between `startTime` and `endTime` (or now for open shifts) are included

---

## Example Workflow

### Kasir Daily Workflow

1. **Morning (8:00 AM)**
   ```bash
   POST /api/shifts/open
   Body: { "startingCash": 500000 }
   ```

2. **Throughout the day**
   - Kasir does transactions (via POS)
   - Transactions are automatically linked to active shift

3. **Evening (8:00 PM)**
   ```bash
   POST /api/shifts/{id}/close
   Body: {
     "actualCash": 1255000,
     "actualQRIS": 345000,
     "notes": "Variance Rp 10.000 karena kembalian receh"
   }
   ```

### Admin Review Workflow

1. **Next Morning**
   ```bash
   GET /api/shifts?status=CLOSED&startDate=2026-05-25
   ```

2. **Review shift detail**
   ```bash
   GET /api/shifts/{id}
   # Check transactions, variance, notes
   ```

3. **Finalize if OK**
   ```bash
   POST /api/shifts/{id}/finalize
   Body: { "notes": "Variance approved" }
   ```

---

## Testing

Run the test script to test all endpoints:

```bash
# Make sure backend is running on port 3000
npm run start:dev

# In another terminal
bash test-shifts-api.sh
```

Or test manually:

```bash
# 1. Login as kasir
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"kasir@maslahat-tani.com","password":"Kasir123!"}' | jq -r '.token')

# 2. Open shift
curl -X POST http://localhost:3000/api/shifts/open \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startingCash": 500000}'

# 3. Check current shift
curl -X GET http://localhost:3000/api/shifts/current \
  -H "Authorization: Bearer $TOKEN"
```

---

## Notes

- All monetary values are in **rupiah** (integer, no decimals)
- All timestamps are in **ISO 8601** format with UTC timezone
- Shift data is immutable after `FINALIZED` status
- Variance calculation: `variance = actualCash - expectedCash`
