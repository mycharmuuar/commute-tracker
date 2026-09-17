import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import axios from 'axios';
import { app } from '../src/app';

// Mock axios เพื่อจำลองการตอบกลับของ Google Maps API โดยไม่ยิงเครือข่ายจริง
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('Backend API Tests', () => {
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

    it('ควรส่งคืนข้อมูลเส้นทางสำเร็จ (200) เมื่อพารามิเตอร์ถูกต้องและ Google API ตอบกลับ OK', async () => {
      // Mock ข้อมูลที่ Google Maps Directions API ส่งกลับ
      const mockGoogleResponse = {
        data: {
          status: 'OK',
          routes: [
            {
              overview_polyline: { points: 'mock_polyline_points_string_xyz' },
              legs: [
                {
                  distance: { text: '5.2 กม.', value: 5200 },
                  duration: { text: '18 นาที', value: 1080 },
                  duration_in_traffic: { text: '25 นาที', value: 1500 },
                  start_address: 'Bangkok, Thailand',
                  end_address: 'Sathorn, Bangkok, Thailand',
                  start_location: { lat: 13.7367, lng: 100.5231 },
                  end_location: { lat: 13.7226, lng: 100.5284 },
                  steps: [
                    {
                      html_instructions: 'เลี้ยวขวาเข้าสู่ <b>ถนนพระราม 4</b>',
                      distance: { text: '1.2 กม.' },
                      duration: { text: '4 นาที' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockGoogleResponse);

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
      expect(res.body.data.steps[0].instructions).toBe('เลี้ยวขวาเข้าสู่ ถนนพระราม 4'); // stripped HTML
    });

    it('ควรตอบกลับ 404 พร้อมข้อความที่เข้าใจง่าย เมื่อ Google API ส่งสถานะ ZERO_RESULTS', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          status: 'ZERO_RESULTS',
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
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          status: 'REQUEST_DENIED',
          error_message: 'The provided API key is invalid.',
        },
      });

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
