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

            cmd.Parameters.AddWithValue("inputUsername", forgottenPassword.UserName);
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
};