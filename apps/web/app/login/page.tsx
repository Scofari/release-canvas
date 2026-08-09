'use client';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email,setEmail]=useState(''); const [message,setMessage]=useState('');
  async function sendLink(event:FormEvent){event.preventDefault(); const supabase=createClient(); const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:`${location.origin}/demo`}}); setMessage(error?error.message:'Check your email for a secure sign-in link.');}
  async function google(){const supabase=createClient(); await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${location.origin}/demo`}});}
  return <main className="login-shell"><Link className="brand" href="/"><span>R</span> ReleaseCanvas</Link><section><div className="eyebrow"><i/> Private workspace access</div><h1>Welcome back.</h1><p>Sign in to review releases and keep every decision attached to the work.</p><button className="button google" onClick={google}>Continue with Google</button><div className="divider"><span>or use email</span></div><form onSubmit={sendLink}><label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com"/></label><button className="button primary" type="submit">Email me a magic link</button></form><p className="auth-message" role="status">{message}</p><Link className="demo-link" href="/demo">Skip sign-in and explore the recruiter demo →</Link></section></main>;
}
