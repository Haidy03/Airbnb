// src/app/core/services/signalr.service.ts
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection: signalR.HubConnection;
  

  public messageReceived$ = new Subject<any>();

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:5202/chathub') 
      .withAutomaticReconnect()
      .build();
  }

  public startConnection() {
    this.hubConnection
      .start()
      .then(() => console.log('✅ SignalR Connection Started'))
      .catch(err => console.log('❌ Error while starting connection: ' + err));
      
    
    this.hubConnection.on('ReceiveMessage', (data) => {
      this.messageReceived$.next(data);
    });
  }

  public joinConversation(conversationId: string) {
    this.hubConnection.invoke('JoinConversation', conversationId);
  }

  public sendMessage(conversationId: string, message: string, senderId: string) {
    this.hubConnection.invoke('SendMessage', conversationId, message, senderId);
  }
}