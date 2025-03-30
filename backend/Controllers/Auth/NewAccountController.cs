using System.Data;
using System.Diagnostics;
using backend.Database;
using backend.Models.Users;
using backend.Utils;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace backend.Controllers.Auth;

[ApiController]
[Route("Auth/")]
public class NewAccountController : ControllerBase
{
    private class NewAccountResponse {
        public string? UserName { get; set; } = "";
        public string? Password { get; set; } = "";
        public string? Mail { get; set; } = "";
        public string? BirthDate { get; set; } = "";
    }
    
    private readonly NewAccountResponse _responseMessage = new();
    
    private bool CheckUserInfo(NewAccountModel newAccount)
    {
        if (!Checks.IsValidUserName(newAccount.UserName))
        {
            _responseMessage.UserName = $"Nom d'utilisateur invalide:\nIl doit contenir entre 3 et 20 caractères\nIl ne doit pas contenir de caractère speciaux {newAccount.UserName}";
        }
        if (!Checks.IsValidPassword(newAccount.Password, newAccount.UserName))
        {
            _responseMessage.Password = "Mot de passe incorrect:\nIl faut au moins 1 majuscule 1 minuscule 1 caractères special et 1 chiffre\nLe mot de passe doit faire au moins 8 caracteres";
        }
        if (!Checks.IsValidMail(newAccount.Email)) {
            _responseMessage.Mail = "L'adresse e-mail est invalide. Veuillez fournir une adresse e-mail valide.";
        }
        if (!Checks.IsValidBirthDate(newAccount.BirthDate)) {
            _responseMessage.BirthDate = "Vous devez etre majeur pour vous inscrire.";
        }
        
        if (_responseMessage.UserName != "" || _responseMessage.Password != "" || _responseMessage.Mail != "" || _responseMessage.BirthDate != "") {
            return false;
        }
        return true;
    }
    
    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CreateNewAccount([FromBody] NewAccountModel newAccount)
    {
        try {
            using MySqlConnection dbClient = DbHelper.GetOpenConnection();
            if (!CheckUserInfo(newAccount)) {
                return new ObjectResult(new {
                    Error = _responseMessage,
                }) {
                    StatusCode = 400
                };
            }

            string verificationLink = Guid.NewGuid().ToString();
            (string salt, byte [] hashedPassword) = Crypt.CryptPassWord(newAccount.Password ?? throw new InvalidOperationException());

            using MySqlCommand cmd = new MySqlCommand("InsertNewAccount", dbClient);
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userName", newAccount.UserName);
            cmd.Parameters.AddWithValue("@userPassword", hashedPassword);
            cmd.Parameters.AddWithValue("@userMail", newAccount.Email);
            cmd.Parameters.AddWithValue("@userBirthDate", newAccount.BirthDate);
            cmd.Parameters.AddWithValue("@verificationLink", verificationLink);
            cmd.Parameters.AddWithValue("@verificationLinkExpiration", DateTime.UtcNow.AddHours(1));
            cmd.Parameters.AddWithValue("@inputSalt", salt);
            cmd.ExecuteNonQuery();
            dbClient.Close();

            if (newAccount.Email != null) 
                Notify.SendVerificationEmail(newAccount.Email, verificationLink);
            return Ok(new {
                Message = "Account created successfully."
            });
        }
        catch (Exception e) {
            Console.WriteLine(e.Message);
            return BadRequest(new {
                Message = $"{e.Message}"
            });
        }
    }
    [HttpPost]
    [Route("[action]/{verificationID}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyAccount(string verificationID)
    {
        try
        {
            if (string.IsNullOrEmpty(verificationID)) {
                return BadRequest("Verification link incorrect");
            }

            await using MySqlConnection dbClient = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new MySqlCommand("GetVerificationAccountInfo", dbClient);
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("inputVerifyLink", verificationID);

            await using MySqlDataReader reader = cmd.ExecuteReader();
            if (!reader.Read()) 
                return BadRequest("Verification link not found or invalid.");
            
            // Extraire les colonnes retournées
            int userId = reader.GetInt32("id");
            bool isVerified = reader.GetBoolean("is_verified");
            string emailVerificationLink = reader.GetString("email_verification_link");
            string email = reader.GetString("email");
            DateTime forgottenPasswordLinkExpiration = reader.GetDateTime("email_verification_link_expiration");
            // Vérifier l'état de l'utilisateur
            if (isVerified)
            {
                return BadRequest("Account is already verified.");
            }
            if (emailVerificationLink != verificationID || forgottenPasswordLinkExpiration < DateTime.UtcNow)
            {
                return BadRequest("Email expired.");
            }
            reader.Close();
            
            // Mettez à jour l'état de vérification ici si nécessaire
            await using MySqlCommand updateCmd = new MySqlCommand("assertAccountVerification", dbClient);
            updateCmd.CommandType = System.Data.CommandType.StoredProcedure;
            updateCmd.Parameters.AddWithValue("user_id", userId);
            updateCmd.ExecuteNonQuery();

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
}