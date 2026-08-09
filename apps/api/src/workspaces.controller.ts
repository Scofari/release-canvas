import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { SupabaseService } from './supabase.service.js';

const onboardingSchema = z.object({ workspaceName: z.string().trim().min(2).max(80), workspaceSlug: z.string().regex(/^[a-z0-9-]{2,50}$/), displayName: z.string().trim().min(2).max(80) });
const projectSchema = z.object({ workspaceId: z.uuid(), name: z.string().trim().min(2).max(120), description: z.string().trim().max(1000).default('') });

@ApiTags('workspaces') @ApiBearerAuth() @Controller()
export class WorkspacesController {
  constructor(private readonly db: SupabaseService) {}
  @Post('workspaces/onboard') async onboard(@Headers('authorization') authorization: string | undefined, @Body() input: unknown) { const body=onboardingSchema.parse(input); const {client}=await this.db.authenticated(authorization); const {data,error}=await client.rpc('onboard_workspace',{workspace_name:body.workspaceName,workspace_slug:body.workspaceSlug,display_name:body.displayName}); return this.db.unwrap(data,error); }
  @Get('workspaces') async list(@Headers('authorization') authorization: string | undefined) { const {client}=await this.db.authenticated(authorization); const {data,error}=await client.from('workspaces').select('id,name,slug,plan,created_at').order('created_at'); return this.db.unwrap(data,error); }
  @Post('projects') async createProject(@Headers('authorization') authorization: string | undefined,@Body() input:unknown){const body=projectSchema.parse(input);const {client}=await this.db.authenticated(authorization);const {data,error}=await client.from('projects').insert({workspace_id:body.workspaceId,name:body.name,description:body.description}).select().single();return this.db.unwrap(data,error);}
  @Get('projects') async listProjects(@Headers('authorization') authorization:string|undefined){const {client}=await this.db.authenticated(authorization);const {data,error}=await client.from('projects').select('id,workspace_id,name,description,created_at').is('archived_at',null).order('created_at',{ascending:false});return this.db.unwrap(data,error);}
}
