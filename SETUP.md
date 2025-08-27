# คู่มือการติดตั้งและใช้งานระบบจัดการการนัดหมาย

## 📋 ความต้องการของระบบ

### Software ที่ต้องติดตั้ง
- Node.js (เวอร์ชัน 18 หรือใหม่กว่า)
- PostgreSQL (เวอร์ชัน 12 หรือใหม่กว่า)
- npm หรือ yarn

### การตรวจสอบการติดตั้ง
```bash
# ตรวจสอบ Node.js
node --version

# ตรวจสอบ npm
npm --version

# ตรวจสอบ PostgreSQL
psql --version
```

## 🚀 การติดตั้งระบบ

### 1. ติดตั้ง Dependencies

#### Frontend Dependencies
```bash
# ในโฟลเดอร์หลักของโปรเจค
npm install
```

#### Backend Dependencies
```bash
# เข้าไปในโฟลเดอร์ backend
cd backend
npm install express pg cors bcryptjs jsonwebtoken dotenv express-validator multer
npm install --save-dev nodemon
```

### 2. ตั้งค่าฐานข้อมูล PostgreSQL

#### สร้างฐานข้อมูล
```sql
-- เข้าไปใน PostgreSQL
psql -U postgres

-- สร้างฐานข้อมูล
CREATE DATABASE appointment_db;

-- ออกจาก PostgreSQL
\q
```

#### รัน Schema
```bash
# ในโฟลเดอร์ backend
psql -U postgres -d appointment_db -f database/schema.sql
```

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=appointment_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
```

**หมายเหตุ:** แทนที่ `your_postgres_password` ด้วยรหัสผ่าน PostgreSQL ของคุณ

### 4. รันระบบ

#### รัน Backend Server
```bash
# ในโฟลเดอร์ backend
npm run dev
```

#### รัน Frontend Development Server
```bash
# ในโฟลเดอร์หลัก (terminal ใหม่)
npm run dev
```

## 📱 การเข้าถึงระบบ

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

## 👥 การใช้งานระบบ

### การลงทะเบียนผู้ใช้

#### สำหรับนักศึกษา
1. เข้าไปที่หน้าเว็บ http://localhost:5173
2. คลิก "ลงทะเบียน"
3. กรอกข้อมูล:
   - ชื่อ-นามสกุล
   - อีเมล
   - เลือกบทบาท: "นักศึกษา"
   - รหัสนักศึกษา
   - ภาควิชา (ไม่บังคับ)
   - เบอร์โทรศัพท์ (ไม่บังคับ)
   - รหัสผ่าน
4. คลิก "ลงทะเบียน"

#### สำหรับอาจารย์
1. เข้าไปที่หน้าเว็บ http://localhost:5173
2. คลิก "ลงทะเบียน"
3. กรอกข้อมูล:
   - ชื่อ-นามสกุล
   - อีเมล
   - เลือกบทบาท: "อาจารย์"
   - รหัสอาจารย์
   - ภาควิชา (ไม่บังคับ)
   - เบอร์โทรศัพท์ (ไม่บังคับ)
   - รหัสผ่าน
4. คลิก "ลงทะเบียน"

### การเข้าสู่ระบบ
1. เข้าไปที่หน้าเว็บ http://localhost:5173
2. กรอกอีเมลและรหัสผ่าน
3. คลิก "เข้าสู่ระบบ"

### การใช้งานระบบ

#### สำหรับนักศึกษา
- **แดชบอร์ด:** ดูภาพรวมการนัดหมายและโครงงาน
- **โครงงานของฉัน:** ดูโครงงานที่เกี่ยวข้อง
- **การนัดหมาย:** จัดการการนัดหมายกับอาจารย์
- **ตารางเวลาอาจารย์:** ดูตารางเวลาของอาจารย์
- **รายงาน:** ดูรายงานการนัดหมาย

#### สำหรับอาจารย์
- **แดชบอร์ด:** ดูภาพรวมการนัดหมายและโครงงาน
- **จัดการโครงงาน:** สร้างและจัดการโครงงาน
- **การนัดหมาย:** จัดการการนัดหมายกับนักศึกษา
- **จัดการตารางเวลา:** ตั้งค่าตารางเวลาการให้คำปรึกษา
- **จัดการนักศึกษา:** เพิ่ม/ลบนักศึกษาในโครงงาน
- **รายงาน:** ดูรายงานการนัดหมาย

## 🔧 การแก้ไขปัญหา

### ปัญหาการเชื่อมต่อฐานข้อมูล
```bash
# ตรวจสอบว่า PostgreSQL กำลังทำงาน
# Windows
services.msc
# ค้นหา "PostgreSQL" และตรวจสอบว่า Status เป็น "Running"

# ตรวจสอบการเชื่อมต่อ
psql -U postgres -h localhost
```

### ปัญหาการรัน Backend
```bash
# ตรวจสอบว่าไฟล์ .env มีอยู่และตั้งค่าถูกต้อง
# ตรวจสอบว่า port 5000 ไม่ถูกใช้งาน
netstat -ano | findstr :5000
```

### ปัญหาการรัน Frontend
```bash
# ตรวจสอบว่า port 5173 ไม่ถูกใช้งาน
netstat -ano | findstr :5173

# ลบ node_modules และติดตั้งใหม่
rm -rf node_modules
npm install
```

## 📊 การทดสอบระบบ

### ทดสอบ API Endpoints
```bash
# Health Check
curl http://localhost:5000/api/health

# ทดสอบการลงทะเบียน
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "role": "student",
    "student_id": "1234567890"
  }'
```

## 🚀 การ Deploy

### สำหรับ Production
```bash
# Build Frontend
npm run build

# รัน Backend ใน Production
cd backend
npm start
```

### Environment Variables สำหรับ Production
```env
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=appointment_db
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_very_secure_jwt_secret
PORT=5000
NODE_ENV=production
```

## 📞 การติดต่อ

หากพบปัญหาหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมพัฒนา
