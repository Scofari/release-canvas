import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceApp } from './workspace-app';

export const metadata={title:'Workspace'};
export default async function AppPage(){const supabase=await createClient();const {data}=await supabase.auth.getClaims();if(!data?.claims)redirect('/login');return <WorkspaceApp userEmail={typeof data.claims.email==='string'?data.claims.email:'Authenticated user'}/>;}
