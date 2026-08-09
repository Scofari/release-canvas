import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReleasesService } from './releases.service.js';

@ApiTags('releases')
@Controller('releases')
export class ReleasesController {
  constructor(private readonly releases: ReleasesService) {}
  @Get(':id') @ApiOperation({ summary: 'Get a release visible to the current workspace' }) get(@Param('id') id: string) { return this.releases.find(id); }
  @Patch(':id/status') @ApiOperation({ summary: 'Move a release through its guarded workflow' }) transition(@Param('id') _id: string, @Body() body: { status?: string }) { return this.releases.transition(body.status ?? ''); }
}
