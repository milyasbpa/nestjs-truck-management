import { PasswordUserDto } from './dto/update-password.dto';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { decryptJSAES, getMetaData } from '@utils/functions.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { addUserDTO } from 'src/service/dto/createUser';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @Req() req: Request,
  ): Promise<any> {
    const metadata = getMetaData(req);
    return this.usersService.createUser(createUserDto, metadata);
  }
  // @UseGuards(JwtAuthGuard)
  // @Post('create-default-user')
  // async createDefaultUser(@Body() createUserDto: addUserDTO): Promise<any> {
  //   return this.usersService.bypassAddUserDefault(createUserDto);
  // }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async getUsers(
    @Query('search') search: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('sort') sort: string,
    @Query('order') order: string,
    @Req() req: Request,
  ): Promise<any> {
    const metadata = getMetaData(req);

    return this.usersService.getUserList(
      {
        search: search,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sort: sort || 'updated_at',
        order: (order || 'DESC') as 'DESC' | 'ASC',
      },
      metadata,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('show/:id')
  async getUserById(
    @Param('id') id: string,
    @Req() Req: Request,
  ): Promise<any> {
    const metadata = getMetaData(Req);
    return this.usersService.showUserAndRoles(id, metadata);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() UpdateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    const metadata = getMetaData(req);
    return this.usersService.updateUser(id, UpdateUserDto, metadata);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteUser(@Param('id') id: string, @Req() req: Request) {
    const metadata = getMetaData(req);
    //soft delete
    return this.usersService.deleteUsers(id, metadata);
  }

  @UseGuards(JwtAuthGuard)
  @Get('menu')
  async getMenu(@Req() req: Request) {
    const metadata = getMetaData(req);
    //soft delete
    return this.usersService.getMenuList(metadata);
  }

  @UseGuards(JwtAuthGuard)
  @Get('role')
  async getRoles(@Req() req: Request) {
    const metadata = getMetaData(req);
    //soft delete
    return this.usersService.getRolesList(metadata);
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-passw/:id')
  async changePassw(
    @Param('id') id: string,
    @Body() passwordUserDto: PasswordUserDto,
    @Req() req: Request,
  ) {
    const metadata = getMetaData(req);
    //soft delete
    return this.usersService.changePassword(id, passwordUserDto, metadata);
  }
}
