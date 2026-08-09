import { UnauthorizedException } from '@nestjs/common';
export function bearerToken(header?: string) {
  if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('A valid bearer token is required');
  const token = header.slice(7).trim();
  if (!token) throw new UnauthorizedException('A valid bearer token is required');
  return token;
}
