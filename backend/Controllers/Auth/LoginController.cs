using backend.Models.Auth;
using backend.Database;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using System.Data;
using backend.Utils;

namespace backend.Controllers.Auth;

[ApiController]
[Route("Auth/")]
public class LoginController : ControllerBase
{

    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> Login([FromBody] LoginModel newLogin)
    {
        try
        {
            // Vérification des entrées
            if (string.IsNullOrEmpty(newLogin.UserName) || string.IsNullOrEmpty(newLogin.Password))
            {
                return BadRequest(new
                {
                    Error = "InvalidInput",
                    Message = "Nom d'utilisateur et mot de passe requis."
                });
            }

            await using MySqlConnection dbClient = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("GetUserPasswordByUsername", dbClient);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("inputUsername", newLogin.UserName);

            await using MySqlDataReader reader = cmd.ExecuteReader();
            if (!reader.Read())
            {
                return Unauthorized(new
                {
                    Error = "UserNotFound", 
                    Message = "Utilisateur introuvable."
                });
            }

            byte[] hashedPassword = new byte[32];
            reader.GetBytes("password", 0, hashedPassword, 0, 32);
            string salt = reader.GetString("salt");
            int userId = reader.GetInt32("id");
            bool isVerified = reader.GetBoolean("is_verified");
            // Vérification du mot de passe
            bool isPasswordValid = Crypt.VerifyPassword(newLogin.Password, salt, hashedPassword);
            if (isPasswordValid)
            {
                if (!isVerified) {
                    return Unauthorized(new {
                        Error = "AccountNotVerified",
                        Message = "Votre compte n'est pas encore vérifié. Veuillez vérifier votre boîte mail."
                    });
                }
                
                string token = JwtHelper.GenerateJwtToken(userId, newLogin.UserName);
                return Ok(new
                {
                    Message = "Connexion réussie.",
                    Id = userId,
                    Token = token
                });
            }
            return Unauthorized(new
            {
                Error = "InvalidCredentials",
                Message = "Mot de passe incorrect."
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erreur lors de la connexion : {ex.Message}");
            return StatusCode(500, new
            {
                Error = "ServerError",
                Message = "Une erreur interne est survenue. Veuillez réessayer."
            });
        }
    }
    
    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult ForgottenPassword([FromBody] ForgottenPasswordModel forgottenPassword)
    {
        try 
        {
            //Environment.GetEnvironmentVariable("ROOT_URL") + "/Auth/ForgottenPassword/" +
            string forgottenPasswordLink =  Guid.NewGuid().ToString();
            using MySqlConnection dbClient = DbHelper.GetOpenConnection();
            using MySqlCommand cmd = new MySqlCommand("CheckUserExist", dbClient);
            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.AddWithValue("inputMail", forgottenPassword.Email);
            MySqlParameter existsParam = new MySqlParameter("userExists", MySqlDbType.Int32)
            {
                Direction = ParameterDirection.Output
            };
            cmd.Parameters.Add(existsParam);

            cmd.ExecuteNonQuery();

            // Vérifiez si l'utilisateur existe
            int userExists = Convert.ToInt32(existsParam.Value);
            if (userExists != 0 && forgottenPassword.Email != null)
            {
                using MySqlCommand cmdLink = new MySqlCommand("forgottenPasswordLink", dbClient);
                cmdLink.CommandType = CommandType.StoredProcedure;

                cmdLink.Parameters.AddWithValue("inputForgottenPasswordLink", forgottenPasswordLink);
                cmdLink.Parameters.AddWithValue("inputMail", forgottenPassword.Email);
                cmdLink.ExecuteNonQuery();
                Notify.SendForgottenPasswordMail(forgottenPassword.Email, forgottenPasswordLink);
            }
            return Ok("If informations are valid, a mail will be sent to the adress");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erreur : {ex.Message}");
            return StatusCode(500, "An error occurred. Please try again later.");
        }
    }

    [HttpPost]
    [Route("[action]/{verificationID}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyForgottenPassword(string verificationID)
    {
        try
        {
            if (string.IsNullOrEmpty(verificationID)) {
                return BadRequest("Verification link incorrect");
            }

            await using MySqlConnection dbClient = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("GetVerificationForgottenPasswordInfo", dbClient);
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("inputVerifyLink", verificationID);

            await using MySqlDataReader reader = cmd.ExecuteReader();
            if (!reader.Read()) 
                return BadRequest("Verification link not found or invalid.");
            
            // Extraire les colonnes retournées
            string forgottenPasswordLink = reader.GetString("forgotten_password_link");
            string email = reader.GetString("email");
            DateTime emailLinkExpiration = reader.GetDateTime("forgotten_password_link_expiration");
            if (forgottenPasswordLink != verificationID || emailLinkExpiration < DateTime.UtcNow)
            {
                return BadRequest("Email expired.");
            }
            reader.Close();

            return Ok("Verification completed successfully.");
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new
            {
                Error = "ServerError",
                Message = "Une erreur interne est survenue. Veuillez réessayer."
            });
        }
    }

    [HttpPost]
    [Route("[action]/{verificationID}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword(string verificationID, [FromBody] ResetPasswordModel data)
    {
        try
        {
            if (string.IsNullOrEmpty(data.Password) || string.IsNullOrEmpty(data.ConfirmPassword))
                return BadRequest("Password and confirmation are required.");
            
            if (data.Password != data.ConfirmPassword)
                return BadRequest("Passwords do not match.");
            
            if (string.IsNullOrEmpty(verificationID))
                return BadRequest("Verification link incorrect");

            await using MySqlConnection dbClient = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new("GetVerificationForgottenPasswordInfo", dbClient);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("inputVerifyLink", verificationID);

            await using MySqlDataReader reader = cmd.ExecuteReader();
            if (!reader.Read()) 
                return BadRequest("Verification link not found or invalid.");
            
            // Extraire les colonnes retournées
            string forgottenPasswordLink = reader.GetString("forgotten_password_link");
            string email = reader.GetString("email");
            string username = reader.GetString("username");
            
            DateTime emailLinkExpiration = reader.GetDateTime("forgotten_password_link_expiration");
            if (forgottenPasswordLink != verificationID || emailLinkExpiration < DateTime.UtcNow)
                return BadRequest("Email expired.");
            
            await reader.CloseAsync();

            if (!Checks.IsValidPassword(data.Password, username))
                return BadRequest("Mot de passe incorrect:\nIl faut au moins 1 majuscule 1 minuscule 1 caractères special et 1 chiffre\nLe mot de passe doit faire au moins 8 caracteres");
            
            (string salt, byte [] hashedPassword) = Crypt.CryptPassWord(data.Password ?? throw new InvalidOperationException());
            
            await using MySqlCommand cmdReset = new MySqlCommand("assertResetPassword", dbClient);
            cmdReset.CommandType = CommandType.StoredProcedure;
            cmdReset.Parameters.AddWithValue("userMail", email);
            cmdReset.Parameters.AddWithValue("userPassword", hashedPassword);
            cmdReset.Parameters.AddWithValue("inputSalt", salt);
            cmdReset.ExecuteNonQuery();
            
            return Ok("Password updated successfully.");
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return StatusCode(500, new
            {
                Error = "ServerError",
                Message = "Une erreur interne est survenue. Veuillez réessayer."
            });
        }
    }
};