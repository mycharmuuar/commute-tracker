import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routeRoutes from './routes/route.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';

// โหลด Environment Variables จาก .env
dotenv.config();

export const app = express();

// ตั้งค่า CORS เฉพาะ Origin ของ Frontend ตามข้อกำหนดของโจทย์ (ไม่เปิดกว้าง *)
const allowedOriginSetting = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
const allowedOrigins = allowedOriginSetting.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // อนุญาตคำขอที่ไม่มี origin (เช่น เครื่องมือเทส/curl/health check ฝั่ง server)
      if (!origin) return callback(null, true);

      // ตรวจสอบว่า origin ตรงกับที่อนุญาต หรือเป็น localhost / preview vercel
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:');

      if (isAllowed) {
        return callback(null, true);
      } else {
        return callback(new Error(`CORS blocked: Origin ${origin} is not allowed`));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// Mount API routes
app.use('/api', routeRoutes);

// Central error handler
app.use(errorHandler);
