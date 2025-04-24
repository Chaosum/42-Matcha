using Newtonsoft.Json;

namespace backend.Models.Chat;

public class WebsocketMessage
{
    [JsonProperty("message")]
    public string? Message { get; set; }
    [JsonProperty("data")]
    public object? Data { get; set; }
}

public class MessageModel
{
    [JsonProperty("receiverUsername")]
    public string? ReceiverUsername { get; set; }
    [JsonProperty("timestamp")]
    public DateTime? Timestamp { get; set; }
    [JsonProperty("content")]
    public string? Content { get; set; }
}

public class NotificationModel
{
    [JsonIgnore]
    public int? Id { get; set; }
    [JsonProperty("content")]
    public string? Content { get; set; }
    [JsonProperty("timestamp")]
    public DateTime? Timestamp { get; set; } 
    [JsonProperty("isRead")]
    public bool IsRead { get; set; }
}