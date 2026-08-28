import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

export const deviceIdInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const deviceId = session.deviceId();

  if (deviceId && req.url.startsWith('/api')) {
    return next(
      req.clone({
        setHeaders: { 'X-Device-Id': deviceId },
      }),
    );
  }

  return next(req);
};
