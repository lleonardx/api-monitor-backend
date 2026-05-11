import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query
  } from '@nestjs/common';
  
  import {
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags
  } from '@nestjs/swagger';
  
  import { ApiMonitorService } from './services/api-monitor/api-monitor.service';
  
  import { CreateMonitoredApiDto } from './dto/create-monitored-api.dto';
  import { UpdateMonitoredApiDto } from './dto/update-monitored-api.dto';
  
  @ApiTags('API Monitor')
  @Controller('api-monitor')
  export class ApiMonitorController {
    constructor(
      private readonly apiMonitorService: ApiMonitorService
    ) {}
  
    @Post()
    @ApiOperation({
      summary: 'Criar API monitorada'
    })
    create(@Body() dto: CreateMonitoredApiDto) {
      return this.apiMonitorService.create(dto);
    }
  
    @Get()
    @ApiOperation({
      summary: 'Listar APIs monitoradas'
    })
    findAll() {
      return this.apiMonitorService.findAll();
    }
  
    @Get('history')
    @ApiOperation({
      summary: 'Listar histórico de verificações'
    })
    @ApiQuery({
      name: 'apiId',
      required: false
    })
    @ApiQuery({
      name: 'limit',
      required: false
    })
    findHistory(
      @Query('apiId') apiId?: string,
      @Query('limit') limit?: string
    ) {
      return this.apiMonitorService.findHistory({
        apiId,
        limit: limit ? Number(limit) : 100
      });
    }
  
    @Get('incidents')
    @ApiOperation({
      summary: 'Listar incidentes'
    })
    @ApiQuery({
      name: 'apiId',
      required: false
    })
    @ApiQuery({
      name: 'status',
      required: false,
      description: 'OPEN | RESOLVED'
    })
    @ApiQuery({
      name: 'limit',
      required: false
    })
    findIncidents(
      @Query('apiId') apiId?: string,
      @Query('status') status?: string,
      @Query('limit') limit?: string
    ) {
      return this.apiMonitorService.findIncidents({
        apiId,
        status,
        limit: limit ? Number(limit) : 100
      });
    }
  
    @Get(':id')
    @ApiOperation({
      summary: 'Buscar API monitorada por ID'
    })
    @ApiParam({
      name: 'id'
    })
    findOne(@Param('id') id: string) {
      return this.apiMonitorService.findOne(id);
    }
  
    @Patch(':id')
    @ApiOperation({
      summary: 'Atualizar API monitorada'
    })
    @ApiParam({
      name: 'id'
    })
    update(
      @Param('id') id: string,
      @Body() dto: UpdateMonitoredApiDto
    ) {
      return this.apiMonitorService.update(id, dto);
    }
  
    @Delete(':id')
    @ApiOperation({
      summary: 'Remover API monitorada'
    })
    @ApiParam({
      name: 'id'
    })
    remove(@Param('id') id: string) {
      return this.apiMonitorService.remove(id);
    }
  
    @Post(':id/check-now')
    @ApiOperation({
      summary: 'Executar verificação manual'
    })
    @ApiParam({
      name: 'id'
    })
    checkNow(@Param('id') id: string) {
      return this.apiMonitorService.checkNow(id);
    }
  }