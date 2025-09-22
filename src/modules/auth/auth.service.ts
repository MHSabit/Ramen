// external imports
import { HttpStatus, Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as bcrypt from 'bcryptjs';

//internal imports
import appConfig from '../../config/app.config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from '../../common/repository/user/user.repository';
import { MailService } from '../../mail/mail.service';
import { UcodeRepository } from '../../common/repository/ucode/ucode.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { SojebStorage } from '../../common/lib/Disk/SojebStorage';
import { DateHelper } from '../../common/helper/date.helper';
import { StripePayment } from '../../common/lib/Payment/stripe/StripePayment';
import { StringHelper } from '../../common/helper/string.helper';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { ApiResponse } from '../../types/api-response.type';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailService: MailService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async me(userId: string): Promise<ApiResponse> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          avatar: true,
          address: true,
          phone_number: true,
          type: true,
          gender: true,
          date_of_birth: true,
          created_at: true,
          cart_id: true,
        },
      });

      if (!user) {
        return ApiResponseHelper.notFound('User not found', 'USER_NOT_FOUND');
      }

      if (user.avatar) {
        user['avatar_url'] = SojebStorage.url(
          appConfig().storageUrl.avatar + `/${user.avatar}`,
        );
      }

      return ApiResponseHelper.success(
        user,
        'User fetched successfully',
        HttpStatus.OK,
        'USER_FETCH_SUCCESS'
      );
    } catch (error) {
      return ApiResponseHelper.error(
        error.message || 'Failed to fetch user details',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'USER_FETCH_ERROR'
      );
    }
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
    image?: Express.Multer.File,
  ): Promise<ApiResponse<null>> {
    try {
      const data: any = {};
      if (updateUserDto.name) {
        data.name = updateUserDto.name;
      }
      if (updateUserDto.first_name) {
        data.first_name = updateUserDto.first_name;
      }
      if (updateUserDto.last_name) {
        data.last_name = updateUserDto.last_name;
      }
      if (updateUserDto.phone_number) {
        data.phone_number = updateUserDto.phone_number;
      }
      if (updateUserDto.country) {
        data.country = updateUserDto.country;
      }
      if (updateUserDto.state) {
        data.state = updateUserDto.state;
      }
      if (updateUserDto.local_government) {
        data.local_government = updateUserDto.local_government;
      }
      if (updateUserDto.city) {
        data.city = updateUserDto.city;
      }
      if (updateUserDto.zip_code) {
        data.zip_code = updateUserDto.zip_code;
      }
      if (updateUserDto.address) {
        data.address = updateUserDto.address;
      }
      if (updateUserDto.gender) {
        data.gender = updateUserDto.gender;
      }
      if (updateUserDto.date_of_birth) {
        data.date_of_birth = DateHelper.format(updateUserDto.date_of_birth);
      }
      if (image) {
        // delete old image from storage
        const oldImage = await this.prisma.user.findFirst({
          where: { id: userId },
          select: { avatar: true },
        });
        if (oldImage.avatar) {
          await SojebStorage.delete(
            appConfig().storageUrl.avatar + oldImage.avatar,
          );
        }

        // upload file
        const fileName = `${StringHelper.randomString()}${image.originalname}`;
        await SojebStorage.put(
          appConfig().storageUrl.avatar + `/${fileName}`,
          image.buffer,
        );

        data.avatar = fileName;
      }
      const user = await UserRepository.getUserDetails(userId);
      if (user) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            ...data,
          },
        });

        return ApiResponseHelper.success(
          null,
          'User updated successfully',
          HttpStatus.OK,
          'USER_UPDATE_SUCCESS'
        );
      } else {
        return ApiResponseHelper.notFound(
          'User not found',
          'USER_NOT_FOUND'
        );
      }
    } catch (error) {
      return ApiResponseHelper.error(
        error.message || 'Failed to update user',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'USER_UPDATE_ERROR'
      );
    }
  }

  async validateUser(
    email: string,
    pass: string,
    token?: string,
  ): Promise<any> {
    const _password = pass;
    const user = await this.prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (user) {
      const _isValidPassword = await UserRepository.validatePassword({
        email: email,
        password: _password,
      });
      if (_isValidPassword) {
        const { password, ...result } = user;
        if (user.is_two_factor_enabled) {
          if (token) {
            const isValid = await UserRepository.verify2FA(user.id, token);
            if (!isValid) {
              throw new UnauthorizedException('Invalid token');
              // return {
              //   success: false,
              //   message: 'Invalid token',
              // };
            }
          } else {
            throw new UnauthorizedException('Token is required');
            // return {
            //   success: false,
            //   message: 'Token is required',
            // };
          }
        }
        return result;
      } else {
        throw new UnauthorizedException('Password not matched');
        // return {
        //   success: false,
        //   message: 'Password not matched',
        // };
      }
    } else {
      throw new UnauthorizedException('Email not found');
      // return {
      //   success: false,
      //   message: 'Email not found',
      // };
    }
  }

  async login(loginDto: AuthEmailLoginDto): Promise<ApiResponse> {
    try {
      // console.log("loginDto", loginDto.email);
      const user = await UserRepository.getUserDetailsByEmail(loginDto.email);
      // console.log("user", user);
      // console.log("loginDto", loginDto);
      if (!user) {
        throw new UnprocessableEntityException({
          status: HttpStatus.NOT_FOUND,
          errors: {
            email: 'User Not Found',
          },
        });
      }

      if (!user.password) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            password: 'incorrectPassword',
          },
        });
      }

      const isValidPassword = await bcrypt.compare(
        loginDto.password,
        user.password,
      );
      // console.log("isValidPassword", isValidPassword);
  
      if (!isValidPassword) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            password: 'incorrectPassword',
          },
        });
      }
      
      const { token, refreshToken, tokenExpires } = await this.getTokensData({
        id: user.id,
      });
      
      // store refreshToken
      await this.redis.set(
        `refresh_token:${user.id}`,
        refreshToken,
        'EX',
        60 * 5, // 5 minutes in seconds
      );

      return ApiResponseHelper.success(
        {
          refreshToken,
          token,
          tokenExpires,
          user,
        },
        'Login successful',
        HttpStatus.OK,
      );
  
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      
      return ApiResponseHelper.error(
        error.message || 'Login failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'LOGIN_ERROR',
      );
    }
  }

  async refreshToken(data: { userId: string }): Promise<ApiResponse> {
    try {
      const user = await UserRepository.getUserDetails(data.userId);
      // console.log("user", user);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const { token, refreshToken, tokenExpires } = await this.getTokensData({
        id: user.id,
      });

      // Update refresh token in Redis
      await this.redis.set(
        `refresh_token:${user.id}`,
        refreshToken,
        'EX',
        60 * 5, // 5 minutes in seconds
      );

      return ApiResponseHelper.success(
        {
          token,
          refreshToken,
          tokenExpires,
        },
        'Token refreshed successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      return ApiResponseHelper.unauthorized(
        'Invalid refresh token',
        'INVALID_REFRESH_TOKEN',
      );
    }
  }

  private async getTokensData(data: { id: string }): Promise<{
    token: string;
    refreshToken: string;
    tokenExpires: Date;
  }> {
    const tokenExpiresIn = '1h';
    const refreshExpiresIn = '7d';

    const tokenExpires = Date.now() + this.parseExpiration(tokenExpiresIn);

    // Get user with roles
    const user = await UserRepository.getUserDetails(data.id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const jwtPayload = {
      sub: data.id.toString(),
      iss: 'Ramen',
      aud: 'privy',
      id: data.id,
      email: user.email,
      roles: user.role_users?.map((roleUser) => ({
        id: roleUser.role.id,
        name: roleUser.role.name,
      })) ?? [],
    };

    const refreshSecret = appConfig().jwt.refresh_secret;
    
    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        expiresIn: tokenExpiresIn,
      }),
      this.jwtService.signAsync(
        {
          userId: user.id,
        },
        {
          expiresIn: refreshExpiresIn,
        },
      ),
    ]);
    
    // console.log('Auth Service - getTokensData - Generated refresh token:', refreshToken);

    const dateTokenExpires = new Date(tokenExpires);

    return {
      token,
      refreshToken,
      tokenExpires: dateTokenExpires,
    };
  }

  private parseExpiration(expiration: string): number {
    // Simple parser for common expiration formats
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000;
    }
  }

  async revokeRefreshToken(user_id: string): Promise<ApiResponse<null>> {
    try {
      const storedToken = await this.redis.get(`refresh_token:${user_id}`);
      if (!storedToken) {
        return ApiResponseHelper.notFound(
          'Refresh token not found',
          'REFRESH_TOKEN_NOT_FOUND'
        );
      }

      await this.redis.del(`refresh_token:${user_id}`);

      return ApiResponseHelper.success(
        null,
        'Refresh token revoked successfully',
        HttpStatus.OK,
        'REFRESH_TOKEN_REVOKED_SUCCESS'
      );
    } catch (error) {
      return ApiResponseHelper.error(
        error.message || 'Failed to revoke refresh token',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'REFRESH_TOKEN_REVOKE_ERROR'
      );
    }
  }

  async register({
   
    first_name,
    last_name,
    email,
    password,
    type,
  }: {
    
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    type?: string;
  }): Promise<ApiResponse> {
    try {
      // Check if email already exist
      const userEmailExist = await UserRepository.exist({
        field: 'email',
        value: String(email),
      });

      if (userEmailExist) {
        return ApiResponseHelper.unprocessableEntity(
          'Email already exist',
          'EMAIL_EXISTS',
        );
      }

      const user = await UserRepository.createUser({
   
        first_name: first_name,
        last_name: last_name,
        email: email,
        password: password,
        type: type,
      });

      if (user == null && user.success == false) {
        return ApiResponseHelper.error(
          'Failed to create account',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'ACCOUNT_CREATION_FAILED',
        );
      }

      // create stripe customer account
      const stripeCustomer = await StripePayment.createCustomer({
        user_id: user.data.id,
        email: email,
        name: first_name + ' ' + last_name,
      });

      if (stripeCustomer) {
        await this.prisma.user.update({
          where: {
            id: user.data.id,
          },
          data: {
            billing_id: stripeCustomer.id,
          },
        });
      }

      // ----------------------------------------------------
      // // create otp code
      // const token = await UcodeRepository.createToken({
      //   userId: user.data.id,
      //   isOtp: true,
      // });

      // // send otp code to email
      // await this.mailService.sendOtpCodeToEmail({
      //   email: email,
      //   name: name,
      //   otp: token,
      // });

      // return {
      //   success: true,
      //   message: 'We have sent an OTP code to your email',
      // };

      // ----------------------------------------------------

      // Generate verification token
      const token = await UcodeRepository.createVerificationToken({
        userId: user.data.id,
        email: email,
      });

      // Send verification email with token
      await this.mailService.sendVerificationLink({
        email,
        name: email,
        token: token.token,
        type: type,
      });

      return ApiResponseHelper.success(
        null,
        'We have sent a verification link to your email',
        HttpStatus.CREATED,
      );
    } catch (error) {
      return ApiResponseHelper.error(
        error.message || 'Registration failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'REGISTRATION_ERROR',
      );
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      const user = await UserRepository.exist({
        field: 'email',
        value: email,
      });

      if (!user) {
        return ApiResponseHelper.notFound('Email not found', 'EMAIL_NOT_FOUND');
      }

      const token = await UcodeRepository.createToken({
        userId: user.id,
        isOtp: true,
      });

      await this.mailService.sendOtpCodeToEmail({
        email: email,
        name: user.name,
        otp: token,
      });

      return ApiResponseHelper.success(
        null,
        'We have sent an OTP code to your email',
        HttpStatus.OK,
        'OTP_SENT'
      );
    } catch (error) {
      return ApiResponseHelper.error(
        error.message || 'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'FORGOT_PASSWORD_ERROR'
      );
    }
  }

  async resetPassword({ email, token, password }) {
    try {
      const user = await UserRepository.exist({
        field: 'email',
        value: email,
      });

      if (user) {
        const existToken = await UcodeRepository.validateToken({
          email: email,
          token: token,
        });

        if (existToken) {
          await UserRepository.changePassword({
            email: email,
            password: password,
          });

          // delete otp code
          await UcodeRepository.deleteToken({
            email: email,
            token: token,
          });

          return {
            success: true,
            message: 'Password updated successfully',
            data:null
          };
        } else {
          return {
            success: false,
            message: 'Invalid token',
            data:null
          };
        }
      } else {
        return {
          success: false,
          message: 'Email not found',
          data:null
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data:null
      };
    }
  }

  async verifyEmail({ email, token }) {
    try {
      const user = await UserRepository.exist({
        field: 'email',
        value: email,
      });

      if (user) {
        const existToken = await UcodeRepository.validateToken({
          email: email,
          token: token,
        });

        if (existToken) {
          await this.prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              email_verified_at: new Date(Date.now()),
            },
          });

          // delete otp code
          // await UcodeRepository.deleteToken({
          //   email: email,
          //   token: token,
          // });

          return {
            success: true,
            message: 'Email verified successfully',
            data:null
          };
        } else {
          return {
            success: false,
            message: 'Invalid token',
            data:null
          };
        }
      } else {
        return {
          success: false,
          message: 'Email not found',
          data:null
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data:null
      };
    }
  }

  async resendVerificationEmail(email: string) {
    try {
      const user = await UserRepository.getUserByEmail(email);

      if (user) {
        // create otp code
        const token = await UcodeRepository.createToken({
          userId: user.id,
          isOtp: true,
        });

        // send otp code to email
        await this.mailService.sendOtpCodeToEmail({
          email: email,
          name: user.name,
          otp: token,
        });

        return {
          success: true,
          message: 'We have sent a verification code to your email',
          data:null
        };
      } else {
        return {
          success: false,
          message: 'Email not found',
          data:null
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data:null
      };
    }
  }

  async changePassword({ user_id, oldPassword, newPassword }) {
    try {
      const user = await UserRepository.getUserDetails(user_id);

      if (user) {
        const _isValidPassword = await UserRepository.validatePassword({
          email: user.email,
          password: oldPassword,
        });
        if (_isValidPassword) {
          await UserRepository.changePassword({
            email: user.email,
            password: newPassword,
          });

          return {
            success: true,
            message: 'Password updated successfully',
            data:null
          };
        } else {
          return {
            success: false,
            message: 'Invalid password',
            data:null
          };
        }
      } else {
        return {
          success: false,
          message: 'Email not found',
          data:null
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data:null
      };
    }
  }

  async requestEmailChange(user_id: string, email: string) {
    try {
      const user = await UserRepository.getUserDetails(user_id);
      if (user) {
        const token = await UcodeRepository.createToken({
          userId: user.id,
          isOtp: true,
          email: email,
        });

        await this.mailService.sendOtpCodeToEmail({
          email: email,
          name: email,
          otp: token,
        });

        return {
          success: true,
          message: 'We have sent an OTP code to your email',
          data:null
        };
      } else {
        return {
          success: false,
          message: 'User not found',
          data:null
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data:null
      };
    }
  }

  async changeEmail({
    user_id,
    new_email,
    token,
  }: {
    user_id: string;
    new_email: string;
    token: string;
  }) {
    try {
      const user = await UserRepository.getUserDetails(user_id);

      if (user) {
        const existToken = await UcodeRepository.validateToken({
          email: new_email,
          token: token,
          forEmailChange: true,
        });

        if (existToken) {
          await UserRepository.changeEmail({
            user_id: user.id,
            new_email: new_email,
          });

          // delete otp code
          await UcodeRepository.deleteToken({
            email: new_email,
            token: token,
          });

          return {
            success: true,
            message: 'Email updated successfully',
            data:null
          };
        } else {
          return {
            success: false,
            message: 'Invalid token',
            data:null
          };
        }
      } else {
        return {
          success: false,
          message: 'User not found',
          data:null
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data:null
      };
    }
  }

  // --------- 2FA ---------
  async generate2FASecret(user_id: string) {
    try {
      return await UserRepository.generate2FASecret(user_id);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async verify2FA(user_id: string, token: string) {
    try {
      const isValid = await UserRepository.verify2FA(user_id, token);
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid token',
        };
      }
      return {
        success: true,
        message: '2FA verified successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async enable2FA(user_id: string) {
    try {
      const user = await UserRepository.getUserDetails(user_id);
      if (user) {
        await UserRepository.enable2FA(user_id);
        return {
          success: true,
          message: '2FA enabled successfully',
        };
      } else {
        return {
          success: false,
          message: 'User not found',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async disable2FA(user_id: string) {
    try {
      const user = await UserRepository.getUserDetails(user_id);
      if (user) {
        await UserRepository.disable2FA(user_id);
        return {
          success: true,
          message: '2FA disabled successfully',
        };
      } else {
        return {
          success: false,
          message: 'User not found',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  // --------- end 2FA ---------
}