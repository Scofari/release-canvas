import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { bearerToken } from './request-auth.js';

@Injectable()
export class SupabaseService {
  client(authorization?: string): { client: SupabaseClient; token: string } {
    const token = bearerToken(authorization);
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new InternalServerErrorException('Supabase is not configured');
    return { token, client: createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } }) };
  }
  async authenticated(authorization?: string): Promise<{ client: SupabaseClient; user: User }> {
    const { client, token } = this.client(authorization);
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Session is invalid or expired');
    return { client, user: data.user };
  }
  unwrap<T>(data: T | null, error: { message: string } | null): T {
    if (error) throw new InternalServerErrorException(error.message);
    if (data === null) throw new InternalServerErrorException('The database returned no data');
    return data;
  }
}
