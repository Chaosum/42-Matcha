using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using backend.Models.Chat;
using Newtonsoft.Json;

namespace backend.Services;

public interface IWebSocketService
{
    public Task HandleWebsocket(WebSocket ws);
}

public class WebSocketService(ILogger<IWebSocketService> logger): IWebSocketService
{
    private readonly ConcurrentDictionary<string, WebSocket> _connections = new();
    
    public async Task HandleWebsocket(WebSocket ws)
    {
        var buffer = new byte[4096];
        var username = string.Empty;
        
        try
        {
            WebSocketReceiveResult receiveResult;
            do {
                receiveResult = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                var data = Encoding.UTF8.GetString(buffer, 0, receiveResult.Count);
                                
                if (data == "ping") {
                    await ws.SendAsync(
                        new ArraySegment<byte>(Encoding.UTF8.GetBytes("pong")),
                        WebSocketMessageType.Text,
                        true,
                        CancellationToken.None);
                    continue;
                }
                
                dynamic message = JsonConvert.DeserializeObject<WebsocketMessage>(data)!;
                if (message == null) {
                    logger.LogError("Failed to deserialize message");
                    continue;
                }
                
                logger.LogDebug($"MESSAGE: {message.Message}");
                
                if (receiveResult.MessageType == WebSocketMessageType.Close) 
                {
                    if (ws.State == WebSocketState.Open && receiveResult.CloseStatus.HasValue)
                    {
                        await ws.CloseOutputAsync(
                            receiveResult.CloseStatus.Value,
                            receiveResult.CloseStatusDescription,
                            CancellationToken.None);
                        if (!_connections.TryRemove(username, out _)) {
                            logger.LogError("Failed to remove socket");
                        }
                        logger.LogDebug($"Socket count: {_connections.Count}");
                        logger.LogDebug("Connection closed");
                        return;
                    }
                }
                
                if (message.Message == "connection")
                {
                    logger.LogInformation("Connection request");
                    
                    username = Utils.JwtHelper.DecodeJwtToken(message.Data as string ?? "").username;
                    if (_connections.ContainsKey(username)) {
                        logger.LogWarning("Connection already exists for username: {username}", username);
                        _connections.TryGetValue(username, out var existing);
                        _connections.TryUpdate(username, ws, existing!);
                    }
                    else
                    {
                        var tryAdd = _connections.TryAdd(username, ws);
                        if (!tryAdd) {
                            logger.LogError("Failed to add socket for username: {username}", username);
                        }
                    }
                    
                    logger.LogInformation($"Socket count: {_connections.Count}");
                    
                    var ack = new WebsocketMessage
                    {
                        Message = "ack",
                        Data = "Connection established"
                    };
                    var ackData = JsonConvert.SerializeObject(ack);
                    await ws.SendAsync(
                        new ArraySegment<byte>(Encoding.UTF8.GetBytes(ackData)),
                        WebSocketMessageType.Text,
                        true,
                        CancellationToken.None);
                }

                if (message.Message == "chat")
                {
                    logger.LogInformation("Chat message");
                    dynamic msg = JsonConvert.DeserializeObject<MessageModel>(message.Data.ToString());
                    if (msg == null) {
                        logger.LogError("Failed to deserialize message");
                        continue;
                    }
                    
                    // TODO: store message in database
                    
                    logger.LogInformation($"Chat message: {msg.Message} - {msg.Timestamp} - {msg.ReceiverUsername}");
                    if (!_connections.TryGetValue(msg.ReceiverUsername, out WebSocket receiver))
                    {
                        logger.LogError("Receiver not found");
                        continue;
                    }
                    
                    var msgData = new WebsocketMessage
                    {
                        Message = "chat",
                        Data = msg
                    };
                    var msgJson = JsonConvert.SerializeObject(msgData);
                    await receiver.SendAsync(
                        new ArraySegment<byte>(Encoding.UTF8.GetBytes(msgJson)),
                        WebSocketMessageType.Text,
                        true,
                        CancellationToken.None);
                    
                }
                
            } while (!receiveResult.CloseStatus.HasValue);
        }
        catch (WebSocketException wse)
        {
            if (!_connections.TryRemove(username, out _))
                logger.LogError("Failed to remove socket");
            logger.LogError($"WebSocketException: {wse.Message}");
            logger.LogError($"WebSocketException: {wse.StackTrace}");
        }
        catch (Exception e)
        {
            logger.LogError("{e}", e);
        }
    }
}