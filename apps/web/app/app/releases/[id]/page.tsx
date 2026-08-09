import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ConnectedReview } from './connected-review';
export const metadata={title:'Release review'};
export default async function ReleasePage({params}:{params:Promise<{id:string}>}){const supabase=await createClient();const {data}=await supabase.auth.getClaims();if(!data?.claims)redirect('/login');const {id}=await params;return <ConnectedReview releaseId={id}/>;}
