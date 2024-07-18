// import { Injectable } from '@nestjs/common';
// import { AppointmentRepository } from '@repositories/appointment.repository';
// import { ScheduleAppointmentDto } from './dto/schedule-appointment.dto';

// @Injectable()
// export class AppointmentService {
//   constructor(private readonly appointmentRepository: AppointmentRepository) {}

//   async scheduleAppointment(userId: string, data: ScheduleAppointmentDto) {
//     const appointment = await this.appointmentRepository.scheduleAppointment(
//       userId,
//       data,
//     );

//     return appointment;
//   }
// }
