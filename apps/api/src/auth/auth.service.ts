import {
  Injectable,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from '@mikro-orm/mysql';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import {
  Cafe,
  CafeUser,
  CafeUserRole,
  RefreshToken,
  User,
} from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import {
  AuthTokensResponse,
  LoginDto,
  LogoutDto,
  RefreshDto,
  SignupDto,
} from './dto';

const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL_DAYS = (() => {
  const raw = process.env.JWT_REFRESH_TTL || '30d';
  return Number(raw.replace(/d$/i, '')) || 30;
})();

@Injectable()
export class AuthService {
  constructor(
    private readonly em: EntityManager,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthTokensResponse> {
    const existing = await this.em.findOne(User, { email: dto.email });
    if (existing) {
      throw new ApiError(HttpStatus.CONFLICT, Errors.EMAIL_TAKEN);
    }

    return this.em.transactional(async (em) => {
      const passwordHash = await bcrypt.hash(dto.password, 10);

      const cafe = em.create(Cafe, { name: '내 홈카페' });
      const user = em.create(User, {
        email: dto.email,
        passwordHash,
      });
      em.persist([cafe, user]);
      await em.flush();

      const cafeUser = em.create(CafeUser, {
        user,
        cafe,
        role: CafeUserRole.ADMIN,
      });
      user.defaultCafe = cafe;
      em.persist(cafeUser);
      await em.flush();

      const { accessToken, refreshToken } = await this.issueTokens(
        em,
        user,
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          defaultCafeId: user.defaultCafe?.id ?? null,
        },
      };
    });
  }

  async login(dto: LoginDto): Promise<AuthTokensResponse> {
    const user = await this.em.findOne(User, { email: dto.email });
    if (!user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, Errors.INVALID_CREDENTIALS);
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, Errors.INVALID_CREDENTIALS);
    }

    const { accessToken, refreshToken } = await this.issueTokens(this.em, user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        defaultCafeId: user.defaultCafe?.id ?? null,
      },
    };
  }

  async refresh(dto: RefreshDto): Promise<{ accessToken: string }> {
    const tokenHash = this.hashToken(dto.refreshToken);
    const stored = await this.em.findOne(
      RefreshToken,
      { tokenHash },
      { populate: ['user'] },
    );
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, Errors.INVALID_REFRESH);
    }

    const accessToken = this.jwt.sign(
      { sub: stored.user.id, email: stored.user.email } satisfies JwtPayload,
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: ACCESS_TTL,
      },
    );

    return { accessToken };
  }

  async logout(dto: LogoutDto): Promise<void> {
    const tokenHash = this.hashToken(dto.refreshToken);
    const stored = await this.em.findOne(RefreshToken, { tokenHash });
    if (stored && !stored.revokedAt) {
      stored.revokedAt = new Date();
      await this.em.flush();
    }
  }

  /**
   * NestJS Passport JwtStrategy의 validate에서 사용 — Access JWT payload만 검증.
   */
  async validateAccessPayload(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.em.findOne(User, { id: payload.sub });
    if (!user) {
      throw new UnauthorizedException();
    }
    return payload;
  }

  private async issueTokens(em: EntityManager, user: User) {
    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email } satisfies JwtPayload,
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: ACCESS_TTL,
      },
    );

    const refreshTokenRaw = randomBytes(48).toString('hex');
    const refreshToken = em.create(RefreshToken, {
      user,
      tokenHash: this.hashToken(refreshTokenRaw),
      expiresAt: new Date(
        Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
      ),
    });
    em.persist(refreshToken);
    await em.flush();

    return { accessToken, refreshToken: refreshTokenRaw };
  }

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
