# 🚗 Commute Tracker — ระบบแสดงเส้นทางไปบริษัทแบบ Real-time

เว็บแอปพลิเคชัน Full-stack สำหรับคำนวณและแสดงเส้นทางการเดินทางจากตำแหน่งปัจจุบันของผู้ใช้ (หรือจุดพิกัดที่กำหนด) ไปยังที่ตั้งของบริษัท พร้อมคำนวณระยะทาง ระยะเวลาเดินทางโดยประมาณตามสภาพการจราจรแบบ Real-time ด้วย Google Maps Directions API และ Maps JavaScript API

---

## 🏛️ สถาปัตยกรรมระบบ (System Architecture)

โปรเจกต์นี้พัฒนาในรูปแบบ **Monorepo** โดยแบ่งความรับผิดชอบอย่างชัดเจนระหว่าง Frontend และ Backend:

```
+-------------------------------------------------------------------------+
|                                FRONTEND                                 |
|                       Nuxt 4 (Vue 3) + Tailwind CSS                     |
|                                                                         |
|  - ขอ Geolocation (GPS) พร้อมระบบ Fallback ป้อนพิกัดเอง                   |
|  - แสดงแผนที่ Interactive ผ่าน Google Maps JavaScript API               |
|  - วาดเส้นทาง (Polyline) และปักหมุดตำแหน่งอัตโนมัติ (fitBounds)          |
|  - เลือกโหมดเดินทาง: ขับรถยนต์, ขนส่งสาธารณะ, เดิน, จักรยาน              |
+------------------------------------+------------------------------------+
                                     |
               HTTP POST /api/route  |  (JSON Body: origin, destination, mode)
                                     v
+------------------------------------+------------------------------------+
|                                 BACKEND                                 |
|                       Node.js + Express (TypeScript)                    |
|                                                                         |
|  - ทำหน้าที่เป็น Secure Proxy ป้องกัน API Key หลุดสู่ Client              |
|  - ตรวจสอบ Request Validation & จัดการ CORS ป้องกันบุคคลภายนอก           |
|  - ควบคุม Rate Limiting (express-rate-limit) กันบิลค่าใช้จ่ายบานปลาย    |
|  - เรียก Google Directions API พร้อม departure_time=now (Traffic data)  |
|  - แปลง Error จาก Google เป็นข้อความที่เข้าใจง่าย (ไม่ใช่ Raw JSON)      |
+------------------------------------+------------------------------------+
                                     |
              HTTPS Request + Key    |  (Server-to-Server)
                                     v
+-------------------------------------------------------------------------+
|                         GOOGLE MAPS PLATFORM                            |
|             (Directions API / Routes API & Maps JS API)                 |
+-------------------------------------------------------------------------+
```

---

## 🔒 ทำไม Backend ต้องทำหน้าที่เป็น Proxy แทน Frontend?

ในโปรเจกต์นี้ **Frontend จะไม่ยิง Directions API ไปยัง Google Maps โดยตรงอย่างเด็ดขาด** ด้วยเหตุผลความปลอดภัยสูงสุดดังนี้:

1. **ป้องกัน API Key หลุดสู่สาธารณะ:** หาก Frontend เรียก Directions API ตรง ผู้ใช้งานสามารถเปิด **Network Tab (DevTools)** ในเบราว์เซอร์ แล้วคัดลอก Google Maps API Key ไปใช้งานได้ทันที ซึ่งอาจส่งผลให้โควตาถูกขโมยใช้และเกิดค่าใช้จ่ายบานปลาย
2. **Key Restriction แตกต่างกัน:**
   - **Frontend Key (Browser):** ใช้สำหรับโหลด Maps JavaScript API เท่านั้น และ **ต้องตั้งค่า HTTP Referrer Restriction** บน Google Cloud Console ให้เรียกได้เฉพาะโดเมนของเว็บเราเท่านั้น (เช่น `http://localhost:*` หรือ `https://*.vercel.app/*`)
   - **Backend Key (Server):** ใช้สำหรับเรียก Directions API เป็น Server-side Key ซึ่งไม่เปิดเผยต่อสาธารณะ และเก็บเป็นความลับใน Environment Variable ฝั่งเซิร์ฟเวอร์
3. **การควบคุมการใช้งาน (Cost & Abuse Control):** Backend สามารถใส่ Rate Limiter, Caching, และ Validate ค่าพิกัด เพื่อป้องกันการสแปมยิง API ที่คิดค่าบริการเป็นราย Request ของ Google Maps Platform

---

## 📂 โครงสร้างโฟลเดอร์ (Project Structure)

```
commute-tracker/
├── .gitignore                    # ป้องกันไฟล์ .env และ dependencies ทุกโฟลเดอร์
├── README.md                     # เอกสารโปรเจกต์และการ Deploy
├── package.json                  # Root runner scripts
│
├── backend/                      # Backend Proxy (Node.js + Express + TS)
│   ├── src/
│   │   ├── controllers/          # Request/Response Controller
│   │   ├── services/             # Google Directions API Client Service
│   │   ├── routes/               # Express Route Definitions (/health, /route)
│   │   ├── middlewares/          # Rate Limiting & Error Handler
│   │   ├── app.ts                # Express App Configuration & CORS
│   │   └── index.ts              # Entry point start server
│   ├── tests/                    # Unit Tests (Mock Google API ด้วย Vitest)
│   ├── .env.example              # ตัวอย่าง Environment Variables (ไม่มี key จริง)
│   ├── Dockerfile                # Multi-stage Dockerfile สำหรับ Backend
│   ├── tsconfig.json             # TypeScript Config
│   └── package.json
│
└── frontend/                     # Frontend (Nuxt 4 แท้ + Tailwind CSS)
    ├── app/                      # โครงสร้างโฟลเดอร์แอปพลิเคชัน Nuxt 4 แท้
    │   ├── components/           # GoogleMap, RouteSummaryCard, TravelModeSelector, FallbackLocationInput
    │   ├── composables/          # useGeolocation, useRouteTracker
    │   ├── types/                # TypeScript Interfaces
    │   ├── pages/index.vue       # หน้าจอหลัก Responsive Dashboard
    │   └── app.vue               # Root Component
    ├── .env.example              # ตัวอย่าง Environment Variables ฝั่ง Frontend
    ├── Dockerfile                # Multi-stage Dockerfile สำหรับ Nuxt 4
    ├── nuxt.config.ts            # Nuxt 4 Config
    ├── tailwind.config.js        # Tailwind CSS Config
    └── package.json
```

