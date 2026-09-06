import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '@client/modules/auth/auth.module';
import { FcmProvider } from './fcm.provider';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsListener } from './notifications.listener';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [JwtModule.register({}), AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, NotificationsListener, FcmProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
