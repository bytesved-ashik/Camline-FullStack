import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class Settings {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  value: string;

  @Prop({ required: true })
  private: boolean;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
