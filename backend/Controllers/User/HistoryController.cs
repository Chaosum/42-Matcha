using System.Data;
using backend.Database;
using backend.Models.Chat;
using backend.Models.Users;
using backend.Services;
using backend.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace backend.Controllers.User;

[ApiController]
[Authorize]
[Route("[controller]")]
public class HistoryController(ILogger<HistoryController> logger, ISseService sseService): ControllerBase
{
    /// <summary>
    /// Add a user profile to his history and send a notification
    /// </summary>
    /// <response code="200">Ok</response>
    /// <response code="500">Error serveur</response>
    [HttpGet]
    [Route("[action]/{username}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> AddVisite(string username, [FromHeader] string authorization)
    {
        try {
            var token = JwtHelper.DecodeJwtToken(authorization);
            
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new("AddToHistory", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@user_id", token.id);
            cmd.Parameters.AddWithValue("@userVisited", username);
            
            // Output parameter
            MySqlParameter resultParam = new("result", MySqlDbType.Int32) {
                Direction = ParameterDirection.Output
            };
            cmd.Parameters.Add(resultParam);
            
            await cmd.ExecuteNonQueryAsync();
            
            var alreadyVisited = (cmd.Parameters["result"].Value as int? ?? 0) > 0;
            if (alreadyVisited) {
                Console.WriteLine("Already visited");
                return Ok("Already visited");
            }
            
            Console.WriteLine("Send notification!");
            var id = await UserService.GetId(username);
            var nameUser = await UserService.GetName(token.id);
            var content = "Your profile was visited by " + nameUser;
            await sseService.SendNotification(id, content);
            
            return Ok();
        }
        catch (MySqlException e) {
            logger.LogError(message: e.Message);
            return Problem(title: "Server error", detail: "");
        }
    }
    
    /// <summary>
    /// Add a user profile to his history and send a notification
    /// </summary>
    /// <response code="200">Ok</response>
    /// <response code="500">Error serveur</response>
    [HttpGet]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Get([FromHeader] string authorization)
    {
        try {
            var token = JwtHelper.DecodeJwtToken(authorization);
            
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new("GetHistory", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@user_id", token.id);
            
            using var reader = cmd.ExecuteReaderAsync();
            
            var history = new List<HistoryModel>();
            while (await reader.Result.ReadAsync())
            {
                var username = reader.Result.GetString("username");
                var name = reader.Result.GetString("first_name") + " " + reader.Result.GetString("last_name");
                if (string.IsNullOrEmpty(name)) name = username;
                history.Add(new HistoryModel(name, username));
            }
            
            return Ok(history);
        }
        catch (MySqlException e) {
            logger.LogError(message: e.Message);
            return Problem(title: "Server error", detail: "");
        }
    }
}