import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const cloneRequest = req.clone({
    withCredentials: true
  });

  return next(cloneRequest)
};
