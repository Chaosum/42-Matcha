using System.Data;
using backend.Database;
using backend.Models.Chat;
using backend.Models.Match;
using backend.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace backend.Controllers.Chat;

[ApiController]
[Authorize]
[Route("[controller]")]
public class ChatController(ILogger<ChatController> logger): ControllerBase
{
    /// <summary>
    /// Get tags list
    /// </summary>
    /// <response code="200">Ok</response>
    /// <response code="500">Error serveur</response>
    [HttpGet]
    [Route("[action]/{username}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> GetMessages(string username, [FromHeader] string authorization)
    {
        try {
            var token = JwtHelper.DecodeJwtToken(authorization);
            var matches = new List<MessageModel>();
            
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("GetChannelMessages", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userID", token.id);
            cmd.Parameters.AddWithValue("@username", username);
            
            using var reader = cmd.ExecuteReaderAsync();
            
            while (await reader.Result.ReadAsync()) {
                var messages = new MessageModel
                {
                    ReceiverUsername = reader.Result.GetInt32("receiver_id") == token.id ? token.username : username,
                    Timestamp = reader.Result.GetDateTime("timestamp"),
                    Content = reader.Result.GetString("content")
                };
                matches.Add(messages);
            }
            
            return Ok(matches);
        }
        catch (MySqlException e) {
            logger.LogError(message: e.Message);
            return Problem(title: "Server error", detail: "");
        }
    }
}