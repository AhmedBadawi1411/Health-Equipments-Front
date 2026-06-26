import { TestBed } from '@angular/core/testing';

import { HttpClientWrapper } from './http-client-wrapper';

describe('HttpClientWrapper', () => {
  let service: HttpClientWrapper;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpClientWrapper);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
