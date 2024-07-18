// import { Controller, UseGuards, Req, Post, Body } from '@nestjs/common';
// import { ApiOperation, ApiTags } from '@nestjs/swagger';
// import { IRequest } from '@interfaces';
// import { JwtAuthGuard } from '@classes/jwt-auth.guard';
// import { Roles } from '@decorators/role.decorator';
// import { ROLE } from 'src/types/enums';
// import { RolesGuard } from '@classes/role.guard';
// import { ScheduleAppointmentDto } from './dto/schedule-appointment.dto';
// import { AppointmentService } from './appointment.service';

// @ApiTags('Appointment')
// @Controller('appointment')
// export class AppointmentController {
//   constructor(private readonly appointmentService: AppointmentService) {}

//   @Roles(ROLE.USER)
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Post()
//   @ApiOperation({
//     description: 'Schedule appointment',
//   })
//   async scheduleAppointment(
//     @Body() body: ScheduleAppointmentDto,
//     @Req() req: IRequest,
//   ) {
//     try {
//       const { therapistId, startDate, endDate, documents } = body;
//       const userId = req.user._id;

//       const appointment = await this.appointmentService.scheduleAppointment(
//         userId,
//         body,
//       );

//       const responseData = {
//         userId,
//         therapistId,
//         startDate,
//         endDate,
//         documents,
//         appointment,
//       };

//       return responseData;
//     } catch (error) {
//       console.log('Error:AppointmentController:scheduleAppointment : ', error);
//       throw error;
//     }
//   }
// }
