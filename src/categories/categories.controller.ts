import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('api/v1/service/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'List service categories',
    description: 'Returns all active service categories in display order.',
  })
  @ApiOkResponse({
    description: 'Service categories returned successfully',
  })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':categoryId')
  @ApiOperation({
    summary: 'Get service category details',
    description: 'Returns one active service category by ID.',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Service category ID',
    example: 3,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Service category returned successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid category ID',
  })
  @ApiNotFoundResponse({
    description: 'Service category not found',
  })
  findOne(@Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.categoriesService.findOne(categoryId);
  }
}
