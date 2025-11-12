import { TestBed } from '@angular/core/testing';

import { Bodega } from './bodega';

describe('Bodega', () => {
  let service: Bodega;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Bodega);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
