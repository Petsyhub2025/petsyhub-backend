import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@customers/shared/constants';
import { CustomerJwtPersona, CustomResponse, Persona } from '@instapets-backend/common';
import { AddToFavoriteDto } from './dto/add-to-favorite.dto';
import { FavoriteService } from './favorite.service';
import { GetFavoritesQueryDto } from './dto/get-favorites.dto';

@Controller({
  path: 'favorites',
  ...globalControllerVersioning,
})
@ApiTags('customer/favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  @ApiBearerAuth()
  async addToFavorite(@Persona() customerJWT: CustomerJwtPersona, @Body() body: AddToFavoriteDto) {
    await this.favoriteService.addToFavorite(customerJWT._id, body);
    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  async getFavoriteList(@Persona() customerJWT: CustomerJwtPersona, @Query() query: GetFavoritesQueryDto) {
    const favoriteList = await this.favoriteService.getFavorites(customerJWT._id, query);
    return new CustomResponse().success({
      payload: favoriteList,
    });
  }
}
