using System.Data;
using backend.Database;
using backend.Models.App;
using backend.Models.Users;
using backend.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace backend.Controllers.App;

[ApiController]
[Authorize]
[Route("App/")]
public class DatingController : ControllerBase
{

    [HttpGet]
    [Route("[action]")]
    public FullUserProfileModel? GetUserProfile(string username)
    {
        using MySqlConnection conn = DbHelper.GetOpenConnection();
        using MySqlCommand cmd = new MySqlCommand("GetFullUserProfile", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@usernameInput", username);

        using MySqlDataReader reader = cmd.ExecuteReader();
        if (!reader.Read()) return null;
        try
        {

            FullUserProfileModel profile = new FullUserProfileModel
            {
                Id = reader.GetInt32("id"),
                Username = reader.GetString("username"),
                FirstName = reader.GetString("first_name"),
                LastName = reader.GetString("last_name"),
                Gender = reader.GetInt32("gender_id"),
                SexualOrientation = reader.GetInt32("sexual_orientation"),
                Biography = reader.GetString("biography"),
                Coordinates = reader.GetString("coordinates"),
                Address = reader.GetString("address"),
                ProfileCompletionPercentage = reader.GetInt32("profile_completion_percentage"),
                FameRating = reader.GetInt32("fame"),
                IsVerified = reader.GetBoolean("is_verified"),
                Tags = reader.GetString("tags").Split(","),
                profilePictureUrl = reader.GetString("profile_picture"),
                pictures = reader.IsDBNull("pictures")?
                            null :
                            reader.GetString("pictures").Split(","),
                birthDate = reader.GetDateTime("birth_date"),
                Status = reader.GetInt32("profile_status")
            };
            return profile;
        }
        catch (Exception e)
        {
            Console.WriteLine("Error when retrieving profile : " + e.Message);
        }
        return null;
    }

    [HttpGet]
    [Route("[action]")]
    private (int, List<ProfilesModel>) GetMatchingProfiles(FiltersModel matchingSettings, FullUserProfileModel profile)
    {
        using MySqlConnection dbClient = DbHelper.GetOpenConnection();
        using var command = new MySqlCommand("GetMatchingProfiles", dbClient);
        command.CommandType = CommandType.StoredProcedure;

        command.Parameters.AddWithValue("@ref_user_id", profile.Id);
        command.Parameters.AddWithValue("@max_age_gap", matchingSettings.ageGap);
        command.Parameters.AddWithValue("@max_distance_gap", matchingSettings.distanceGap);
        command.Parameters.AddWithValue("fame_gap", matchingSettings.fameGap);
        command.Parameters.AddWithValue("sort_by", matchingSettings.sortBy);
        command.Parameters.AddWithValue("ref_fame", profile.FameRating);
        command.Parameters.AddWithValue("ref_birthdate", profile.birthDate);
        command.Parameters.AddWithValue("ref_gender_id", profile.Gender);
        command.Parameters.AddWithValue("ref_sexual_orientation_id", profile.SexualOrientation);
        command.Parameters.AddWithValue("ref_coordinates_str", profile.Coordinates);
        command.Parameters.AddWithValue("result_offset",matchingSettings.resultOffset);
        command.Parameters.AddWithValue("result_limit",matchingSettings.resultLimit);
        var totalCountParam = new MySqlParameter("@total_count", MySqlDbType.Int32)
        {
            Direction = ParameterDirection.Output
        };
        command.Parameters.Add(totalCountParam);
        var readerProfiles = command.ExecuteReader();
        List<ProfilesModel> profilesMatchingFilters = new();
        while (readerProfiles.Read())
        {
            profilesMatchingFilters.Add(new ProfilesModel
            {
                Id = readerProfiles.GetInt32("id"),
                userName = readerProfiles.GetString("username"),
                FirstName = readerProfiles.GetString("first_name"),
                LastName = readerProfiles.GetString("last_name"),
                age = CalculateAge(readerProfiles.GetDateTime("birth_date")),
                address = readerProfiles.GetString("address"),
                fame = readerProfiles.GetInt32("fame"),
                tags = readerProfiles.GetString("tags").Split(','), // si tu as une colonne "tags" séparée par virgule
                distance = readerProfiles.GetInt32("distance_to_ref"),
                calculatedFame = readerProfiles.GetInt32("calculatedFame"),
                profileImageUrl = readerProfiles.GetString("image_url"),
                commonTags = readerProfiles.GetInt32("common_tags"),
                gender = readerProfiles.GetString("gender")
            });
        }
        readerProfiles.Close();
        int totalCount = (int)totalCountParam.Value;
        return (totalCount, profilesMatchingFilters);
    }


    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public IActionResult Dating([FromBody] FiltersModel matchingSettings)
    {
        //check le token si authorized
        var authorizationHeader = HttpContext.Request.Headers["Authorization"].ToString();
        if (string.IsNullOrEmpty(authorizationHeader) || !authorizationHeader.StartsWith("Bearer "))
        {
          return Unauthorized("Missing or invalid token.");
        }

        //on extrait l'id et 'username du token
        var token = authorizationHeader.Substring("Bearer ".Length).Trim();
        (int id, string username) = JwtHelper.DecodeJwtToken(token);
        //on recupere les infos de notre profile
        FullUserProfileModel? profile = GetUserProfile(username);
        if (profile == null)
        {
            return ValidationProblem();
        }
        //on recupere les profils qui match les gaps qu'on a renseigner
        try
        {
            int totalCountRows = 0;
            List<ProfilesModel> profilesMatchingFilters = new();
            (totalCountRows, profilesMatchingFilters) = GetMatchingProfiles(matchingSettings, profile);
            return Ok(new {
                profiles = profilesMatchingFilters,
                totalCount = totalCountRows
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Erreur lors de la récupération des profils : {ex.Message}");
        }
    }

    private int CalculateAge(DateTime birthdate)
    {
        var today = DateTime.Today;
        var age = today.Year - birthdate.Year;
        if (birthdate > today.AddYears(-age)) age--;
        return age;
    }
}