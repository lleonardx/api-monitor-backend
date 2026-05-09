import { Test, TestingModule } from '@nestjs/testing';
import { ApiMonitorGateway } from './api-monitor.gateway';

describe('ApiMonitorGateway', () => {
  let gateway: ApiMonitorGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiMonitorGateway],
    }).compile();

    gateway = module.get<ApiMonitorGateway>(ApiMonitorGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
