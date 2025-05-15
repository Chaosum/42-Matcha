using System.Data;
using System.Diagnostics;
using backend.Database;
using backend.Models.Users;
using backend.Utils;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using System.Net.Mail;

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
            _responseMessage.UserName = "Nom d'utilisateur invalide." +
                                        "Il doit contenir entre 3 et 20 caractères." +
                                        "Il ne peux contenir que ces caractère spéciaux: @$!%*+-?&";
        }
        if (!Checks.IsValidPassword(newAccount.Password, newAccount.UserName))
        {
            _responseMessage.Password = "Mot de passe incorrect." +
                                        "Il faut au moins 1 majuscule 1 minuscule 1 caractères special et 1 chiffre." +
                                        "Le mot de passe doit faire au moins 8 caractères.";
        }
        if (!Checks.IsValidMail(newAccount.Email)) {
            _responseMessage.Mail = "L'adresse e-mail est invalide. Veuillez fournir une adresse e-mail valide.";
        }
        if (!Checks.IsValidBirthDate(newAccount.BirthDate)) {
            _responseMessage.BirthDate = "Vous devez être majeur pour vous inscrire.";
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
            await using MySqlCommand cmd = new MySqlCommand("getVerificationAccountInfo", dbClient);
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
            DateTime emailLinkExpiration = reader.GetDateTime("email_verification_link_expiration");
            // Vérifier l'état de l'utilisateur
            if (isVerified)
            {
                return BadRequest("Account is already verified.");
            }
            if (emailVerificationLink != verificationID || emailLinkExpiration < DateTime.UtcNow)
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

    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> sendverificationlink(string email)
    {
        if (string.IsNullOrEmpty(email))
            return BadRequest("Email null ou vide");

        // Validation du format de l'e-mail
        try
        {
            var mailAddress = new MailAddress(email);
        }
        catch (FormatException)
        {
             return BadRequest("format du mail incorect"); // Format invalide
        }

        // Vérification en base de données
        try
        {
            using MySqlConnection dbClient = DbHelper.GetOpenConnection();
            using MySqlCommand cmd = new MySqlCommand("CheckMailTaken", dbClient);
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@userMail", email);

            // La procédure stockée renvoie un entier ou un booléen
            var result = cmd.ExecuteScalar();
            
            dbClient.Close();

            // Si la procédure renvoie 1 ou "true", l'e-mail est déjà pris
            if (result != null && Convert.ToInt32(result) > 0){
                await using MySqlConnection dbClientUpdateVerifLink = DbHelper.GetOpenConnection();
                await using MySqlCommand cmdVerifLink = new MySqlCommand("updateEmailVerificationLink", dbClientUpdateVerifLink);
                cmdVerifLink.CommandType = System.Data.CommandType.StoredProcedure;

                string verificationLink = Guid.NewGuid().ToString();
                cmdVerifLink.Parameters.AddWithValue("userMail", email);
                cmdVerifLink.Parameters.AddWithValue("verificationLink", verificationLink);
                cmdVerifLink.Parameters.AddWithValue("verificationLinkExpiration", DateTime.UtcNow.AddHours(1));
                cmdVerifLink.ExecuteNonQuery();
                dbClientUpdateVerifLink.Close();
                Notify.SendVerificationEmail(email, verificationLink);
            }
            return Ok("Mail sent if correct");
        }
        catch (Exception ex) {
            return BadRequest($"Erreur lors de la vérification de l'e-mail : {ex.Message}");
        }
    }
}