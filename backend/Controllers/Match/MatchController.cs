using System.Data;
using backend.Database;
using backend.Models.Match;
using backend.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace backend.Controllers.Match;

[ApiController]
[Authorize]
[Route("[controller]")]
public class MatchController(ILogger<MatchController> logger): ControllerBase
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
            var id = JwtHelper.DecodeJwtToken(authorization);
            var matches = new List<MatchModel>();
            
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("GetUserMatches", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userID", id);
            
            using var reader = cmd.ExecuteReaderAsync();
            while (await reader.Result.ReadAsync()) {
                var match = new MatchModel
                {
                    Username = reader.Result["username"].ToString() ?? "",
                    FirstName = reader.Result["first_name"].ToString() ?? "",
                    LastName = reader.Result["last_name"].ToString() ?? "",
                    ImageUrl = reader.Result["image_url"].ToString() ?? ""
                };
                matches.Add(match);
            }
            
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
            await using MySqlCommand cmd = new MySqlCommand("LikeUser", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userID", token.id);
            cmd.Parameters.AddWithValue("@likedUser", data.Username);
            cmd.Parameters.AddWithValue("@isLike", data.Liked);
            
            // Add out paranmeter for match status
            var matchStatus = new MySqlParameter("@matchStatus", MySqlDbType.Int32) {
                Direction = ParameterDirection.Output
            };
            cmd.Parameters.Add(matchStatus);
            
            await cmd.ExecuteNonQueryAsync();

            var status = matchStatus.Value as int? > 0;
            
            return Ok(new AcceptedResult {
                Value = new {
                    matchStatus = status,
                    message = status ? "It's a match!" : "Like sent"
                },
            });
        }
        catch (MySqlException e) {
            logger.LogError(message: e.Message);
            return Problem(title: "Server error", detail: "");
        }
    }
}