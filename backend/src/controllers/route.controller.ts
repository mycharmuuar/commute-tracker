import { Request, Response, NextFunction } from 'express';
import { googleMapsService, LocationPoint } from '../services/googleMaps.service';

export async function getRouteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { origin, destination, mode } = req.body;

    if (!origin) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'กรุณาระบุตำแหน่งต้นทาง (origin)',
      });
    }

    if (!destination) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'กรุณาระบุตำแหน่งปลายทาง (destination)',
      });
    }

    // Validate origin structure if object
    if (typeof origin === 'object') {
      if (typeof origin.lat !== 'number' || typeof origin.lng !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'พิกัดต้นทาง (origin) ต้องมี lat และ lng เป็นตัวเลข',
        });
      }
    }

    // Validate destination structure if object
    if (typeof destination === 'object') {
      if (typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'พิกัดปลายทาง (destination) ต้องมี lat และ lng เป็นตัวเลข',
        });
      }
    }

    const routeData = await googleMapsService.getDirections({
      origin,
      destination,
      mode: mode || 'driving',
    });

    return res.status(200).json({
      success: true,
      data: routeData,
    });
  } catch (error) {
    return next(error);
  }
}
