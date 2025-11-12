import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Proveedorescrud } from './proveedorescrud';

describe('Proveedorescrud', () => {
  let component: Proveedorescrud;
  let fixture: ComponentFixture<Proveedorescrud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Proveedorescrud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Proveedorescrud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
