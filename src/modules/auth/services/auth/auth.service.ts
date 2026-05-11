import {
    ConflictException,
    Injectable,
    UnauthorizedException
  } from '@nestjs/common';
  
  import { InjectModel } from '@nestjs/mongoose';
  import { JwtService } from '@nestjs/jwt';
  import { Model } from 'mongoose';
  import * as bcrypt from 'bcrypt';
  
  import {
    User,
    UserDocument,
    UserRole
  } from '../../schemas/user.schema';
  
  import { CreateUserDto } from '../../dto/create-user.dto';
  import { LoginDto } from '../../dto/login.dto';
  
  @Injectable()
  export class AuthService {
    constructor(
      @InjectModel(User.name)
      private readonly userModel: Model<UserDocument>,
  
      private readonly jwtService: JwtService
    ) {}
  
    async createUser(dto: CreateUserDto) {
      const email = dto.email.toLowerCase();
  
      const exists = await this.userModel.findOne({ email });
  
      if (exists) {
        throw new ConflictException('E-mail já cadastrado.');
      }
  
      const passwordHash = await bcrypt.hash(dto.password, 10);
  
      const user = await this.userModel.create({
        name: dto.name,
        email,
        password: passwordHash,
        role: dto.role || UserRole.USER,
        active: true
      });
  
      const { password, ...userObj } = user.toObject();
  
      return userObj;
    }
  
    async login(dto: LoginDto) {
      const email = dto.email.toLowerCase();
  
      const user = await this.userModel.findOne({
        email,
        active: true
      });
  
      if (!user) {
        throw new UnauthorizedException('E-mail ou senha inválidos.');
      }
  
      const passwordValid = await bcrypt.compare(
        dto.password,
        user.password
      );
  
      if (!passwordValid) {
        throw new UnauthorizedException('E-mail ou senha inválidos.');
      }
  
      const payload = {
        sub: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      };
  
      return {
        accessToken: await this.jwtService.signAsync(payload),
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        }
      };
    }
  
    async validateUserById(id: string) {
      const user = await this.userModel
        .findById(id)
        .select('-password')
        .lean();
  
      if (!user || !user.active) {
        return null;
      }
  
      return user;
    }
  }