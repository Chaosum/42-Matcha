using System.Net.WebSockets;
using backend.Models.Chat;
using Newtonsoft.Json;
using static System.Text.Encoding;

namespace backend.Utils;

public static class Ws
{
    public static async Task SendMessage(WebSocket ws, WebsocketMessage message)
    {
        var msg = JsonConvert.SerializeObject(message);
        await ws.SendAsync(
            new ArraySegment<byte>(UTF8.GetBytes(msg)),
            WebSocketMessageType.Text,
            true,
            CancellationToken.None);
    }
    
    public static async Task SendMessage(WebSocket ws, string message)
    {
        var msg = JsonConvert.SerializeObject(message);
        await ws.SendAsync(
            new ArraySegment<byte>(UTF8.GetBytes(msg)),
            WebSocketMessageType.Text,
            true,
            CancellationToken.None);
    }
}