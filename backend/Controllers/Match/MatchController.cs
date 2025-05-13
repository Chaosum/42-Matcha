using System.Data;
using backend.Database;
using backend.Models.Chat;
using backend.Models.Match;
using backend.Services;
using backend.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace backend.Controllers.Match;

[ApiController]
[Authorize]
[Route("[controller]")]
public class MatchController(ILogger<MatchController> logger, ISseService sseService): ControllerBase
{
    /// <summary>
    /// Get tags list
    /// </summary>
    /// <response code="200">Tag lists</response>
    /// <response code="500">Error serveur</response>
    [HttpGet]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> GetList([FromHeader] string authorization)
    {
        try {
            var token = JwtHelper.DecodeJwtToken(authorization);
            var matches = new List<MatchModel>();
            
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("GetUserMatches", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userID", token.id);
            
            using var reader = cmd.ExecuteReaderAsync();
            while (await reader.Result.ReadAsync()) {
                var firstName = reader.Result["first_name"].ToString() ?? "";
                var lastName = reader.Result["last_name"].ToString() ?? "";
                
                var id = reader.Result["id"] as int? ?? 0;
                
                var match = new MatchModel
                {
                    Username = reader.Result["username"].ToString() ?? "",
                    Name = firstName + " " + lastName,
                    ImageUrl = reader.Result["image_url"].ToString() ?? "",
                    IsOnline = sseService.IsOnline(id)
                };
                matches.Add(match);
            }
            
            await reader.Result.CloseAsync();
            
            return Ok(matches);
        }
        catch (MySqlException e) {
            logger.LogError(message: e.Message);
            return Problem(title: "Server error", detail: "");
        }
    }
    
    /// <summary>
    /// Like user
    /// </summary>
    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> Like([FromHeader] string authorization, [FromBody] LikeModel data)
    {
        try {
            var token = JwtHelper.DecodeJwtToken(authorization);
            
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new("LikeUser", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userID", token.id);
            cmd.Parameters.AddWithValue("@likedUser", data.Username);
            cmd.Parameters.AddWithValue("@isLike", data.Liked);
            
            // Add out parameter for match status
            var matchStatus = new MySqlParameter("matchStatus", MySqlDbType.Int32) {
                Direction = ParameterDirection.Output
            };
            cmd.Parameters.Add(matchStatus);
            
            var oldMatchStatus = new MySqlParameter("oldMatchStatus", MySqlDbType.Int32) {
                Direction = ParameterDirection.Output
            };
            cmd.Parameters.Add(oldMatchStatus);
            
            var blocked = new MySqlParameter("isBlocked", MySqlDbType.Int32) {
                Direction = ParameterDirection.Output
            };
            cmd.Parameters.Add(blocked);
            
            await cmd.ExecuteNonQueryAsync();
            
            var likedUserId = await UserService.GetId(data.Username);
            var nameUser = await UserService.GetName(token.id);
            var isBlocked = (cmd.Parameters["isBlocked"].Value as int? ?? 0) > 0;
            if (!isBlocked && likedUserId > 0 && data.Liked) {
                var content = nameUser + " liked you!";
                await sseService.SendNotification(likedUserId, content);
            }
            

            var status = (cmd.Parameters["matchStatus"].Value as int? ?? 0) > 0;
            if (!isBlocked && status && data.Liked) {
                var content1 = "It's a match! Start chatting with " + nameUser;
                await sseService.SendNotification(likedUserId, content1);
                
                var nameUser2 = await UserService.GetName(likedUserId);
                var content2 = "It's a match! Start chatting with " + nameUser2;
                await sseService.SendNotification(token.id, content2);
            }
            var oldStatus = (cmd.Parameters["oldMatchStatus"].Value as int? ?? 0) > 0;
            if (oldStatus && !data.Liked) {
                var content = nameUser + " Unmatched you! :(";
                await sseService.SendNotification(likedUserId, content);
            }

            return new AcceptedResult {
                StatusCode = 200,
                Value = new
                {
                    matchStatus = status,
                    message = status ? "It's a match!" : "Like sent"
                },
            };
        }
        catch (MySqlException e) {
            logger.LogError(message: e.Message);
            return Problem(title: "Server error", detail: "");
        }
    }

    /// <summary>
    /// Block user
    /// </summary>
    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> Block([FromHeader] string authorization, [FromBody] BlockModel data)
    {
        try {
            var token = JwtHelper.DecodeJwtToken(authorization);
            
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new("BlockUser", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@fromUserId", token.id);
            cmd.Parameters.AddWithValue("@toUser", data.Username);
            cmd.Parameters.AddWithValue("@isBlocked", data.IsBlocked);
            
            await cmd.ExecuteNonQueryAsync();
            
            return Ok(new AcceptedResult {
                Value = new {
                    message = data.IsBlocked ? "User blocked" : "User unblocked"
                },
            });
        }
        catch (MySqlException e) {
            logger.LogError(message: e.Message);
            return Problem(title: "Server error", detail: "");
        }
    }

    /// <summary>
    /// Block user
    /// </summary>
    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> Report([FromHeader] string authorization, [FromBody] ReportModel data)
    {
        try {
            var token = JwtHelper.DecodeJwtToken(authorization);
            
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new("ReportUser", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@fromUserId", token.id);
            cmd.Parameters.AddWithValue("@reportedUser", data.Username);

            // Add out parameter for match status
            var reportStatus = new MySqlParameter("@alreadyReported", MySqlDbType.Int32) {
                Direction = ParameterDirection.Output
            };
            cmd.Parameters.Add(reportStatus);
            
            await cmd.ExecuteNonQueryAsync();
            
            var alreadyReported = (reportStatus.Value as int? ?? 0) > 0;
            // Check if the user is already reported
            if (alreadyReported)
                return BadRequest("User already reported");
            
            return Ok("User reported"); 
        }
        catch (MySqlException e) {
            logger.LogError(message: e.Message);
            return Problem(title: "Server error", detail: "");
        }
    }
}