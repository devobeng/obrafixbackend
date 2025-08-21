import jwt, { SignOptions } from "jsonwebtoken";
import { IJWTPayload } from "../types";

export class JWTService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly JWT_EXPIRES_IN: jwt.SignOptions["expiresIn"];
  private readonly JWT_REFRESH_EXPIRES_IN: jwt.SignOptions["expiresIn"];

  constructor() {
    this.JWT_SECRET = process.env["JWT_SECRET"] || "fallback-secret-key";
    this.JWT_REFRESH_SECRET =
      process.env["JWT_REFRESH_SECRET"] || "fallback-refresh-secret-key";
    this.JWT_EXPIRES_IN = (process.env["JWT_EXPIRES_IN"] ||
      "7d") as jwt.SignOptions["expiresIn"];
    this.JWT_REFRESH_EXPIRES_IN = (process.env["JWT_REFRESH_EXPIRES_IN"] ||
      "30d") as jwt.SignOptions["expiresIn"];
  }

  // Generate access token
  generateAccessToken(userId: string): string {
    const payload: IJWTPayload = {
      userId,
      type: "access",
    };

    const options: SignOptions = {
      expiresIn: this.JWT_EXPIRES_IN!,
    };
    return jwt.sign(payload, this.JWT_SECRET, options);
  }

  // Generate refresh token
  generateRefreshToken(userId: string): string {
    const payload: IJWTPayload = {
      userId,
      type: "refresh",
    };

    const options: SignOptions = {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN!,
    };
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, options);
  }

  // Verify access token
  verifyAccessToken(token: string): IJWTPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as IJWTPayload;

      if (decoded.type !== "access") {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error) {
      throw new Error("Invalid access token");
    }
  }

  // Verify refresh token
  verifyRefreshToken(token: string): IJWTPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET) as IJWTPayload;

      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  // Decode token without verification
  decodeToken(token: string): IJWTPayload | null {
    try {
      return jwt.decode(token) as IJWTPayload;
    } catch (error) {
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Get token expiration time
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return null;

      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }
}
