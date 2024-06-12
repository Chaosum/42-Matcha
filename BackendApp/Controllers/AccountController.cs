using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Matcha.Services;
using Matcha.Dtos;
using Matcha.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Security.Claims;
using Npgsql;

namespace Matcha.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AccountController : ControllerBase
    {
        private readonly DatabaseService _databaseService;
        private readonly IConfiguration _configuration;

        public AccountController(DatabaseService databaseService, IConfiguration configuration)
        {
            _databaseService = databaseService;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest loginRequest)
        {
            // Validate the payload
            if (string.IsNullOrEmpty(loginRequest.Username) || string.IsNullOrEmpty(loginRequest.Password))
            {
                return BadRequest("Username and password are required.");
            }

            // Validate user credentials
            var user = await ValidateUserAsync(loginRequest);
            if (user == null)
            {
                return Unauthorized();
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);

            return Ok(new { token });
        }

        private async Task<User> ValidateUserAsync(LoginRequest loginRequest)
        {
            var query = "SELECT * FROM Users WHERE Username = @Username AND Password = @Password";
            var parameters = new NpgsqlParameter[]
            {
                new NpgsqlParameter("Username", loginRequest.Username),
                new NpgsqlParameter("Password", loginRequest.Password) // In practice, hash the password and compare hashes
            };

            var dataTable = await _databaseService.ExecuteQueryAsync(query, parameters);
            if (dataTable.Rows.Count == 0)
            {
                return null;
            }

            var row = dataTable.Rows[0];
            return new User
            {
                Id = (int)row["Id"],
                Username = (string)row["Username"]
            };
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtSettings["Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(30),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
