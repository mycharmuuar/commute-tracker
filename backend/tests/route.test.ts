import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import axios from 'axios';
import { app } from '../src/app';

// Mock axios เพื่อจำลองการตอบกลับของ Google Routes API โดยไม่ยิงเครือข่ายจริง
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('Backend API Tests (Google Routes API)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_MAPS_API_KEY = 'test-mock-api-key';
  });

  describe('GET /api/health', () => {
    it('ควรตอบกลับสถานะ ok พร้อมข้อมูล health check', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('commute-tracker-backend');
      expect(res.body.hasApiKey).toBe(true);
    });
  });

  describe('POST /api/route', () => {
    it('ควรแจ้งเตือนข้อผิดพลาด 400 หากไม่มีการส่ง origin', async () => {
      const res = await request(app)
        .post('/api/route')
        .send({ destination: { lat: 13.7226, lng: 100.5284 } });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('กรุณาระบุตำแหน่งต้นทาง');
    });

    it('ควรแจ้งเตือนข้อผิดพลาด 400 หากไม่มีการส่ง destination', async () => {
      const res = await request(app)
        .post('/api/route')
        .send({ origin: { lat: 13.7367, lng: 100.5231 } });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('กรุณาระบุตำแหน่งปลายทาง');
    });

    it('ควรส่งคืนข้อมูลเส้นทางสำเร็จ (200) เมื่อพารามิเตอร์ถูกต้องและ Routes API ตอบกลับข้อมูลเส้นทาง', async () => {
      const mockRoutesApiResponse = {
        data: {
          routes: [
            {
              distanceMeters: 5200,
              duration: '1500s', // 25 นาที (traffic)
              staticDuration: '1080s', // 18 นาที (static)
              polyline: {
                encodedPolyline: 'mock_polyline_points_string_xyz',
              },
              legs: [
                {
                  distanceMeters: 5200,
                  duration: '1500s',
                  staticDuration: '1080s',
                  startLocation: {
                    latLng: { latitude: 13.7367, longitude: 100.5231 },
                  },
                  endLocation: {
                    latLng: { latitude: 13.7226, longitude: 100.5284 },
                  },
                  steps: [
                    {
                      distanceMeters: 1200,
                      staticDuration: '240s',
                      navigationInstruction: {
                        instructions: 'เลี้ยวขวาเข้าสู่ ถนนพระราม 4',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockRoutesApiResponse);

      const res = await request(app)
        .post('/api/route')
        .send({
          origin: { lat: 13.7367, lng: 100.5231 },
          destination: { lat: 13.7226, lng: 100.5284 },
          mode: 'driving',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.distance.text).toBe('5.2 กม.');
      expect(res.body.data.duration_in_traffic.text).toBe('25 นาที');
      expect(res.body.data.hasTrafficData).toBe(true);
      expect(res.body.data.overviewPolyline).toBe('mock_polyline_points_string_xyz');
      expect(res.body.data.steps[0].instructions).toBe('เลี้ยวขวาเข้าสู่ ถนนพระราม 4');
    });

    it('ควรตอบกลับ 404 เมื่อ Routes API ไม่พบเส้นทาง (routes ว่าง)', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          routes: [],
        },
      });

      const res = await request(app)
        .post('/api/route')
        .send({
          origin: { lat: 13.7367, lng: 100.5231 },
          destination: { lat: 13.7226, lng: 100.5284 },
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('ไม่พบเส้นทางการเดินทาง');
    });

    it('ควรตอบกลับ 403 เมื่อคำขอถูกปฏิเสธ (REQUEST_DENIED)', async () => {
      const error: any = new Error('Request failed with status code 403');
      error.response = {
        status: 403,
        data: {
          error: {
            message: 'Method doesn\'t allow unregistered callers (callers without established identity).',
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(error);

      const res = await request(app)
        .post('/api/route')
        .send({
          origin: { lat: 13.7367, lng: 100.5231 },
          destination: { lat: 13.7226, lng: 100.5284 },
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('คำขอถูกปฏิเสธ');
    });
  });
});
