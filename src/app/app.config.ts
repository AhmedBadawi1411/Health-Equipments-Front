import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { CustomTheme } from '../cutomPrime';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { credentialsInterceptor } from './interceptors/credentials-interceptor';

import { provideEchartsCore } from 'ngx-echarts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([credentialsInterceptor]),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'x-xsrf-token' }),
    ),
    provideRouter(routes),
    provideEchartsCore({ echarts: () => import('echarts') }),
    providePrimeNG({
      theme: {
        preset: CustomTheme,
      },
    }),
  ],
};
