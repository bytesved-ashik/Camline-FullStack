// import { InjectModel } from '@nestjs/mongoose';
// import { IAppointmentModel } from 'src/types/interfaces/entities/appointment.interface';
// import { Appointment } from '@entities/appointment.entity';
// import { ScheduleAppointmentDto } from '@modules/appointment/dto/schedule-appointment.dto';
// import { UserService } from '@modules/user/user.service';
// import { ROLE } from 'src/types/enums';
// import { BadRequestException } from '@nestjs/common';
// import * as nodemailer from 'nodemailer';
// import ical from 'ical-generator';
// import { SESSION_CONSTANT } from '@constants/index';
// import { SystemConfigRepository } from './systemConfig.repository';

// export class AppointmentRepository {
//   constructor(
//     @InjectModel(Appointment.name)
//     private readonly appointmentModel: IAppointmentModel,
//     private readonly userService: UserService, // private eventEmitter: EventEmitter2,
//     private readonly systemConfigRepository: SystemConfigRepository,
//   ) {}

//   async scheduleAppointment(userId: string, data: ScheduleAppointmentDto) {
//     const { therapistId, startDate, endDate } = data;
//     const therapist = await this.userService.getUserById(therapistId);

//     if (!therapist || !therapist.roles.includes(ROLE.THERAPIST)) {
//       throw new BadRequestException('Therapist does not exists.');
//     }

//     // // check is user scheduled any appointment on same time or not
//     // const isUserBusy = await this.checkDateConflict(
//     //   { userId: userId },
//     //   startDate,
//     //   endDate,
//     // );

//     // if (isUserBusy) {
//     //   throw new BadRequestException('User has already another appointmnet.');
//     // }

//     // // check is therapist scheduled any appointment on same time or not
//     // const isTherapistBusy = await this.checkDateConflict(
//     //   { therapistId: therapistId },
//     //   startDate,
//     //   endDate,
//     // );

//     // if (isTherapistBusy) {
//     //   throw new BadRequestException(
//     //     'Therapist has already another appointmnet.',
//     //   );
//     // }

//     const appointmentMinutes = await this.getDifferenceInMinutes(
//       startDate,
//       endDate,
//     );

//     const CALL_CHARGE_PER_MINUTE =
//       await this.systemConfigRepository.getCallChargePerMinute();

//     const amount = Number(
//       (appointmentMinutes * CALL_CHARGE_PER_MINUTE).toFixed(2),
//     );

//     const appointmentData = {
//       userId,
//       therapistId,
//       startDate,
//       endDate,
//       appointmentMinutes,
//       amount,
//     };

//     const appointment = await this.appointmentModel.create(appointmentData);

//     await this.sendCalendarInvite('Schedule success', startDate, endDate);

//     return appointment;
//   }

//   async getDifferenceInMinutes(startDate, endDate): Promise<number> {
//     const differenceInMilliseconds = Math.abs(
//       endDate.getTime() - startDate.getTime(),
//     );
//     const differenceInMinutes = differenceInMilliseconds / (1000 * 60); // 1 minute = 60,000 milliseconds
//     return differenceInMinutes;
//   }

//   async checkDateConflict(filter, startDate, endDate) {
//     // Query to find any overlapping appointment
//     let conflictQuery: any = {
//       $or: [
//         {
//           startDate: { $lt: endDate },
//           endDate: { $gt: startDate },
//         },
//         {
//           startDate: { $lte: startDate },
//           endDate: { $gte: endDate },
//         },
//       ],
//     };

//     conflictQuery = {
//       ...conflictQuery,
//       filter,
//     };

//     const conflictingAppointments = await this.appointmentModel.findOne(
//       conflictQuery,
//     );

//     return conflictingAppointments;
//   }

//   async sendCalendarInvite(subject: string, startDate: Date, endDate: Date) {
//     const event = {
//       start: startDate,
//       end: endDate,
//       summary: subject,
//       description: 'Event description',
//       location: 'Event location',
//     };

//     const icsFile = ical({
//       name: 'Event Calendar',
//       events: [event],
//     }).toString();

//     const transporter = nodemailer.createTransport({
//       // Configure your email transport settings (e.g., SMTP, Gmail, etc.)
//       host: 'sandbox.smtp.mailtrap.io',
//       port: 587,
//       secure: false, // upgrade later with STARTTLS
//       auth: {
//         user: '0389f7342e7080',
//         pass: '83b31e45ec1abb',
//       },
//     });

//     const mailOptions = {
//       from: '0389f7342e7080',
//       to: 'v.naresh.6554@gmail.com',
//       subject: 'subject',
//       text: icsFile,
//       attachments: [
//         {
//           content: Buffer.from(icsFile).toString('base64'),
//           encoding: 'base64',
//           filename: 'event.ics',
//         },
//       ],
//     };
//     await transporter.sendMail(mailOptions);
//   }
// }
