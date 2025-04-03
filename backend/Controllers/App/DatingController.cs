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
    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public IActionResult Dating([FromBody] FiltersModel matchingSettings, [FromHeader] string authorization)
    {
        var id = JwtHelper.DecodeJwtToken(authorization);

        using MySqlConnection conn = DbHelper.GetOpenConnection();
        using MySqlCommand cmd = new MySqlCommand("GetUserProfile", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userID", id);

            using MySqlDataReader reader = cmd.ExecuteReader();
            if (!reader.Read()) return ValidationProblem();
            
            var profile = new UserProfileModel
            {
                Gender = reader.GetInt32("gender_id"),
                SexualOrientation = reader.GetInt32("sexual_orientation"),
                Coordinates = reader.GetString("coordinates"),
                ProfileCompletionPercentage = reader.GetInt32("profile_completion_percentage"),
                FameRating = reader.GetInt32("fame"),
                birthDate = reader.GetDateTime("birth_date")
            };
        using MySqlConnection dbClient = DbHelper.GetOpenConnection();
        using var command = new MySqlCommand("GetMatchingProfiles", dbClient);
        command.CommandType = CommandType.StoredProcedure;

        // Paramètres : tu peux les adapter à ton modèle DatingModel
        command.Parameters.AddWithValue("@ref_user_id", matchingSettings.id);
        command.Parameters.AddWithValue("@max_age_gap", matchingSettings.ageGap);
        command.Parameters.AddWithValue("@max_distance_gap", matchingSettings.distanceGap);
        command.Parameters.AddWithValue("fame_gap", matchingSettings.fameGap);
        command.Parameters.AddWithValue("sort_by", matchingSettings.sortBy);
        command.Parameters.AddWithValue("ref_fame", profile.FameRating);
        command.Parameters.AddWithValue("ref_birthdate", profile.birthDate);
        command.Parameters.AddWithValue("ref_gender_id", profile.Gender);
        command.Parameters.AddWithValue("ref_sexual_orientation_id", profile.SexualOrientation);
        command.Parameters.AddWithValue("ref_coordinates", profile.Coordinates);
        command.Parameters.AddWithValue("result_offset",matchingSettings.resultOffset);
        command.Parameters.AddWithValue("result_resultLimit",matchingSettings.resultLimit);
        
        try
        {
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
                    tags = readerProfiles.GetString("tags").Split(','), // si tu as une colonne "tags" séparée par virgule
                    distance = readerProfiles.GetInt32("distance_to_ref"),
                    fame = readerProfiles.GetInt32("fame"),
                    calculatedFame = readerProfiles.GetInt32("calculatedFame"),
                    profileImageUrl = readerProfiles.GetString("image_url")
                });
            }

            return Ok(profilesMatchingFilters);
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