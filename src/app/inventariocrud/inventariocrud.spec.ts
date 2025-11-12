import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inventariocrud } from './inventariocrud';

describe('Inventariocrud', () => {
  let component: Inventariocrud;
  let fixture: ComponentFixture<Inventariocrud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inventariocrud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Inventariocrud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
