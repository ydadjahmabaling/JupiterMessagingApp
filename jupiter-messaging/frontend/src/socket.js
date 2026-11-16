import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/** Opens an authenticated STOMP-over-SockJS connection; `onConnect(client)` fires on every (re)connect. */
export function connectSocket(token, onConnect) {
  const client = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    connectHeaders: { Authorization: 'Bearer ' + token },
    reconnectDelay: 3000,
    onConnect: () => onConnect(client),
  });
  client.activate();
  return client;
}
