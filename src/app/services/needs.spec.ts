import { TestBed } from '@angular/core/testing';

import { NeedsService } from './needs.service';

describe('Needs', () => {
  let service: NeedsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NeedsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
