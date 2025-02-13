import { PasswordService } from '@utils/password.service';
import { encryptJSAES } from '@utils/functions.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entity/user';
import { Repository } from 'typeorm';
import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { AuthPayloadDto, AuthResponseDto } from '../auth/dto/auth.dto';
import { FamousApiDto, FamousLogin } from '../dto/famous.api.dto';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { AxiosError } from 'axios';
import { UsersService } from 'src/users/users.service';
import { ErrorHandlerService } from '@utils/error-handler.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
    private http: HttpService,
    private passwordService: PasswordService,
    private usersService: UsersService,
    private errHandler: ErrorHandlerService,
  ) {}

  async validateUser({ username, password }: AuthPayloadDto): Promise<User> {
    return this.findByEmail(username);
  }

  async validateUserByFamousToken(token: string): Promise<User> {
    const famousUser = await this.validateUserFromToken(token);
    const user = await this.findByEmail(famousUser.data.email);
    return user;
  }

  async validateFamousUser(request: AuthPayloadDto): Promise<AuthResponseDto> {
    const famousLoginRequest: FamousLogin = {
      email: request.username,
      password: request.password,
    };
    const findUser = await this.loginUserFamous(famousLoginRequest);
    let user: any;
    let token: string;
    if (!findUser) {
      //If not found from famous check from local
      user = await this.userRepository.findOneBy({ email: request.username });
      if (!user) {
        throw new HttpException('Username or password is not valid', 400);
      } else {
        const hassPassw = this.passwordService.encryptPassword(
          request.password,
        );
        if (user.passw != hassPassw) {
          throw new HttpException('Username or password is not valid', 400);
        } else {
          token = this.jwtService.sign(JSON.parse(JSON.stringify(user)));
        }
      }
    } else {
      const famousUser = findUser.user;
      user = await this.findByEmail(famousUser.email);
      if (!user) {
        const createUser: User = new User();
        createUser.email = famousUser.email;
        createUser.username = famousUser.username;
        createUser.name = famousUser.name;
        createUser.avatar = famousUser.avatar;
        user = await this.save(createUser);
      } else {
        user.email = famousUser.email;
        user.username = famousUser.username;
        user.name = famousUser.name;
        user.avatar = famousUser.avatar;
        user.role_name = 'USER';
        await this.save(user);
      }
      const roles = await this.usersService.getDefaultUserRolesFamous();
      this.usersService.saveUserRoles(null, user.id, roles);
      token = this.jwtService.sign(JSON.parse(JSON.stringify(user)));
    }

    return {
      status: 200,
      message: 'success',
      data: {
        token: token,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        user_id: encryptJSAES(user.id.toString()),
        role: user.role_name ?? '',
      },
    };
  }

  async loginUserFamous(request: FamousLogin): Promise<FamousApiDto | null> {
    try {
      const requestConfig = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const requestUrl = process.env.FAMOUS_LOGIN_URL;

      this.errHandler.logDebug(
        `request external api url : ${requestUrl} request : ${JSON.stringify(
          request,
        )}`,
      );

      const { data } = await firstValueFrom(
        this.http.post<FamousApiDto>(requestUrl, request, requestConfig).pipe(
          catchError((error: AxiosError) => {
            this.errHandler.logError('error', error.response?.data);
            this.errHandler.throwBadRequestError(error, 'An error happened');
            // Return an observable that emits an error so that the flow can continue correctly
            return throwError(() => new Error('Request failed'));
          }),
        ),
      );

      this.errHandler.logDebug(
        `response external api : ${JSON.stringify(data)}`,
      );
      return data;
    } catch (error: any) {
      //let go to change from local login
      //throw new HttpException('Username or password is not valid', 400);
    }
  }

  async validateUserFromToken(famousToken: string): Promise<AuthResponseDto> {
    const findUser = await this.getFamousUserFromToken(famousToken);
    if (!findUser) {
      throw new HttpException('Username or password is not valid', 400);
    }

    const famousUser = findUser.user;
    let user: User = await this.findByEmail(famousUser.email);
    if (!user) {
      const createUser: User = new User();
      createUser.email = famousUser.email;
      createUser.username = famousUser.username;
      createUser.name = famousUser.name;
      createUser.avatar = famousUser.avatar;
      user = await this.save(createUser);
    } else {
      user.email = famousUser.email;
      user.username = famousUser.username;
      user.name = famousUser.name;
      user.avatar = famousUser.avatar;
      await this.save(user);
    }

    const token = this.jwtService.sign(JSON.parse(JSON.stringify(user)));
    const userId = user.id;
    if (!userId) {
      throw new HttpException('Unauthorized', 401);
    }
    return {
      status: 200,
      message: 'success',
      data: {
        token: token,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        user_id: encryptJSAES(user.id.toString()),
        role: user.role_name ?? '',
      },
    };
  }

  async getFamousUserFromToken(
    famousToken: string,
  ): Promise<FamousApiDto | null> {
    try {
      const requestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': famousToken,
        },
      };

      const requestUrl = process.env.FAMOUS_AUTH_ME;

      this.errHandler.logDebug(`request external api url : ${requestUrl}`);
      const { data } = await firstValueFrom(
        this.http.get<FamousApiDto>(requestUrl, requestConfig).pipe(
          catchError((error: AxiosError) => {
            this.errHandler.logError('error', error.response.data);
            this.errHandler.throwBadRequestError(error, 'An error happened!');
            return throwError(() => new Error('Request failed'));
          }),
        ),
      );

      this.errHandler.logDebug(
        `response external api : ${JSON.stringify(data)}`,
      );
      return data;
    } catch (error: any) {
      throw new HttpException('Username or password is not valid', 400);
    }
  }

  async findByEmail(email: string): Promise<User | any> {
    try {
      return this.userRepository.findOneBy({ email: email });
    } catch (error: any) {
      throw new HttpException('Failed to get data from database', 400);
    }
  }

  async save(user: User): Promise<User> {
    try {
      return this.userRepository.save(user);
    } catch (error: any) {
      throw new HttpException('Failed to save user data', 400);
    }
  }
}
