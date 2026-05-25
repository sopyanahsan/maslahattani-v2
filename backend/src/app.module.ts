import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ProductsModule } from './products/products.module';
import { StockModule } from './stock/stock.module';
import { DebtsModule } from './debts/debts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    TransactionsModule,
    ProductsModule,
    StockModule,
    DebtsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
