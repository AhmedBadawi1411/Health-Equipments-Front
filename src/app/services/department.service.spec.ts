import { TestBed } from '@angular/core/testing';

import { Facilities } from './facilities';

describe('Facilities', () => {
  let service: Facilities;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Facilities);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
