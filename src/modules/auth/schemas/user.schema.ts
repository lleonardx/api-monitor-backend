import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VIEWER = 'VIEWER'
}

@Schema({
  timestamps: true,
  collection: 'users'
})
export class User {
  @Prop({
    required: true,
    trim: true
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  })
  email: string;

  @Prop({
    required: true
  })
  password: string;

  @Prop({
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Prop({
    default: true
  })
  active: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ active: 1 });