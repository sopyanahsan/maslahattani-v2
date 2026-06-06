import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ShopsModule } from './shops/shops.module';
import { HealthModule } from './health/health.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ProductsModule } from './products/products.module';
import { StockModule } from './stock/stock.module';
import { DebtsModule } from './debts/debts.module';
import { PaymentsModule } from './payments/payments.module';
import { ShiftsModule } from './shifts/shifts.module';
import { SettingsModule } from './settings/settings.module';
import { CashBoxCategoriesModule } from './cashbox-categories/cashbox-categories.module';
import { ReportsModule } from './reports/reports.module';
import { BrilinkModule } from './brilink/brilink.module';
import { OpnameModule } from './opname/opname.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { TransfersModule } from './transfers/transfers.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DashboardBrilinkModule } from './dashboard-brilink/dashboard-brilink.module';
import { BrilinkAccountsModule } from './brilink-accounts/brilink-accounts.module';
import { BrilinkCashboxModule } from './brilink-cashbox/brilink-cashbox.module';
import { BrilinkReconciliationModule } from './brilink-reconciliation/brilink-reconciliation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ShopsModule, // Harus di-import sebelum AuthModule (yang depend on ShopsService)
    AuthModule,
    HealthModule,
    TransactionsModule,
    ProductsModule,
    StockModule,
    DebtsModule,
    PaymentsModule,
    CashBoxCategoriesModule, // Harus di-import sebelum ShiftsModule (shift depend on category)
    ShiftsModule,
    SettingsModule,
    ReportsModule,
    BrilinkModule,
    BrilinkAccountsModule,
    BrilinkCashboxModule,
    BrilinkReconciliationModule,
    OpnameModule,
    SuppliersModule,
    TransfersModule,
    AnalyticsModule,
    DashboardModule,
    DashboardBrilinkModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
