using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using backend.Database;
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
public class UserProfileController(ILogger<UserProfileController> logger, ISseService sseService) : ControllerBase
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
        if (string.IsNullOrEmpty(username))
            return BadRequest("Username cannot be empty");
        
        try {
            var token= JwtHelper.DecodeJwtToken(authorization);
            
            await using MySqlConnection conn = DbHelper.GetOpenConnection();

            await using var checkUser = new MySqlCommand("CheckUsernameTaken", conn);
            checkUser.CommandType = CommandType.StoredProcedure;
            checkUser.Parameters.AddWithValue("@username", username);
            
            var count = Convert.ToInt32(checkUser.ExecuteScalar());
            if (count == 0)
                return NotFound("User not found");
            
            await using var cmd = new MySqlCommand("GetUserProfile", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@username", username);
            
            await using MySqlDataReader reader = cmd.ExecuteReader();
            if (!reader.Read()) return NotFound();
            
            var id = reader["id"] as int? ?? 0;

            var profile = new UserProfileModel
            {
                Username = reader.GetString("username") ?? "",
                FirstName = reader["first_name"].ToString() ?? "",
                LastName = reader["last_name"].ToString() ?? "",
                BirthDate = reader.GetDateTime("birth_date"),
                Gender = reader["gender_id"] as int?,
                SexualOrientation = reader["sexual_orientation"] as int?,
                Biography = reader["biography"].ToString() ?? "",
                Coordinates = reader["coordinates"].ToString() ?? "",
                FameRating = reader["fame"] as int? ?? 0,
                Address = reader["address"].ToString() ?? "",
                LastSeen = reader["last_time_online"] as DateTime? ?? null,
                IsOnline = sseService.IsOnline(id),
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
            likedAndMatch.CommandType = CommandType.StoredProcedure;
            likedAndMatch.Parameters.AddWithValue("@userID", token.id);
            likedAndMatch.Parameters.AddWithValue("@otherUser", username);
            
            // output parameters
            likedAndMatch.Parameters.Add("isLiked", MySqlDbType.Int32);
            likedAndMatch.Parameters["isLiked"].Direction = ParameterDirection.Output;
            likedAndMatch.Parameters.Add("isBlocked", MySqlDbType.Int32);
            likedAndMatch.Parameters["isBlocked"].Direction = ParameterDirection.Output;
            likedAndMatch.Parameters.Add("isMatched", MySqlDbType.Int32);
            likedAndMatch.Parameters["isMatched"].Direction = ParameterDirection.Output;
            
            await likedAndMatch.ExecuteNonQueryAsync();
            
            var isLiked = likedAndMatch.Parameters["isLiked"].Value as int? ?? 0;
            Console.WriteLine("isLiked: " + isLiked);
            Console.WriteLine("isLiked: " + (isLiked > 0));
            profile.IsLiked = (likedAndMatch.Parameters["isLiked"].Value as int? ?? 0) > 0;
            profile.IsBlocked = (likedAndMatch.Parameters["isBlocked"].Value as int? ?? 0) > 0;
            profile.IsMatched = (likedAndMatch.Parameters["isMatched"].Value as int? ?? 0) > 0;
            
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
                Email = reader["email"].ToString() ?? "",
                BirthDate = reader.GetDateTime("birth_date"),
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
                
            return Ok(profile);
        }
        catch (MySqlException e)
        {
            logger.LogError("{e}", e.Message);
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
            cmd.Parameters.AddWithValue("@Biography", data.Biography);
            cmd.Parameters.AddWithValue("@Coordinates", data.Coordinates);
            cmd.Parameters.AddWithValue("@Address", data.Address?.Trim());
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
            
            await using var checkImage = new MySqlCommand("GetUserImage", conn);
            checkImage.CommandType = CommandType.StoredProcedure;
            checkImage.Parameters.AddWithValue("@userID", token.id);
            checkImage.Parameters.AddWithValue("@_position", 1);
            await using MySqlDataReader reader = checkImage.ExecuteReader();
            if (!reader.Read()) {
                logger.LogError("User has no image in first position");
                return BadRequest("User has no image in first position");
            }
            await reader.CloseAsync();
            
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
    
    /// <summary>
    /// Update email
    /// </summary>
    /// <response code="200">Success</response>
    /// <response code="400">Bad request</response>
    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]     
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> UpdateEmail([FromForm] string email, [FromHeader] string authorization)
    {
        var token = JwtHelper.DecodeJwtToken(authorization);
        
        try {
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("UpdateEmail", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userID", token.id);
            cmd.Parameters.AddWithValue("@newEmail", email);
            var result = cmd.ExecuteNonQuery();
            
            return Ok(result > 0 ? "Email updated" : "");
        }
        catch (MySqlException e) {
            logger.LogError(e.Message);
            return Problem(detail: e.Message);
        }
    }

    /// <summary>
    /// Update email
    /// </summary>
    /// <response code="200">Success</response>
    /// <response code="400">Bad request</response>
    [HttpGet]
    [Route("[action]/{username}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public ActionResult CheckIsMe(string username, [FromHeader] string authorization)
    {
        if (string.IsNullOrEmpty(username))
            return Ok("true");
        
        try {
            var token = JwtHelper.DecodeJwtToken(authorization);
            return Ok(token.username == username ? "true" : "false");
        }
        catch (Exception e) {
            logger.LogError(e.Message);
            return Problem(detail: e.Message);
        }
    }
}