import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createAnnotationSchema } from '@release-canvas/contracts';
import { z } from 'zod';
import { SupabaseService } from './supabase.service.js';

const inputSchema=createAnnotationSchema.extend({workspaceId:z.uuid()});
@ApiTags('annotations') @ApiBearerAuth() @Controller('annotations')
export class AnnotationsController{
  constructor(private readonly db:SupabaseService){}
  @Get() async list(@Headers('authorization') authorization:string|undefined,@Query('artifactVersionId') artifactVersionId:string){const {client}=await this.db.authenticated(authorization);const {data,error}=await client.from('annotations').select('id,workspace_id,artifact_version_id,x,y,title,body,status,assignee_id,created_by,version,created_at,updated_at').eq('artifact_version_id',artifactVersionId).order('created_at');return this.db.unwrap(data,error);}
  @Post() async create(@Headers('authorization') authorization:string|undefined,@Body() input:unknown){const body=inputSchema.parse(input);const {client,user}=await this.db.authenticated(authorization);const {data,error}=await client.from('annotations').insert({workspace_id:body.workspaceId,artifact_version_id:body.artifactVersionId,x:body.x,y:body.y,title:body.title,body:body.body,created_by:user.id}).select().single();return this.db.unwrap(data,error);}
  @Patch(':id') async update(@Headers('authorization') authorization:string|undefined,@Param('id') id:string,@Body() input:unknown){const body=z.object({status:z.enum(['open','resolved']),version:z.number().int().positive()}).parse(input);const {client}=await this.db.authenticated(authorization);const {data,error}=await client.from('annotations').update({status:body.status,version:body.version+1,updated_at:new Date().toISOString()}).eq('id',id).eq('version',body.version).select().maybeSingle();if(error)throw error;if(!data)throw new Error('Annotation changed in another session');return data;}
}
