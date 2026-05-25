import { SignJWT, jwtVerify } from 'jose';
import { ActorRole } from '../shared/ActorRole';

export interface TokenPayload {
  actorId: string;
  role: ActorRole;
  wardUnitId?: string;
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'meditrack-dev-secret-change-in-production',
);

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ actorId: payload.actorId, role: payload.role, wardUnitId: payload.wardUnitId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret);
  return {
    actorId: payload['actorId'] as string,
    role: payload['role'] as ActorRole,
    wardUnitId: payload['wardUnitId'] as string | undefined,
  };
}
