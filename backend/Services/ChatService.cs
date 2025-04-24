using System.Collections.Concurrent;
using System.Data;
using System.Net.WebSockets;
using backend.Database;
using backend.Models.Auth;
using backend.Models.Chat;
using backend.Utils;
using MySql.Data.MySqlClient;
using Newtonsoft.Json;
using static System.Text.Encoding;

namespace backend.Services;

public interface IWebSocketService
{
    public Task HandleWebsocket(WebSocket ws);
}

public class ChatService(ILogger<IWebSocketService> logger, ISseService sseService): IWebSocketService
{
    private readonly ConcurrentDictionary<string, WebSocket> _connections = new();
    
    public async Task HandleWebsocket(WebSocket ws)
    {
        var buffer = new byte[4096];
        TokenModel token = new(0, string.Empty);
        
        try {
            WebSocketReceiveResult receiveResult;
            do {
                Console.WriteLine($"RECEIVE: {token.Username}");
                
                // Read new message
                receiveResult = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (receiveResult.MessageType == WebSocketMessageType.Close)
                {
                    if (!_connections.TryRemove(token.Username, out _))
                        logger.LogError("Failed to remove socket");
                    logger.LogDebug($"Socket count: {_connections.Count}");
                    logger.LogDebug("Connection closed");
                    continue ;
                }
                
                var data = UTF8.GetString(buffer, 0, receiveResult.Count);
                if (data == "ping") {
                    await Ws.SendMessage(ws, "pong");
                    continue;
                }
                
                dynamic message = JsonConvert.DeserializeObject<WebsocketMessage>(data)!;
                if (message == null) {
                    logger.LogError("Failed to deserialize message");
                    continue;
                }
                logger.LogDebug($"MESSAGE: {message.Message}");
                
                if (message.Message == "connection") {
                    token = await Connection(ws, message);
                }
                else if (message.Message == "channel")
                {
                    var channel = message.Data as string ?? "";
                    Console.WriteLine("Channel history: " + channel);
                    if (string.IsNullOrEmpty(channel)) {
                        logger.LogError("Channel is empty");
                        continue;
                    }
                    
                    var history = await GetChannelHistory(token, channel);
                    var msg = new WebsocketMessage {
                        Message = "channel history",
                        Data = history
                    };
                    await Ws.SendMessage(ws, msg);
                }
                else if (message.Message == "chat")
                {
                    await Chat(message, token.Username);
                }
            } while (!receiveResult.CloseStatus.HasValue);
        }
        catch (WebSocketException wse)
        {
            if (!_connections.TryRemove(token.Username, out _))
                logger.LogError("Failed to remove socket");
            logger.LogError($"WebSocketException: {wse.Message}");
            logger.LogError($"WebSocketException: {wse.StackTrace}");
        }
        catch (Exception e)
        {
            logger.LogError("{e}", e);
        }
    }

    private async Task Chat(dynamic message, string username)
    {
        logger.LogInformation("Chat message");
        dynamic msg = JsonConvert.DeserializeObject<MessageModel>(message.Data.ToString());
        if (msg == null) {
            logger.LogError("Failed to deserialize message");
            return;
        }
                    
        // check if user is blocked by receiver
        if (await UserService.IsBlocked(msg.ReceiverUsername, username)) {
            logger.LogInformation("User is blocked");
            var error = new WebsocketMessage {
                Message = "Error",
                Data = "Your are blocked by this user"
            };
            await Ws.SendMessage(_connections[username], error);
            return;
        }
                    
        if (await SaveMessage(username, msg.ReceiverUsername, msg.Content)) {
            logger.LogInformation("Message saved");
        }
        else {
            logger.LogError("Failed to save message");
        }
                    
        logger.LogInformation($"Chat message: {msg.Content} - {msg.Timestamp} - {msg.ReceiverUsername}");
        if (!_connections.TryGetValue(msg.ReceiverUsername, out WebSocket receiver)) {
            logger.LogError("Receiver not found");
            // check if online on site
            var id = await UserService.GetId(msg.ReceiverUsername) as int? ?? 0;
            if (sseService.IsOnline(id))
                await sseService.SendNotification(id, "New message from " + username);
            
            await SseService.SaveNotification(id, "New message from " + username);
            return;
        }
                    
        var msgData = new WebsocketMessage {
            Message = "chat",
            Data = msg
        };
        await Ws.SendMessage(receiver, msgData);
    }

    private async Task<TokenModel> Connection(WebSocket ws, dynamic message)
    {
        logger.LogInformation("Connection request");
                    
        var token = JwtHelper.DecodeJwtToken(message.Data as string ?? "");
        if (_connections.ContainsKey(token.username)) {
            logger.LogWarning("Connection already exists for username: {username}", token.username);
            _connections.TryGetValue(token.username, out var existing);
            _connections.TryUpdate(token.username, ws, existing!);
        }
        else
        {
            var tryAdd = _connections.TryAdd(token.username, ws);
            if (!tryAdd) {
                logger.LogError("Failed to add socket for username: {username}", token.username);
            }
        }
                    
        logger.LogInformation($"Socket count: {_connections.Count}");
                    
        var ack = new WebsocketMessage {
            Message = "ack",
            Data = "Connection established"
        };
        await Ws.SendMessage(ws, ack);
        return new TokenModel(token.id, token.username);
    }

    private async Task<bool> SaveMessage(string senderUsername, string receiverUsername, string message)
    {
        try {
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("SaveMessage", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            
            cmd.Parameters.AddWithValue("@senderUsername", senderUsername);
            cmd.Parameters.AddWithValue("@receiverUsername", receiverUsername);
            cmd.Parameters.AddWithValue("@message", message);
            cmd.Parameters.AddWithValue("@_timestamp", DateTime.UtcNow);
            
            await cmd.ExecuteNonQueryAsync();
            return true;
        } catch (MySqlException ex)
        {
            Console.WriteLine(ex.Message);
            return false;
        }
    }
    
    private async Task<List<MessageModel>> GetChannelHistory(TokenModel token, string otherUser)
    {
        var messages = new List<MessageModel>();
        await using MySqlConnection conn = DbHelper.GetOpenConnection();
        await using MySqlCommand cmd = new("GetChannelMessages", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@userId", token.Id);
        cmd.Parameters.AddWithValue("@username", otherUser);
        
        using var reader = cmd.ExecuteReaderAsync();
        
        while (await reader.Result.ReadAsync()) {
            var msg = new MessageModel {
                ReceiverUsername = reader.Result.GetInt32("receiver_id") == token.Id ? token.Username : otherUser,
                Timestamp = reader.Result.GetDateTime("timestamp"),
                Content = reader.Result.GetString("content")
            };
            messages.Add(msg);
        }
        Console.WriteLine(messages);
        return messages;
    }
}