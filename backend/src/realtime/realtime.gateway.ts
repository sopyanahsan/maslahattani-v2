import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { REALTIME_EVENTS, type DataChangedPayload } from './realtime.events';

/**
 * WebSocket Gateway untuk real-time updates di admin panel.
 *
 * Menggunakan Socket.IO dengan namespace /realtime.
 * Client join ke room berdasarkan shopId untuk menerima events toko mereka saja.
 *
 * Strategi:
 * - Specific events (BRILINK_TRANSACTION_CREATED, etc) untuk detail UI updates
 * - Generic DATA_CHANGED event untuk global auto-refresh (semua halaman)
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedClients = new Map<string, { shopId: string; userId: string }>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client joins a shop room to receive events for that shop only.
   */
  @SubscribeMessage('join_shop')
  handleJoinShop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { shopId: string; userId: string },
  ) {
    const { shopId, userId } = payload;
    client.join(`shop:${shopId}`);
    this.connectedClients.set(client.id, { shopId, userId });
    this.logger.log(`Client ${client.id} joined shop:${shopId} (user: ${userId})`);
    return { event: 'joined', data: { shopId, message: 'Connected to real-time updates' } };
  }

  /**
   * Client leaves a shop room.
   */
  @SubscribeMessage('leave_shop')
  handleLeaveShop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { shopId: string },
  ) {
    client.leave(`shop:${payload.shopId}`);
    this.connectedClients.delete(client.id);
    this.logger.log(`Client ${client.id} left shop:${payload.shopId}`);
    return { event: 'left', data: { shopId: payload.shopId } };
  }

  // ============================================
  // GENERIC DATA_CHANGED — used by ALL services
  // ============================================

  /**
   * Emit DATA_CHANGED — global event yang di-listen oleh layout admin
   * untuk auto-refresh halaman aktif.
   *
   * Semua service cukup call ini saja untuk trigger refresh di frontend.
   */
  emitDataChanged(shopId: string, module: string, action: 'created' | 'updated' | 'deleted', entityId?: string) {
    const payload: DataChangedPayload = {
      module,
      action,
      entityId,
      timestamp: new Date().toISOString(),
    };
    this.server.to(`shop:${shopId}`).emit(REALTIME_EVENTS.DATA_CHANGED, payload);
    this.logger.debug(`Emitted DATA_CHANGED [${module}:${action}] to shop:${shopId}`);
  }

  // ============================================
  // SPECIFIC EMISSION METHODS (for detail payloads)
  // ============================================

  /**
   * Emit ketika transaksi BRILink baru dibuat.
   */
  emitBrilinkTransactionCreated(shopId: string, data: {
    id: string;
    refNumber: string;
    category: string;
    customerName: string;
    amount: number;
    fee: number;
    total: number;
    status: string;
    cashierName: string;
    createdAt: string;
  }) {
    this.server.to(`shop:${shopId}`).emit(REALTIME_EVENTS.BRILINK_TRANSACTION_CREATED, data);
    this.emitDataChanged(shopId, 'brilink', 'created', data.id);
  }

  /**
   * Emit ketika saldo rekening BRI berubah.
   */
  emitAccountBalanceChanged(shopId: string, data: {
    accountId: string;
    label: string;
    balanceBefore: number;
    balanceAfter: number;
    changeAmount: number;
    changeType: 'DEBIT' | 'CREDIT';
    reason: string;
  }) {
    this.server.to(`shop:${shopId}`).emit(REALTIME_EVENTS.ACCOUNT_BALANCE_CHANGED, data);
    this.emitDataChanged(shopId, 'brilink_accounts', 'updated', data.accountId);
  }

  /**
   * Emit ketika ada kas masuk/keluar baru.
   */
  emitCashFlowCreated(shopId: string, data: {
    id: string;
    type: 'CASH_IN' | 'CASH_OUT';
    amount: number;
    categoryName: string;
    description: string;
    createdAt: string;
  }) {
    this.server.to(`shop:${shopId}`).emit(REALTIME_EVENTS.CASH_FLOW_CREATED, data);
    this.emitDataChanged(shopId, 'cash_flow', 'created', data.id);
  }

  /**
   * Emit ketika saldo kas (cash box) berubah.
   */
  emitCashBoxUpdated(shopId: string, data: {
    cashBoxId: string;
    label: string;
    balanceBefore: number;
    balanceAfter: number;
  }) {
    this.server.to(`shop:${shopId}`).emit(REALTIME_EVENTS.CASH_BOX_UPDATED, data);
    this.emitDataChanged(shopId, 'cash_boxes', 'updated', data.cashBoxId);
  }

  /**
   * Emit generic dashboard refresh.
   */
  emitDashboardRefresh(shopId: string, data: {
    source: string;
    timestamp: string;
  }) {
    this.server.to(`shop:${shopId}`).emit(REALTIME_EVENTS.DASHBOARD_REFRESH, data);
  }

  // ============================================
  // UTILITY
  // ============================================

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getConnectedClientsForShop(shopId: string): number {
    let count = 0;
    this.connectedClients.forEach((info) => {
      if (info.shopId === shopId) count++;
    });
    return count;
  }
}
