import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // constructor(private readonly socketService: SocketGateway) {}

  getHello() {
    return 'Hello World';
  }

  // @Cron(CronExpression.EVERY_MINUTE)
  // handleCron() {
  //   this.socketService.handleSendMessage(
  //     '64104a751642951e3641225a',
  //     'Hyyyy Nazim',
  //   );
  //   console.log('Called when date is ', new Date().toTimeString());
  // }
}
