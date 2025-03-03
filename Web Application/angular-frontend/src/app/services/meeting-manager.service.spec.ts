import { TestBed } from '@angular/core/testing';

import { MeetingManagerService } from './meeting-manager.service';

describe('MeetingManagerService', () => {
  let service: MeetingManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeetingManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
