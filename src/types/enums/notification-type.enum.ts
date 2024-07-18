export enum NOTIFICATION_TYPE {
  NOTIFICATION = 'notification',
  CHAT = 'message',
  REQUEST_EXPIRED = 'request-expired',
  REQUEST_RECEIVED = 'request-received',
  REQUEST_ACCEPTED = 'request-accepted',
  REQUEST_WITHDRAWN = 'request-withdrawn',
  REQUEST_REJECTED = 'request-rejected',
  SESSION_SCHEDULED = 'session-scheduled',
  SESSION_ACCEPTED = 'scheduled-session-accepted',
  SESSION_REJECTED = 'scheduled-session-rejected',
  SESSION_ENDED = 'session-ended',
  USER_JOINED = 'user-joined',
  USER_NOT_RESPONDING = 'user-not-responding',
  TRIAL_ENDED = 'trial-ended',
  INSUFFICIENT_BALANCE = 'insufficient-balance',
  FIFTEEN_MINUTES_LEFT = 'fifteen-minutes-left',
  FIVE_MINUTES_LEFT = 'five-minutes-left',
  ONE_MINUTES_LEFT = 'one-minutes-left',
  RISE_HAND_SUCCESS = 'rise-hand-success',
  USER_INSUFFICIENT_BALANCE = 'user-insufficient-balance',
  REQUEST_ACCEPTED_BY_THERAPIST = 'request-accepted-by-therapist',
  USER_TOP_UP_SUCCESS = 'user-top-up-success',
}
