enum userEvents {
  USER_REGISTERED = 'user.registered',
  EMAIL_VERIFICATION = 'email.verification',
  PASSWORD_RESET = 'password.reset',
  PASSWORD_CHANGED = 'password.changed',
  USER_ONLINE = 'user.online',
  PING_RECEIVED = 'ping.received',
  REQUEST_STATUS_UPDATED = 'request.status-update',
  SESSION_FEE_UPDATE = 'session.fee-update',
  SESSION_RISE_HAND = 'session.rise-hand',
  USER_JOINED = 'user.joined',
  USER_TOP_UP = 'user.top-up',
  THERAPIST_WITHDRAW = 'therapist.withdraw',
  THERAPIST_ACTIVATED = 'therapist.activated',
  SMS_SEND = 'SMS.send',
  THERAPIST_DEACTIVATED = 'therapist.deactivated',
  THERAPIST_REJECTED = 'therapist.rejected',
  TWO_STEP_VERIFICATION = 'twoStep.verification',
  REJECTED_THERAPIST_PROFILE_UPDATE = 'rejected.therapist.profile.update',
  CUSTOM_SMS_SEND = 'SMS.send-custom-sms',
  SCHEDULED_REQUEST_ACCEPTED = 'request.scheduled-accepted',
  SCHEDULED_REQUEST_REJECTED = 'request.scheduled-rejected',
  SCHEDULED_REQUEST_SEND_MAIL_BEFORE_FIVE_MINUTES = 'request.scheduled-send-mail-before-five-minutes',
}

export const events = {
  ...userEvents,
};
