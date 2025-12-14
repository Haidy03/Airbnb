// Airbnb.API/Hubs/ChatHub.cs
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Airbnb.API.Hubs
{
   
    public class ChatHub : Hub
    {
      
        public async Task SendMessage(string conversationId, string messageContent, string senderId)
        {
           
            await Clients.Group(conversationId).SendAsync("ReceiveMessage", new
            {
                Content = messageContent,
                SenderId = senderId,
                SentAt = DateTime.UtcNow
            });
        }

     
        public async Task JoinConversation(string conversationId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, conversationId);
        }

      
        public async Task LeaveConversation(string conversationId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, conversationId);
        }
    }
}