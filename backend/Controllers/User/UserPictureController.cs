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
public class UserPictureController(ILogger<UserPictureController> logger) : ControllerBase
{
    private readonly string _imagePath = Environment.GetEnvironmentVariable("IMAGE_PATH") ?? "/home/cyril/Dev/42/Occ/Matcha/images/";

    /// <summary>
    /// Upload user picture
    /// </summary>
    /// <param name="image">Image data</param>
    /// <param name="authorization">Token</param>
    /// <response code="200">Picture uploaded</response>
    /// <response code="400">Bad request</response>
    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> Upload([FromForm] UserPictureModel image, [FromHeader] string authorization)
    {
        try {
            var token = JwtHelper.DecodeJwtToken(authorization);
            if (image.Position < 1 || image.Position > 5)
                return BadRequest("Invalid image position");
            
            // Check if image is valid
            if (image.Data.Length == 0)
                return BadRequest("Image is empty");
            if (image.Data.ContentType != "image/jpeg" && image.Data.ContentType != "image/png")
                return BadRequest("Invalid image type");
            if (image.Data.Length > 5 * 1024 * 1024) // 5MB
                return BadRequest("Image is too large");
            if (image.Data.Length < 1 * 1024) // 1KB
                return BadRequest("Image is too small");
            
            using var memoryStream = new MemoryStream();
            await image.Data.CopyToAsync(memoryStream);
            var bytes = memoryStream.ToArray();
            
            var isValid = Files.IsImageFileValid(bytes);
            if (!isValid)
                return BadRequest("Image type not supported");

            var userFolder = _imagePath;
            // Check if file path exist
            if (!Directory.Exists(userFolder))
                Directory.CreateDirectory(userFolder);

            string extension;
            if (image.Data.ContentType == "image/jpeg")
                extension = "jpg";
            else if (image.Data.ContentType == "image/png")
                extension = "png";
            else
                return BadRequest("Invalid image type");
            
            // Save image to disk
            var imageName = Guid.NewGuid() + "." + extension;
            var url = _imagePath + imageName;
            Console.WriteLine(url);

            await System.IO.File.WriteAllBytesAsync(url, bytes);
            
            // Save image url to database
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            
            await using MySqlCommand deleteImageCmd = new MySqlCommand("GetUserImage", conn);
            deleteImageCmd.CommandType = CommandType.StoredProcedure;
            deleteImageCmd.Parameters.AddWithValue("@userID", token.id);
            deleteImageCmd.Parameters.AddWithValue("@position", image.Position);
            await using var reader = deleteImageCmd.ExecuteReader();

            var oldUrl = "";
            if (await reader.ReadAsync()) {
                oldUrl = reader["image_url"].ToString() ?? "";
            }
            await reader.CloseAsync();
            
            await using MySqlCommand addImageCmd = new MySqlCommand("UploadImage", conn);
            addImageCmd.CommandType = CommandType.StoredProcedure;
            addImageCmd.Parameters.AddWithValue("@userID", token.id);
            addImageCmd.Parameters.AddWithValue("@position", image.Position);
            addImageCmd.Parameters.AddWithValue("@imageUrl", imageName);
            var result = addImageCmd.ExecuteNonQuery();
            
            if (result == 0)
                return Problem("Fail to upload image to database", null, 500);
            
            if (System.IO.File.Exists(oldUrl))
                System.IO.File.Delete(oldUrl);
            
            return Ok(imageName);
        } catch (Exception e) {
            logger.LogError(e, e.Message);
            return Problem(e.Message);
        }
    }
    
    /// <summary>
    /// Upload user picture
    /// </summary>
    /// <param name="position">Image position</param>
    /// <response code="200">Picture deleted</response>`
    /// <response code="400">Bad request</response>
    [HttpDelete]
    [Route("[action]/{position:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> Delete(int position, [FromHeader] string authorization)
    {
        try {
            var token = JwtHelper.DecodeJwtToken(authorization);
            
            if (position is < 1 or > 5) {
                logger.LogError("Invalid image position");
                return ValidationProblem("Invalid image position");
            }
            
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            
            await using MySqlCommand getImageCmd = new MySqlCommand("GetUserImage", conn);
            getImageCmd.CommandType = CommandType.StoredProcedure;
            getImageCmd.Parameters.AddWithValue("@userID", token.id);
            getImageCmd.Parameters.AddWithValue("@position", position);
            await using var reader = getImageCmd.ExecuteReader();
            
            // Delete image from disk
            if (!await reader.ReadAsync()) {
                logger.LogError("Image not found in database");
                return ValidationProblem("Image not found");
            }
            
            var fileName = reader["image_url"].ToString() ?? "";
            await reader.CloseAsync();
            
            var url = _imagePath + fileName;
            
            if (System.IO.File.Exists(url))
                System.IO.File.Delete(url);
            else {
                logger.LogError("Image file does not exist");
                return ValidationProblem("Image does not exist");
            }
            
            await using MySqlCommand deleteImageCmd = new MySqlCommand("DeleteImage", conn);
            deleteImageCmd.CommandType = CommandType.StoredProcedure;
            deleteImageCmd.Parameters.AddWithValue("@userID", token.id);
            deleteImageCmd.Parameters.AddWithValue("@position", position);
            var result = deleteImageCmd.ExecuteNonQuery();
            
            return result >= 1 ? Ok("Image deleted") : Problem("Fail to delete image in database", null, 500);
            
        } catch (Exception e) {
            logger.LogError(e, e.Message);
            return Problem(e.Message);
        }
    }

    /// <summary>
    /// Upload user picture
    /// </summary>
    /// <param name="imageName">Image name</param>
    /// <response code="200">Picture deleted</response>
    /// <response code="400">Bad request</response>
    [HttpPost]
    [Route("[action]")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> Get([FromForm] string imageName)
    {
        try {
            var url = _imagePath + imageName;
            Console.WriteLine(url);
            
            if (!System.IO.File.Exists(url)) {
                logger.LogError("Image file does not exist");
                return ValidationProblem("Image does not exist");
            }
            
            var bytes = await System.IO.File.ReadAllBytesAsync(url);
            var base64String = Convert.ToBase64String(bytes);
            return Ok("data:image/png;base64," + base64String);
            
        } catch (Exception e) {
            logger.LogError(e, e.Message);
            return Problem(e.Message);
        }
    }
}