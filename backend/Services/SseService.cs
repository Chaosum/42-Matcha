using System.Collections.Concurrent;
using System.Data;
using System.Net.WebSockets;
using backend.Database;
using backend.Models.Chat;
using backend.Utils;
using MySql.Data.MySqlClient;
using static System.Text.Encoding;

namespace backend.Services;

public interface ISseService
{
    public Task HandleWebsocket(WebSocket ws, string token);
    public Task SendNotification(int id, string content);
    public bool IsOnline(int id);
}

public class SseService(ILogger<ISseService> logger): ISseService
{
    private readonly ConcurrentDictionary<int, WebSocket> _connections = new();

    public async Task HandleWebsocket(WebSocket ws, string token)
    {
        var buffer = new byte[4096];
        var id = 0;
        
        try {
            id = JwtHelper.DecodeJwtToken(token).id;
            
            var notifications = await GetNotifications(id);
            var message = new WebsocketMessage {
                Message = "notifications",
                Data = notifications
            };
            await Ws.SendMessage(ws, message);
            
            if (_connections.ContainsKey(id)) {
                logger.LogWarning("Connection already exists for username: {username}", id);
                _connections.TryGetValue(id, out var existing);
                _connections.TryUpdate(id, ws, existing!);
            }
            else
            {
                var tryAdd = _connections.TryAdd(id, ws);
                if (!tryAdd)
                    logger.LogError("Failed to add socket for username: {username}", id);
            }
        } catch (Exception e) {
            logger.LogError("Failed to decode token");
            logger.LogError("{e}", e);
            return;
        }
        
        try {
            WebSocketReceiveResult receiveResult;
            do {
                // Read new message
                receiveResult = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (receiveResult.MessageType == WebSocketMessageType.Close)
                {
                    if (!_connections.TryRemove(id, out _))
                        logger.LogError("Failed to remove socket");
                    
                    await UserService.SaveLastSeen(id, DateTime.Now);
                    
                    logger.LogDebug("Connection closed");
                    continue ;
                }
                
                var data = UTF8.GetString(buffer, 0, receiveResult.Count);
                if (data == "ping") {
                    await Ws.SendMessage(ws, "pong");
                }
            } while (!receiveResult.CloseStatus.HasValue);
        }
        catch (WebSocketException wse)
        {
            if (!_connections.TryRemove(id, out _))
                logger.LogError("Failed to remove socket");
            logger.LogError($"WebSocketException: {wse.Message}");
            logger.LogError($"WebSocketException: {wse.StackTrace}");
        }
        catch (Exception e)
        {
            logger.LogError("{e}", e);
        }
    }
    
    public async Task SendNotification(int id, string content)
    {
        if (_connections.TryGetValue(id, out var ws))
        {
            var notification = new NotificationModel {
                Content = content,
                Timestamp = DateTime.UtcNow,
                IsRead = false,
            };
            
            var message = new WebsocketMessage {
                Message = "new_notification",
                Data = notification
            };
            
            logger.LogInformation("Sending notification to user: {id}", id);
            
            await Ws.SendMessage(ws, message);
        }
        else
        {
            logger.LogWarning("No connection found for user: {id}", id);
        }
    }

    private async Task<List<NotificationModel>> GetNotifications(int id)
    {
        var notifications = new List<NotificationModel>();
        
        try {
            await using MySqlConnection connection = DbHelper.GetOpenConnection();
            await using MySqlCommand command = new("GetNotifications", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@userID", id);
            await using var reader = await command.ExecuteReaderAsync();
            
            while (await reader.ReadAsync())
            {
                var notification = new NotificationModel
                {
                    Content = reader.GetString("content"),
                    Timestamp = reader.GetDateTime("created_on"),
                    IsRead = reader.GetBoolean("isRead"),
                };
                notifications.Add(notification);
            }
        }
        catch (Exception e)
        {
            logger.LogError("{e}", e);
        }

        return notifications;
    }
    
    public static async Task SaveNotification(int id, string content)
    {
        try {
            await using MySqlConnection connection = DbHelper.GetOpenConnection();
            await using MySqlCommand command = new("SaveNotification", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@_userID", id);
            command.Parameters.AddWithValue("@_content", content);
            await command.ExecuteNonQueryAsync();
        }
        catch (Exception e)
        {
            Console.Error.WriteLine(e);
        }
    }
    
    public bool IsOnline(int id)
    {
        return _connections.ContainsKey(id);
    }
}