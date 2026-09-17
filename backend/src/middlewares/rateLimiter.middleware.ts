import rateLimit from 'express-rate-limit';

export const routeRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // จำกัดสูงสุด 60 ครั้งต่อ 15 นาที ต่อ IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'คุณเรียกใช้งานเกินจำนวนที่กำหนด กรุณารอ 15 นาทีก่อนลองใหม่อีกครั้ง เพื่อป้องกันค่าใช้จ่ายของ API',
  },
});
