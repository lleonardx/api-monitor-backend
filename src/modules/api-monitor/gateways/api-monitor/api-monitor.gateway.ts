import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*'
  },
  namespace: '/api-monitor'
})
export class ApiMonitorGateway {
  @WebSocketServer()
  server: Server;

  emitStatusChanged(payload: any) {
    this.server.emit('api-status-changed', payload);
  }

  emitApiChecked(payload: any) {
    this.server.emit('api-checked', payload);
  }

  @SubscribeMessage('ping')
  handlePing(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket
  ) {
    client.emit('pong', {
      message: 'API Monitor WebSocket conectado',
      data,
      connectedAt: new Date()
    });
  }
}