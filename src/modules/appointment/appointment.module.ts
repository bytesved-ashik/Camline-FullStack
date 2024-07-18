// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { Appointment, AppointmentSchema } from '@entities/appointment.entity';
// import { AppointmentController } from './appointment.controller';
// import { AppointmentRepository } from '@repositories/appointment.repository';
// import { AppointmentService } from './appointment.service';
// import { UserModule } from '@modules/user/user.module';
// import { SystemConfigRepository } from '@repositories/systemConfig.repository';

// @Module({
//   imports: [
//     MongooseModule.forFeatureAsync([
//       {
//         name: Appointment.name,
//         useFactory: () => {
//           return AppointmentSchema;
//         },
//       },
//     ]),
//     UserModule,
//   ],
//   controllers: [AppointmentController],
//   providers: [
//     AppointmentRepository,
//     AppointmentService,
//     SystemConfigRepository,
//   ],
//   exports: [AppointmentRepository, AppointmentService],
// })
// export class AppointmentModule {}
