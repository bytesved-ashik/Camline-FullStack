import { events } from '@events';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private mailerService: MailerService) {}

  async sendMail({
    to,
    from,
    subject,
    text,
    html,
    context,
    template,
  }: ISendMailOptions) {
    try {
      const fromEmail = 'no-reply@24hrtherapy.co.uk';

      await this.mailerService.sendMail({
        to,
        from: fromEmail,
        subject,
        text,
        html,
        context,
        template,
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  @OnEvent(events.USER_REGISTERED, { async: true })
  async onUserRegistered({ email, name, token }) {
    await this.sendMail({
      to: email,
      subject: 'Welcome to 24hrtherapy',
      template: './welcome',
      context: {
        name,
        email,
        token,
      },
    });
  }

  @OnEvent(events.EMAIL_VERIFICATION)
  async onEmailVerification({ name, email, otp }) {
    await this.sendMail({
      to: email,
      subject: 'Welcome to 24hrtherapy - Verify your email',
      template: './verify-email',
      context: {
        name,
        email,
        otp,
      },
    });
  }

  @OnEvent(events.PASSWORD_RESET)
  async onPasswordReset({ name, email, otp }) {
    await this.sendMail({
      to: email,
      subject: 'Welcome to 24hrtherapy - Reset your password',
      template: './reset-password',
      context: {
        name,
        email,
        otp,
      },
    });
  }

  @OnEvent(events.USER_JOINED)
  async therapistJoined({ userName, userEmail, admins, isTherapistJoined }) {
    const templateName = isTherapistJoined
      ? './therapist-joined'
      : './user-joined';
    const role = isTherapistJoined ? 'Therapist' : 'User';

    for (let i = 0; i < admins.length; i++) {
      const email = admins[i].email;
      const adminName = `${admins[i].firstName} ${admins[i].lastName}`;
      await this.sendMail({
        to: email,
        subject: `${role} joined session`,
        template: templateName,
        context: {
          adminName,
          email,
          userName,
          userEmail,
        },
      });
    }
  }

  @OnEvent(events.USER_TOP_UP)
  async userTopUp({ userName, admins, amount }) {
    for (let i = 0; i < admins.length; i++) {
      const email = admins[i].email;
      const adminName = `${admins[i].firstName} ${admins[i].lastName}`;
      await this.sendMail({
        to: email,
        subject: 'User top up',
        template: './top-up',
        context: {
          adminName,
          email,
          userName,
          amount,
        },
      });
    }
  }

  @OnEvent(events.THERAPIST_WITHDRAW)
  async therapistWithdraw({ userName, admins, amount }) {
    for (let i = 0; i < admins.length; i++) {
      const email = admins[i].email;
      const adminName = `${admins[i].firstName} ${admins[i].lastName}`;
      await this.sendMail({
        to: email,
        subject: 'Therapist withdraw',
        template: './withdraw',
        context: {
          adminName,
          email,
          userName,
          amount,
        },
      });
    }
  }

  @OnEvent(events.THERAPIST_ACTIVATED)
  async therapistActivated({ therapistName, email }) {
    await this.sendMail({
      to: email,
      subject: 'Your account is activated',
      template: './therapist-activated',
      context: {
        therapistName,
        email,
      },
    });
  }

  @OnEvent(events.THERAPIST_DEACTIVATED)
  async therapistDeactivated({ therapistName, email, rejectReason }) {
    await this.sendMail({
      to: email,
      subject: 'Your account is deactivated',
      template: './therapist-deactivated',
      context: {
        therapistName,
        email,
        rejectReason,
      },
    });
  }

  @OnEvent(events.THERAPIST_REJECTED)
  async therapistRejected({ therapistName, email, rejectReason }) {
    await this.sendMail({
      to: email,
      subject: 'Your account is rejected',
      template: './therapist-rejected',
      context: {
        therapistName,
        email,
        rejectReason,
      },
    });
  }

  @OnEvent(events.TWO_STEP_VERIFICATION)
  async TwoStepVerification({ name, email, token }) {
    await this.sendMail({
      to: email,
      subject: 'Activate 2-Step Verification',
      template: './two-step-verification.hbs',
      context: {
        name,
        email,
        token,
      },
    });
  }

  @OnEvent(events.REJECTED_THERAPIST_PROFILE_UPDATE)
  async rejectedTherapistUpdateProfile({
    therapistName,
    email,
    rejectReason,
    admins,
  }) {
    for (let i = 0; i < admins.length; i++) {
      const adminEmail = admins[i].email;
      const adminName = `${admins[i].firstName} ${admins[i].lastName}`;
      await this.sendMail({
        to: adminEmail,
        subject: 'Rejected therapist update profile',
        template: './rejected-user-update-profile',
        context: {
          therapistName,
          email,
          rejectReason,
          adminName,
        },
      });
    }
  }

  @OnEvent(events.SCHEDULED_REQUEST_ACCEPTED)
  async therapistAcceptedScheduledRequest({
    therapistName,
    therapistEmail,
    userName,
    userEmail,
    time,
  }) {
    await this.sendMail({
      to: therapistEmail,
      subject: 'Session scheduled',
      template: './scheduled-request-accepted',
      context: {
        userName: therapistName,
        time,
      },
    });

    await this.sendMail({
      to: userEmail,
      subject: 'Session scheduled',
      template: './scheduled-request-accepted',
      context: {
        userName: userName,
        time,
      },
    });
  }

  @OnEvent(events.SCHEDULED_REQUEST_REJECTED)
  async therapistRejectedScheduledRequest({
    therapistName,
    therapistEmail,
    userName,
    userEmail,
    time,
  }) {
    await this.sendMail({
      to: therapistEmail,
      subject: 'Scheduled Session Rejected',
      template: './schedule-request-rejected',
      context: {
        userName: therapistName,
        time,
      },
    });

    await this.sendMail({
      to: userEmail,
      subject: 'Scheduled Session Rejected',
      template: './schedule-request-rejected',
      context: {
        userName: userName,
        time,
      },
    });
  }

  @OnEvent(events.SCHEDULED_REQUEST_SEND_MAIL_BEFORE_FIVE_MINUTES)
  async scheduledRequestSendMailBeforeFiveMinutes({
    therapistName,
    therapistEmail,
    userName,
    userEmail,
    time,
  }) {
    await this.sendMail({
      to: therapistEmail,
      subject: 'Scheduled Session Start Soon',
      template: './send-mail-before-five-minutes',
      context: {
        userName: therapistName,
        time,
      },
    });

    await this.sendMail({
      to: userEmail,
      subject: 'Scheduled Session Start Soon',
      template: './send-mail-before-five-minutes',
      context: {
        userName: userName,
        time,
      },
    });
  }
}
