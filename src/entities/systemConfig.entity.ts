import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class SystemConfig {
  @Prop({
    required: true,
    type: Object,
    unique: true,
  })
  systemVariables: Record<string, any>;
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
