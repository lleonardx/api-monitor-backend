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
import { ApiMonitorService } from './services/api-monitor/api-monitor.service';
import { CreateMonitoredApiDto } from './dto/create-monitored-api.dto';
import { UpdateMonitoredApiDto } from './dto/update-monitored-api.dto';
  

  
@Controller('api-monitor')
export class ApiMonitorController {
    constructor(private readonly apiMonitorService: ApiMonitorService) {}
  
    @Post()
    create(@Body() dto: CreateMonitoredApiDto) {
      return this.apiMonitorService.create(dto);
    }
  
    @Get()
    findAll() {
      return this.apiMonitorService.findAll();
    }
  
    @Get('history')
    findHistory(
      @Query('apiId') apiId?: string,
      @Query('limit') limit?: string
    ) {
      return this.apiMonitorService.findHistory({
        apiId,
        limit: limit ? Number(limit) : 100
      });
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.apiMonitorService.findOne(id);
    }
  
    @Patch(':id')
    update(
      @Param('id') id: string,
      @Body() dto: UpdateMonitoredApiDto
    ) {
      return this.apiMonitorService.update(id, dto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.apiMonitorService.remove(id);
    }
  
    @Post(':id/check-now')
    checkNow(@Param('id') id: string) {
      return this.apiMonitorService.checkNow(id);
    }
  }