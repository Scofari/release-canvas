import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { ReleasesController } from './releases.controller.js';
import { ReleasesService } from './releases.service.js';

@Module({ controllers: [HealthController, ReleasesController], providers: [ReleasesService] })
export class AppModule {}
