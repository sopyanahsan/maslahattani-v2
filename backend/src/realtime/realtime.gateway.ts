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

/**
 * WebSocket Gateway untuk real-time updates di admin panel.
 * 
 * Menggunakan Socket.IO dengan namespace /realtime.
 * Client join ke room berdasarkan shopId untuk menerima events toko mereka saja.
 * 
 * Events yang di-emit:
 * - BRILINK_TRANSACTION_CREATED: Transaksi BRILink baru
 * - ACCOUNT_BALANCE_CHANGED: Saldo rekening BRI berubah
 * - CASH_FLOW_CREATED: Kas masuk/keluar baru
 * - CASH_BOX_UPDATED: Saldo kas berubah
 * - DASHBOARD_REFRESH: Signal untuk refresh dashboard data
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
   * Payload: { shopId: string, userId: string }
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
  // EMISSION METHODS (called by services)
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
    this.server.to(`shop:${shopId}`).emit('BRILINK_TRANSACTION_CREATED', data);
    this.logger.debug(`Emitted BRILINK_TRANSACTION_CREATED to shop:${shopId}`);
  }

  /**
   * Emit ketika saldo rekening BRI berubah (setelah transaksi / top-up / adjustment).
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
    this.server.to(`shop:${shopId}`).emit('ACCOUNT_BALANCE_CHANGED', data);
    this.logger.debug(`Emitted ACCOUNT_BALANCE_CHANGED to shop:${shopId}`);
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
    this.server.to(`shop:${shopId}`).emit('CASH_FLOW_CREATED', data);
    this.logger.debug(`Emitted CASH_FLOW_CREATED to shop:${shopId}`);
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
    this.server.to(`shop:${shopId}`).emit('CASH_BOX_UPDATED', data);
    this.logger.debug(`Emitted CASH_BOX_UPDATED to shop:${shopId}`);
  }

  /**
   * Emit generic signal untuk refresh dashboard (untuk data agregat).
   */
  emitDashboardRefresh(shopId: string, data: {
    source: string;
    timestamp: string;
  }) {
    this.server.to(`shop:${shopId}`).emit('DASHBOARD_REFRESH', data);
    this.logger.debug(`Emitted DASHBOARD_REFRESH to shop:${shopId}`);
  }

  /**
   * Get jumlah connected clients (useful for health check / debugging).
   */
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
