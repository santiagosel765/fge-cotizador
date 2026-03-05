import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersService, UserPublic } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: UserPublic }> {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.createFromAuth({
      email: dto.email,
      fullName: dto.fullName,
      phone: dto.phone,
      passwordHash,
      role: UserRole.CLIENT,
    });

    return {
      accessToken: this.signToken(user),
      user: this.usersService.toPublicUser(user),
    };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: UserPublic }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash ?? '');

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return {
      accessToken: this.signToken(user),
      user: this.usersService.toPublicUser(user),
    };
  }

  async validateToken(userId: string): Promise<UserPublic> {
    const user = await this.usersService.findEntityById(userId);
    return this.usersService.toPublicUser(user);
  }

  private signToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
