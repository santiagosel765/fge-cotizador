import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { FindOptionsWhere, ILike, IsNull, Not, Repository } from 'typeorm';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';

export type UserPublic = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(search?: string): Promise<UserPublic[]> {
    const where: FindOptionsWhere<User>[] | FindOptionsWhere<User> = search
      ? [
          { deletedAt: IsNull(), fullName: ILike(`%${search}%`) },
          { deletedAt: IsNull(), email: ILike(`%${search}%`) },
        ]
      : { deletedAt: IsNull() };

    const users = await this.usersRepository.find({ where, order: { createdAt: 'DESC' } });
    return users.map((user) => this.toPublicUser(user));
  }

  async findOne(id: string): Promise<UserPublic> {
    const user = await this.findEntityById(id);
    return this.toPublicUser(user);
  }

  async create(dto: CreateUserDto): Promise<UserPublic> {
    const existingUser = await this.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      phone: dto.phone,
      role: dto.role ?? UserRole.CLIENT,
      passwordHash,
    });

    const savedUser = await this.usersRepository.save(user);
    return this.toPublicUser(savedUser);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserPublic> {
    const user = await this.findEntityById(id);

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.role !== undefined) user.role = dto.role;

    if (dto.isActive === false) {
      await this.softDelete(id);
      const softDeletedUser = await this.usersRepository.findOne({ where: { id }, withDeleted: true });
      if (!softDeletedUser) {
        throw new NotFoundException('Usuario no encontrado');
      }
      return this.toPublicUser(softDeletedUser);
    }

    if (dto.isActive === true) {
      await this.usersRepository.restore(id);
    }

    const updatedUser = await this.usersRepository.save(user);
    return this.toPublicUser(updatedUser);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findEntityById(id);
    const passwordMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash ?? '');

    if (!passwordMatches) {
      throw new UnauthorizedException('Contraseña actual inválida');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepository.save(user);
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.findEntityById(id);

    if (user.role === UserRole.ADMIN) {
      const adminCount = await this.usersRepository.count({
        where: { role: UserRole.ADMIN, deletedAt: IsNull(), id: Not(id) },
      });

      if (adminCount === 0) {
        throw new ConflictException('No se puede eliminar el último admin');
      }
    }

    await this.usersRepository.softDelete(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findEntityById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id, deletedAt: IsNull() } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async createFromAuth(data: {
    email: string;
    fullName: string;
    phone?: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  toPublicUser(user: User): UserPublic {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone ?? null,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
