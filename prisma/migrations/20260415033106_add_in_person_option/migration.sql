-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "meetingLocation" TEXT;

-- AlterTable
ALTER TABLE "MeetingType" ADD COLUMN     "allowInPerson" BOOLEAN NOT NULL DEFAULT false;
