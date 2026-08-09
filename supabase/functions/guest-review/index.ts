import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors={ 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS' };
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
async function sha256(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes)).map(byte=>byte.toString(16).padStart(2,'0')).join('');}

Deno.serve(async(request)=>{
 if(request.method==='OPTIONS')return new Response(null,{headers:cors});
 const token=new URL(request.url).searchParams.get('token');if(!token||token.length<32)return json({error:'Invalid review link'},404);
 const supabase=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
 const {data:share}=await supabase.from('share_links').select('id,workspace_id,release_id,expires_at,revoked_at').eq('token_hash',await sha256(token)).maybeSingle();
 if(!share||share.revoked_at||new Date(share.expires_at)<=new Date())return json({error:'Review link is expired or revoked'},404);
 if(request.method==='GET'){
  const {data:release,error}=await supabase.from('releases').select('id,name,status,version,due_at,artifacts(id,name,artifact_versions(id,version,storage_path,mime_type,width,height,created_at)),checklist_items(id,label,completed_at,position)').eq('id',share.release_id).single();if(error)return json({error:'Release not found'},404);
  const versions=(release.artifacts??[]).flatMap((artifact:{artifact_versions?:Array<{storage_path:string;version:number}>})=>artifact.artifact_versions??[]).sort((a:{version:number},b:{version:number})=>b.version-a.version);let artifactUrl:null|string=null;if(versions[0]){const {data}=await supabase.storage.from('release-artifacts').createSignedUrl(versions[0].storage_path,300);artifactUrl=data?.signedUrl??null;}
  const versionIds=versions.map((version:{id?:string})=>version.id).filter(Boolean);const {data:annotations}=versionIds.length?await supabase.from('annotations').select('id,artifact_version_id,x,y,title,body,status,version,created_at').in('artifact_version_id',versionIds):{data:[]};
  return json({release,artifactUrl,annotations:annotations??[],expiresAt:share.expires_at});
 }
 if(request.method==='POST'){
  const body=await request.json().catch(()=>null) as null|{decision?:string;reviewerName?:string;note?:string;idempotencyKey?:string};if(!body||!['approved','changes_requested'].includes(body.decision??'')||!body.reviewerName?.trim()||!body.idempotencyKey)return json({error:'Invalid decision'},400);
  const {data:release}=await supabase.from('releases').select('status').eq('id',share.release_id).single();if(release?.status!=='in_review')return json({error:'This release is no longer awaiting review'},409);
  const {data:latest}=await supabase.from('approval_requests').select('review_cycle').eq('release_id',share.release_id).order('review_cycle',{ascending:false}).limit(1).maybeSingle();const cycle=(latest?.review_cycle??0)+1;
  const {data:approval,error:requestError}=await supabase.from('approval_requests').insert({workspace_id:share.workspace_id,release_id:share.release_id,review_cycle:cycle,requested_by:(await supabase.from('workspaces').select('owner_id').eq('id',share.workspace_id).single()).data?.owner_id,closed_at:new Date().toISOString()}).select('id').single();if(requestError)return json({error:'Decision could not be recorded'},409);
  const {data:decision,error}=await supabase.from('approval_decisions').insert({workspace_id:share.workspace_id,approval_request_id:approval.id,decision:body.decision,reviewer_name:body.reviewerName.trim(),note:body.note?.trim()||null,idempotency_key:body.idempotencyKey}).select('id,decision,decided_at').single();if(error)return json({error:error.code==='23505'?'Decision was already recorded':'Decision could not be recorded'},error.code==='23505'?409:400);
  await supabase.from('releases').update({status:body.decision==='approved'?'approved':'changes_requested',approved_at:body.decision==='approved'?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq('id',share.release_id);
  return json(decision,201);
 }
 return json({error:'Method not allowed'},405);
});
