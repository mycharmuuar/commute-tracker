import { Router } from 'express';
import { getRouteHandler } from '../controllers/route.controller';
import { routeRateLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

// Endpoint ตรวจสอบสถานะ Server สำหรับ Health Check บน Render / Cloud Hosting
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'commute-tracker-backend',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GOOGLE_MAPS_API_KEY),
  });
});

// Endpoint คำนวณเส้นทางผ่าน Backend Proxy พร้อม Rate Limiting
router.post('/route', routeRateLimiter, getRouteHandler);

export default router;
