import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { WelcomeGuard } from '../guards/welcome.guard';

describe('WelcomeGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => WelcomeGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
