using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
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
public class UserProfileController(ILogger<UserProfileController> logger) : ControllerBase
{
    /// <summary>
    /// Get user profile
    /// </summary>
    /// <param name="username">Username</param>
    /// <response code="200">Success</response>
    /// <response code="400">Bad request</response>
    [HttpGet]
    [Route("[action]/{username}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> Get(string username, [FromHeader] string authorization)
    {
        try {
            var token= JwtHelper.DecodeJwtToken(authorization);
            
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("GetUserProfile", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@username", username);
            
            await using MySqlDataReader reader = cmd.ExecuteReader();
            if (!reader.Read()) return ValidationProblem();
            
            var profile = new UserProfileModel
            {
                Username = reader.GetString("username") ?? "",
                FirstName = reader["first_name"].ToString() ?? "",
                LastName = reader["last_name"].ToString() ?? "",
                birthDate = reader.GetDateTime("birth_date"),
                Gender = reader["gender_id"] as int?,
                SexualOrientation = reader["sexual_orientation"] as int?,
                Biography = reader["biography"].ToString() ?? "",
                Coordinates = reader["coordinates"].ToString() ?? "",
                FameRating = reader["fame"] as int? ?? 0,
                Address = reader["address"].ToString() ?? "",
            };

            // Tags
            if (reader.NextResult()) {
                while (reader.Read())
                {
                    profile.Tags.Add(
                        reader["name"] as string ?? "",
                        reader["id"] as int? ?? 0
                    );
                }
            } 
                
            // Pictures
            if (reader.NextResult()) {
                while (reader.Read())
                    profile.Images.Add(reader["image_url"] as string ?? "");
            }
            await reader.CloseAsync();
            
            await using MySqlCommand likedAndMatch = new MySqlCommand("GetLikeAndMatch", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userID", token.id);
            cmd.Parameters.AddWithValue("@likedUser", username);
            
            await using MySqlDataReader likeAndMatchReader = cmd.ExecuteReader();

            if (!likeAndMatchReader.Read()) {
                await likeAndMatchReader.CloseAsync();
                return Ok(profile);
            };
            
            profile.Liked = likeAndMatchReader.HasRows;
                
            if (!profile.Liked && await likeAndMatchReader.NextResultAsync())
            {
                profile.Liked = likeAndMatchReader.HasRows;
            }
            
            if (await likeAndMatchReader.NextResultAsync())
            {
                profile.Match = likeAndMatchReader.HasRows;
            }

            return Ok(profile);
        }
        catch (MySqlException e)
        {
            logger.LogError(e.Message);
            return Problem(detail: e.Message);
        }
    }
    
    /// <summary>
    /// Get user profile
    /// </summary>
    /// <response code="200">Success</response>
    /// <response code="400">Bad request</response>
    [HttpGet]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> Me([FromHeader] string authorization)
    {
        try {
            var token= JwtHelper.DecodeJwtToken(authorization);
            
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("GetUserProfile", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@username", token.username);

            await using MySqlDataReader reader = cmd.ExecuteReader();
            if (!reader.Read()) return ValidationProblem();
            
            var profile = new UserProfileModel
            {
                FirstName = reader["first_name"].ToString() ?? "",
                LastName = reader["last_name"].ToString() ?? "",
                birthDate = reader.GetDateTime("birth_date"),
                Gender = reader["gender_id"] as int?,
                SexualOrientation = reader["sexual_orientation"] as int?,
                Biography = reader["biography"].ToString() ?? "",
                Coordinates = reader["coordinates"].ToString() ?? "",
                IsVerified = reader["is_verified"] as bool? ?? false,
                ProfileCompletionPercentage = reader["profile_completion_percentage"] as int? ?? 0,
                FameRating = reader["fame"] as int? ?? 0,
                Status = reader["profile_status"] as int? ?? 0,
                Address = reader["address"].ToString() ?? "",
                Username = reader["username"] as string ?? "",
            };

            // Tags
            if (reader.NextResult()) {
                while (reader.Read())
                {
                    profile.Tags.Add(
                        reader["name"] as string ?? "",
                        reader["id"] as int? ?? 0
                    );
                }
            } 
                
            // Pictures
            if (reader.NextResult()) {
                while (reader.Read())
                    profile.Images.Add(reader["image_url"] as string ?? "");
            }
            await reader.CloseAsync();
            
            // logger.LogInformation("{profile}", profile.ToString());
                
            return Ok(profile);
        }
        catch (MySqlException e)
        {
            // logger.LogError("{e}", e.Message);
            return Problem(detail: e.Message);
        }
    }

    /// <summary>
    /// Update user profile
    /// </summary>
    /// <param name="authorization">User input data</param>
    /// <param name="data">User input data</param>
    /// <response code="200">profile updated</response>
    /// <response code="400">Bad request</response>
    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult Update([FromHeader] string authorization, [FromForm] UserProfileModel data)
    {
        var result = Checks.ValidateProfileData(data);
        var token = JwtHelper.DecodeJwtToken(authorization);
        
        Console.WriteLine("COORDIANTES: " + data.Coordinates);
        Console.WriteLine("ADDRESS: " + data.Address);
        
        if (!result.IsValid)
            return BadRequest(result.Message);
        
        try {
            using MySqlConnection conn = DbHelper.GetOpenConnection();
            using MySqlCommand cmd = new MySqlCommand("UpdateUserProfile", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userID", token.id);
            cmd.Parameters.AddWithValue("@firstName", data.FirstName);
            cmd.Parameters.AddWithValue("@lastName", data.LastName);
            cmd.Parameters.AddWithValue("@genderID", data.Gender);
            cmd.Parameters.AddWithValue("@sexualOrientation", data.SexualOrientation);
            cmd.Parameters.AddWithValue("@biography", data.Biography);
            cmd.Parameters.AddWithValue("@coordinates", data.Coordinates);
            cmd.Parameters.AddWithValue("@address", data.Address);
            cmd.ExecuteNonQuery();
            return Ok("Profile successfully updated");
        }
        catch (MySqlException e) {
            logger.LogError(e.Message);
            return Problem(detail: e.Message);
        }
    }

    /// <summary>
    /// Get user profile status
    /// </summary>
    /// <response code="200">Success</response>
    /// <response code="400">Bad request</response>
    [HttpGet]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> Status([FromHeader] string authorization)
    {
        var token = JwtHelper.DecodeJwtToken(authorization);
        
        try {
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("GetUserProfileStatus", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userID", token.id);
            cmd.ExecuteNonQuery();
            
            await using MySqlDataReader reader = cmd.ExecuteReader();
            if (!reader.Read()) return ValidationProblem();
            
            var profileStatus = reader["profile_status"] as int? ?? 0;
            await reader.CloseAsync();
            
            var status = profileStatus switch
            {
                0 => "Info",
                1 => "Images",
                2 => "Complete",
                _ => "Unknown"
            };
            
            return Ok(status);
        }
        catch (MySqlException e) {
            logger.LogError(e.Message);
            return Problem(detail: e.Message);
        }
    }
    
    /// <summary>
    /// Get user profile status
    /// </summary>
    /// <response code="200">Success</response>
    /// <response code="400">Bad request</response>
    [HttpGet]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]     
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> UpdateProfileStatus([FromHeader] string authorization)
    {
        try {
            var token = JwtHelper.DecodeJwtToken(authorization);
        
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("UpdateProfileStatus", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userID", token.id);
            cmd.Parameters.AddWithValue("@status", 2);
            cmd.ExecuteNonQuery();
            
            return Ok("Profile status updated");
        }
        catch (MySqlException e) {
            logger.LogError(e.Message);
            return Problem(detail: e.Message);
        }
    }
}