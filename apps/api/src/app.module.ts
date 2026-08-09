import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { ReleasesController } from './releases.controller.js';
import { ReleasesService } from './releases.service.js';
import { SupabaseService } from './supabase.service.js';
import { WorkspacesController } from './workspaces.controller.js';
import { AnnotationsController } from './annotations.controller.js';
import { ReviewController } from './review.controller.js';
import { ArtifactsController } from './artifacts.controller.js';

@Module({ controllers: [HealthController, WorkspacesController, ReleasesController, AnnotationsController, ReviewController, ArtifactsController], providers: [ReleasesService, SupabaseService] })
export class AppModule {}
