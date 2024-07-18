// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Types, Schema as MongooseSchema } from 'mongoose';
// import { Wallet } from './wallet.entity';

// @Schema({
//   timestamps: true,
//   toJSON: { virtuals: true },
//   toObject: { virtuals: true },
// })
// export class Appointment {
//   @Prop({ required: true, ref: 'User', type: MongooseSchema.Types.ObjectId })
//   userId: Types.ObjectId;

//   @Prop({ required: true, ref: 'User', type: MongooseSchema.Types.ObjectId })
//   therapistId: Types.ObjectId;

//   @Prop({
//     required: false,
//     type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Media' }],
//   })
//   documents;

//   @Prop({ required: true })
//   startDate: Date;

//   @Prop({ required: true })
//   endDate: Date;

//   @Prop({ required: true })
//   appointmentMinutes: number;

//   @Prop({ required: true })
//   amount: number;

//   @Prop({ required: false })
//   previosWallet: Wallet;

//   @Prop({ required: false })
//   currentWallet: Wallet;
// }

// export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
