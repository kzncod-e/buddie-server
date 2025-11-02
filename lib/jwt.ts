import { JwtPayload, sign, verify } from 'jsonwebtoken';
const secret = 'your-secret-key';
export const signToken = (payload: object): string => {
  return sign({ data: payload }, secret);
};

export const verifyToken = (token: string): JwtPayload | null => {
  const decoded = verify(token, secret) as JwtPayload;
  return decoded;
};
