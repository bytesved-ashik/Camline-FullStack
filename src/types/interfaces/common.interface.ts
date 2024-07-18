interface IScheduleSessionAcceptedSendMailAndSmsBeforeFiveMinutesJobData {
  runAt: Date;
  requestId: string;
  therapistName: string;
  therapistEmail: string;
  userName: string;
  userEmail: string;
  time: string;
  phoneNumbers: string[];
}

export { IScheduleSessionAcceptedSendMailAndSmsBeforeFiveMinutesJobData };
