import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DatabaseService } from '@utils/database.service';
import { QueryLoaderService } from '@utils/query-loader.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import {
  decryptJSAES,
  encryptJSAES,
  isSHA512Hash,
} from '@utils/functions.service';
import { PasswordService } from '@utils/password.service';
import { boolean } from 'zod';
import { PasswordUserDto } from './dto/update-password.dto';
import { CreateUserRolesDto } from './dto/create-user-roles.dto';
import { addUserDTO } from 'src/service/dto/createUser';

@Injectable()
export class UsersService {
  private readonly queryLoader = new QueryLoaderService('queries.sql');
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly errorHandler: ErrorHandlerService,
    private readonly passwService: PasswordService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
    metadata: Record<string, any>,
  ): Promise<any> {
    const { email, name, username, password, created_by, avatar, roles } =
      createUserDto;
    const client = await this.databaseService.beginTransaction();
    try {
      const isExistEmail = await this.getUserByEmailDifferentUser(
        client,
        email.trim().toLowerCase(),
        -1,
      );

      if (isExistEmail) {
        this.databaseService.rollbackTransaction(client);
        return { showCode: 200, message: `The Email is already exist` };
      }
      const isExistUserName = await this.getUserByUserNameDifferentUser(
        client,
        username.trim().toLocaleUpperCase(),
        -1,
      );
      if (isExistUserName) {
        this.databaseService.rollbackTransaction(client);
        return { showCode: 200, message: `The username is already exist` };
      }
      const passwEncrypted = this.passwService.encryptPassword(password);
      const query = this.queryLoader.getQueryById('insert_users');
      const userResult = await client.query(query, [
        email,
        name,
        username,
        passwEncrypted,
        created_by,
        avatar,
      ]);
      const userId = userResult.rows[0].id;
      if (roles) {
        const roleQueries = roles.map((role) => ({
          text: this.queryLoader.getQueryById('insert_user_roles'),
          values: [userId, role.menu_id, role.role_id],
        }));
        for (const query of roleQueries) {
          await client.query(query.text, query.values);
        }
      }
      await this.databaseService.commitTransaction(client);
      this.errorHandler.saveLogToDB(
        `user`,
        `create`,
        `info`,
        `Query with param ${JSON.stringify(createUserDto)}`,
        JSON.stringify(metadata),
      );
      return { showCode: 200, message: 'Data was saved successfully!' };
    } catch (error) {
      await this.databaseService.rollbackTransaction(client);
      this.errorHandler.throwBadRequestError(error, 'Failed to save!.');
    }
  }

  async updateUser(
    id: string,
    user: UpdateUserDto,
    metadata: Record<string, any>,
  ): Promise<any> {
    const idNumber = Number(decryptJSAES(id));

    const client = await this.databaseService.beginTransaction();
    try {
      let query = this.queryLoader.getQueryById('update_users');
      const Rs = await this.getUserById(client, idNumber);
      if (!Rs.rows[0]) {
        await this.databaseService.rollbackTransaction(client);
        return { showCode: 200, message: `No record found!` };
      }
      let oldRs = await this.getUserById(client, idNumber);
      oldRs = oldRs.rows[0];
      let where: string;
      if (oldRs) {
        if (
          oldRs.username.trim().toUpperCase() !=
            user.username.trim().toUpperCase() &&
          oldRs.email.trim().toLowerCase() != user.email.trim().toLowerCase()
        ) {
          const isExistUserName = await this.getUserByUserNameDifferentUser(
            client,
            user.username.trim().toLocaleUpperCase(),
            idNumber,
          );
          if (isExistUserName) {
            this.databaseService.rollbackTransaction(client);
            return { showCode: 200, message: `The username is already exist` };
          }
          const isExistEmail = await this.getUserByEmailDifferentUser(
            client,
            user.email.trim().toLowerCase(),
            idNumber,
          );
          if (isExistEmail) {
            this.databaseService.rollbackTransaction(client);
            return { showCode: 200, message: `The Email is already exist` };
          }

          where = ',email=$4,username=$5 WHERE id=$6';
          query = query.replaceAll('::condition', where);
          await client.query(query, [
            user.avatar,
            user.name,
            user.updated_by,
            user.email,
            user.username,
            idNumber,
          ]);
        } else if (
          oldRs.username.trim().toUpperCase() !=
            user.username.trim().toUpperCase() &&
          oldRs.email.trim().toLowerCase() == user.email.trim().toLowerCase()
        ) {
          const isExistUserName = await this.getUserByUserNameDifferentUser(
            client,
            user.username.trim().toLocaleUpperCase(),
            idNumber,
          );
          if (isExistUserName) {
            this.databaseService.rollbackTransaction(client);
            return { showCode: 200, message: `The username is already exist` };
          }
          where = ',username=$4 WHERE id=$5';
          query = query.replaceAll('::condition', where);
          await client.query(query, [
            user.avatar,
            user.name,
            user.updated_by,
            user.username,
            idNumber,
          ]);
        } else if (
          oldRs.username.trim().toUpperCase() ==
            user.username.trim().toUpperCase() &&
          oldRs.email.trim().toLowerCase() != user.email.trim().toLowerCase()
        ) {
          const isExistEmail = await this.getUserByEmailDifferentUser(
            client,
            user.email.trim().toLowerCase(),
            idNumber,
          );
          if (isExistEmail) {
            this.databaseService.rollbackTransaction(client);
            return { showCode: 200, message: `The Email is already exist` };
          }
          where = ',email=$4 WHERE id=$5';
          query = query.replaceAll('::condition', where);
          await client.query(query, [
            user.avatar,
            user.name,
            user.updated_by,
            user.email,
            idNumber,
          ]);
        } else {
          where = ' WHERE id=$4';
          query = query.replaceAll('::condition', where);
          await client.query(query, [
            user.avatar,
            user.name,
            user.updated_by,
            idNumber,
          ]);
        }
      }

      const userId = idNumber;
      await this.deleteUserRoles(client, userId);
      if (user.roles) {
        const roleQueries = user.roles.map((role) => ({
          text: this.queryLoader.getQueryById('insert_user_roles'),
          values: [userId, role.menu_id, role.role_id],
        }));
        for (const query of roleQueries) {
          await client.query(query.text, query.values);
        }
      }
      await this.databaseService.commitTransaction(client);
      this.errorHandler.saveLogToDB(
        `user`,
        `update`,
        `info`,
        `Query with param ${JSON.stringify(UpdateUserDto)}`,
        JSON.stringify(metadata),
      );
      return { showCode: 200, message: 'Data was saved successfully' };
    } catch (error) {
      try {
        await this.databaseService.rollbackTransaction(client);
      } catch (e) {
        this.errorHandler.throwBadRequestError(error, 'Failed to save.');
      }
      this.errorHandler.throwBadRequestError(error, error);
    }
  }
  async deleteUserRoles(client: any | null = null, id: number) {
    const dbClient = client ?? this.databaseService;
    const query = this.queryLoader.getQueryById('delete_user_roles');
    await dbClient.query(query, [id]);
  }
  async deleteUsers(id: string, metadata: Record<string, any>): Promise<any> {
    try {
      const user_id = Number(decryptJSAES(id));
      const query = this.queryLoader.getQueryById('delete_users');
      await this.databaseService.query(query, [user_id]);
      this.errorHandler.saveLogToDB(
        `user`,
        `delete`,
        `info`,
        `Query with param id=${id}`,
        JSON.stringify(metadata),
      );
      return { showCode: 200, message: 'Data was deleted successfully' };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Failed to delete');
    }
  }

  async getRolesList(metadata: Record<string, any>): Promise<any> {
    try {
      const query = this.queryLoader.getQueryById('query_roles');
      const result = await this.databaseService.query(query);
      const rowList = result.map((row) => ({
        ...row,
      }));
      return { showCode: 200, data: rowList };
    } catch (error) {
      this.errorHandler.saveLogToDB(
        'get-roles-all',
        'list-all',
        'error',
        error,
        JSON.stringify(metadata),
      );
      this.errorHandler.throwBadRequestError(error, 'Failed to query');
    }
  }
  async getUserList(
    params: {
      search: string;
      page: number;
      limit: number;
      sort: string;
      order: 'ASC' | 'DESC';
    },
    metadata: Record<string, any>,
  ): Promise<any> {
    try {
      const { search, page, limit, sort, order } = params;
      const searchQuery = search ? `%${search}%` : null;
      const offset = BigInt((Number(page) - 1) * Number(limit));
      const queryParams: any[] = [];
      let query = this.queryLoader.getQueryById('query_users');
      const where = ` WHERE lower(name) ilike $1 OR lower(email) ILIKE $1 OR lower(username) ILIKE $1`;
      if (search) {
        query += where;
        queryParams.push(searchQuery);
      }
      query += ` ORDER BY ${sort} ${order} LIMIT $${
        queryParams.length + 1
      } OFFSET $${queryParams.length + 2}`;
      queryParams.push(limit, offset);

      let countQuery = this.queryLoader.getQueryById('query_count_users');
      if (search) {
        countQuery += where;
      }
      const countParams = search ? [searchQuery] : [];
      const [rows, countResult] = await Promise.all([
        this.databaseService.query(query, queryParams),
        this.databaseService.query(countQuery, countParams),
      ]);
      const total = parseInt(countResult[0].count, 10);
      const list = rows.map((row) => ({
        ...row,
        id: encryptJSAES(row.id.toString()),
      }));
      return { data: list, total, page, limit };
    } catch (error) {
      this.errorHandler.saveLogToDB(
        'manajemen-truck-list',
        'list-pagination',
        'error',
        error,
        JSON.stringify(metadata),
      );
      this.errorHandler.throwBadRequestError(error, 'Failed to query.');
    }
  }
  async getMenuList(metadata: Record<string, any>): Promise<any> {
    try {
      const query = this.queryLoader.getQueryById('query_menus');
      const result = await this.databaseService.query(query);
      const rowList = result.map((row) => ({
        ...row,
      }));
      return { showCode: 200, data: rowList };
    } catch (error) {
      this.errorHandler.saveLogToDB(
        'get-roles-all',
        'list-all',
        'error',
        error,
        JSON.stringify(metadata),
      );
      this.errorHandler.throwBadRequestError(error, 'Failed to query');
    }
  }
  async getUserById(client: any | null = null, id: number) {
    const dbClient = client ?? this.databaseService;
    const query = this.queryLoader.getQueryById('query_users_by_id');
    return await dbClient.query(query, [id]);
  }
  async getUserByEmailDifferentUser(client: any, email: string, id: number) {
    const query = this.queryLoader.getQueryById(
      'query_users_by_email_different_user',
    );
    const Rs = await client.query(query, [email, id]);
    return Rs.rows[0].exists;
  }
  async getUserByUserNameDifferentUser(
    client: any,
    username: string,
    id: number,
  ): Promise<boolean> {
    const query = this.queryLoader.getQueryById(
      'query_users_by_username_different_user',
    );
    const Rs = await client.query(query, [username, id]);
    return Rs.rows[0].exists;
  }
  async changePassword(
    id: string,
    passwordUser: PasswordUserDto,
    metadata: Record<string, any>,
  ) {
    try {
      const idNumber = Number(decryptJSAES(id));
      const Rs = await this.getUserById(null, idNumber);
      if (!Rs[0]) {
        return { showCode: 200, message: `No record found!` };
      }
      const query = this.queryLoader.getQueryById('update_users_password');
      await this.databaseService.query(query, [
        this.passwService.encryptPassword(passwordUser.password),
        idNumber,
      ]);
      this.errorHandler.saveLogToDB(
        `user`,
        `update`,
        `info`,
        `Query with param id=${idNumber}`,
        JSON.stringify(metadata),
      );
      return {
        showCode: 200,
        message: 'Change password was saved successfully.',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Change Password failed!');
    }
  }
  async saveUserRoles(
    client: any | null = null,
    userId: number,
    roles: CreateUserRolesDto[],
  ) {
    if (roles) {
      const dbClient = client ?? this.databaseService;
      await this.deleteUserRoles(dbClient, userId);
      const roleQueries = roles.map((role) => ({
        text: this.queryLoader.getQueryById('insert_user_roles'),
        values: [userId, role.menu_id, role.role_id],
      }));
      for (const query of roleQueries) {
        await dbClient.query(query.text, query.values);
      }
    }
  }
  async getDefaultUserRolesFamous() {
    const roles: CreateUserRolesDto[] = [
      { user_id: '-', menu_id: 'mo-dash', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-um', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-tm', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-cps', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-lanes', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-lr', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-cpsr', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-tvm', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-driver', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-cctv', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-gm', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-cron', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-street', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-actlog', role_id: 'read' },
      { user_id: '-', menu_id: 'mo-report', role_id: 'read' },
    ];
    return roles;
  }
  async showUserAndRoles(id: string, metadata: Record<string, any>) {
    try {
      const userId = Number(decryptJSAES(id));
      const query = this.queryLoader.getQueryById('query_roles_by_user_id');
      const Rs = await this.databaseService.queryOne(query, [userId]);

      const Rs0 = {
        ...Rs,
        user_id: encryptJSAES(Rs.user_id.toString()),
      };
      return { showCode: 200, data: Rs0 };
    } catch (error) {
      this.errorHandler.saveLogToDB(
        'user',
        'view',
        'error',
        JSON.stringify(error),
        JSON.stringify(metadata),
      );

      this.errorHandler.throwBadRequestError(error, 'failed to query!');
    }
  }

  async bypassAddUserDefault(dto: addUserDTO): Promise<any> {
    try {
      let encryptPassword = this.passwService.encryptPassword(dto.password);
      const queryInsertUser = this.queryLoader.getQueryById('insert_users');
      const userResult = await this.databaseService.query(queryInsertUser, [
        dto.email,
        dto.name,
        dto.username,
        encryptPassword,
        null,
        null,
      ]);
      const roles = await this.getDefaultUserRolesFamous();
      const insertUserRole = await this.saveUserRoles(
        null,
        userResult[0].id,
        roles,
      );
    } catch (error) {
      return error.message;
    }
  }
}
