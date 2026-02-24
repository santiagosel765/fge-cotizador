import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  register(_: unknown): string {
    // TODO: implementar
    return 'auth: register';
  }

  login(_: unknown): string {
    // TODO: implementar
    return 'auth: login';
  }
}