---

## 🛠️ ขั้นตอนการรันในเครื่อง (Local Setup)

### 1. ติดตั้ง Dependencies

เปิด Terminal ในโฟลเดอร์ `commute-tracker`:

```bash
# ติดตั้ง Backend
cd backend
npm install

# ติดตั้ง Frontend
cd ../frontend
npm install
```

### 2. ตั้งค่า Environment Variables (.env)

คัดลอกไฟล์ `.env.example` ไปเป็น `.env` ในทั้งสองโฟลเดอร์:

```bash
# ฝั่ง Backend
cp backend/.env.example backend/.env

# ฝั่ง Frontend
cp frontend/.env.example frontend/.env
```

แก้ไขค่าใน `backend/.env`:
```env
PORT=3001
ALLOWED_ORIGIN=http://localhost:3000
GOOGLE_MAPS_API_KEY=your_api_key_here
```

แก้ไขค่าใน `frontend/.env`:
```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
VITE_BACKEND_URL=http://localhost:3001
VITE_COMPANY_LAT=13.7226
VITE_COMPANY_LNG=100.5284
VITE_COMPANY_NAME=อาคารสาทรสแควร์ (Sathorn Square)
```

### 3. รันเซิร์ฟเวอร์เพื่อทดสอบ

เปิด 2 Terminal:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# ทำงานที่ http://localhost:3001
# เช็คสถานะได้ที่ http://localhost:3001/api/health
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# เปิดเบราว์เซอร์ที่ http://localhost:3000
```

---

## 🧪 การทดสอบ Unit Test (Backend)

Backend มีการเขียน Unit Test โดยจำลอง (Mock) การทำงานของ Google Maps API เพื่อทดสอบความถูกต้องของ Business Logic และ Error Handling โดยไม่ต้องเชื่อมต่อเครือข่ายจริง:

```bash
cd backend
npm test
```

---

## 🚀 ขั้นตอนการ Deploy จริงสู่ Production

### ส่วนที่ 1: Deploy Backend ขึ้น Render.com (ฟรี)

1. เข้าไปที่ [Render.com](https://render.com/) และล็อกอินด้วย GitHub
2. กด **New +** > **Web Service**
3. เลือก Repository `commute-tracker`
4. ตั้งค่าดังนี้:
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. ในส่วน **Environment Variables** ให้เพิ่ม:
   - `PORT` = `3001`
   - `GOOGLE_MAPS_API_KEY` = `(Google API Key ฝั่ง Backend)`
   - `ALLOWED_ORIGIN` = `(URL ของ Frontend บน Vercel เช่น https://commute-tracker.vercel.app)`
6. กด **Deploy Web Service** และคัดลอก URL ที่ได้ (เช่น `https://commute-tracker-api.onrender.com`)

---

### ส่วนที่ 2: Deploy Frontend ขึ้น Vercel (ฟรี)

1. เข้าไปที่ [Vercel](https://vercel.com/) และล็อกอินด้วย GitHub
2. กด **Add New...** > **Project**
3. Import Repository `commute-tracker`
4. ตั้งค่าในส่วน **Project Settings**:
   - **Framework Preset:** `Nuxt.js`
   - **Root Directory:** กด Edit แล้วเลือก `frontend`
5. ในส่วน **Environment Variables** เพิ่มค่า:
   - `VITE_GOOGLE_MAPS_API_KEY` = `(Google Maps API Key)`
   - `VITE_BACKEND_URL` = `(URL ของ Backend บน Render เช่น https://commute-tracker-api.onrender.com)`
   - `VITE_COMPANY_LAT` = `13.7226`
   - `VITE_COMPANY_LNG` = `100.5284`
   - `VITE_COMPANY_NAME` = `อาคารสาทรสแควร์ (Sathorn Square)`
6. กด **Deploy**

---

## 🛡️ ขั้นตอนการตรวจสอบความปลอดภัยก่อนส่งงาน (Security Checklist)

ก่อนที่จะ Push งานขึ้น GitHub ให้รันคำสั่งเหล่านี้เพื่อรับประกันว่าไม่มี API Key หรือไฟล์ `.env` หลุดเข้าไปใน Git History:

1. **ตรวจสอบว่าไม่มีไฟล์ .env ใน Git Tracking:**
   ```bash
   git ls-files | grep .env
   # ผลลัพธ์ต้องแสดงเฉพาะ .env.example เท่านั้น ห้ามมี .env หรือ .env.local
   ```

2. **สแกนหา Pattern ของ Google API Key ใน Git History:**
   ```bash
   git log -p | grep -i "AIza"
   # ต้องไม่มีผลลัพธ์ใดๆ ปรากฏขึ้น
   ```

3. **ตรวจสอบ HTTP Referrer Restriction บน Google Cloud Console:**
   - Frontend Key จำกัดโดเมน: `http://localhost:*`, `https://*.vercel.app/*`
   - Backend Key จำกัดสิทธิ์เฉพาะ: `Directions API`
