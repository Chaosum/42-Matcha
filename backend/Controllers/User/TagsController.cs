using System.Data;
using backend.Database;
using backend.Models.Users;
using backend.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace backend.Controllers.User;

[ApiController]
[Authorize]
[Route("[controller]")]
public class TagsController(ILogger<TagsController> logger): ControllerBase
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
    public async Task<ActionResult> GetList()
    {
        try {
            var tags = new List<TagModel>();
            
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("GetAllTags", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            
            using var reader = cmd.ExecuteReaderAsync();
            while (await reader.Result.ReadAsync()) {
                var tag = new TagModel(reader.Result["id"] as int? ?? 0, reader.Result["name"] as string ?? "");
                tags.Add(tag);
            }
            return Ok(tags);
        }
        catch (MySqlException e) {
            logger.LogError(message: e.Message);
            return Problem(title: "Server error", detail: "");
        }
    }

    /// <summary>
    /// Update user tag
    /// </summary>
    /// <param name="tags">tag id</param>
    /// <param name="authorization"></param>
    /// <response code="200">Tag updated</response>
    /// <response code="400">Bad request</response>
    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> Update([FromForm] List<string> tags, [FromHeader] string authorization)
    {
        try {
            var token = JwtHelper.DecodeJwtToken(authorization);
            if (tags.Count < 1)
                return Ok("No changes");
            
            if (tags.Count > 5)
                return BadRequest("Too many tags");

            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("UpdateTags", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userID", token.id);
            
            var distinctList = tags.Distinct().ToList();
            if (tags.Count != distinctList.Count)
                return BadRequest("Duplicate tags");
            
            for (int i = 0; i < tags.Count; i++) {
                if (Int32.TryParse(tags[i], out var x)) {
                    cmd.Parameters.AddWithValue($"@tag{i+1}", x);
                }
            }
            if (tags.Count < 5) {
                for (int i = tags.Count; i < 6; i++) {
                    cmd.Parameters.AddWithValue($"@tag{i+1}", DBNull.Value);
                }
            }
            
            foreach (MySqlParameter param in cmd.Parameters)
            {
                Console.WriteLine($"{param.ParameterName} = {param.Value}");
            }
            
            await cmd.ExecuteNonQueryAsync();
            return Ok("Tags updated");
        }
        catch (MySqlException e) {
            logger.LogError(e.Message);
            return Problem(detail: e.Message);
        }
    }

    /// <summary>
    /// Update user tag
    /// </summary>
    /// <param name="tag">tag</param>
    /// <param name="authorization"></param>
    /// <response code="200">Tag updated</response>
    /// <response code="400">Bad request</response>
    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> AddToList([FromForm] string tag, [FromHeader] string authorization)
    {
        try {
            var tagId = 0;
            Console.WriteLine(tag);

            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new("AddTag", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@tagName", tag);
            
            // output parameters
            cmd.Parameters.Add("tagId", MySqlDbType.Int32);
            cmd.Parameters["tagId"].Direction = ParameterDirection.Output;
            
            var result = await cmd.ExecuteNonQueryAsync();
            if (result == 0)
                return BadRequest("Tag already exists");
            
            tagId = cmd.Parameters["tagId"].Value as int? ?? 0;
            
            return Ok(tagId);
        }
        catch (MySqlException e) {
            logger.LogError(e.Message);
            return Problem(detail: e.Message);
        }
    }
}