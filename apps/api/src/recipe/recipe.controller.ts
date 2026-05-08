import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { CafeMemberGuard } from '../common/guards/cafe-member.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateRecipeDto, RecipeResponse, UpdateRecipeDto } from './dto';
import { RecipeService } from './recipe.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Get('cafes/:cafeId/recipes')
  @UseGuards(CafeMemberGuard)
  async list(
    @Param('cafeId', ParseIntPipe) cafeId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<RecipeResponse[]> {
    return this.recipeService.listByCafe(cafeId, user.sub);
  }

  @Get('cafes/:cafeId/recipes/:id')
  @UseGuards(CafeMemberGuard)
  async getRecipe(
    @Param('cafeId', ParseIntPipe) cafeId: number,
    @Param('id', ParseIntPipe) recipeId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<RecipeResponse> {
    return this.recipeService.getRecipe(cafeId, recipeId, user.sub);
  }

  @Post('cafes/:cafeId/recipes')
  @UseGuards(CafeMemberGuard)
  async create(
    @Param('cafeId', ParseIntPipe) cafeId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRecipeDto,
  ): Promise<RecipeResponse> {
    return this.recipeService.createRecipe(cafeId, user.sub, dto);
  }

  @Patch('cafes/:cafeId/recipes/:id')
  @UseGuards(CafeMemberGuard)
  async update(
    @Param('cafeId', ParseIntPipe) cafeId: number,
    @Param('id', ParseIntPipe) recipeId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateRecipeDto,
  ): Promise<RecipeResponse> {
    return this.recipeService.updateRecipe(cafeId, recipeId, user.sub, dto);
  }

  @Delete('cafes/:cafeId/recipes/:id')
  @UseGuards(CafeMemberGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('cafeId', ParseIntPipe) cafeId: number,
    @Param('id', ParseIntPipe) recipeId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.recipeService.deleteRecipe(cafeId, recipeId, user.sub);
  }
}
