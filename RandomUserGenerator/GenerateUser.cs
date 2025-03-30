using System.Data;
using System.Security.Cryptography;
using System.Text.Json;
using MySql.Data.MySqlClient;

namespace RandomUserGenerator;

public static class GenerateUser
{
    public static async Task Generate(MySqlConnection connection, string gender, int number, string imagesPath)
    {
        var client = new HttpClient();
        var response = await client.GetAsync($"https://randomuser.me/api/?results={number}&gender={gender}&password=special,upper,lower,number&exc=cell,phone,id&noinfo");
        var content = await response.Content.ReadAsStringAsync();
        var users = JsonSerializer.Deserialize<RandomUserResponse>(content) ?? new RandomUserResponse();

        var lorem = new Bogus.DataSets.Lorem("en");
        var random = new Bogus.Randomizer();
        
        foreach (var user in users.Results)
        {
            user.Login.Password = "1234578Jjklrfe!";
            
            try
            {
                (string salt, byte[] hashedPassword) = Crypt.CryptPassWord(user.Login.Password ?? throw new InvalidOperationException());
                Console.WriteLine($"Adding user {user.Login.Username} {user.Login.Password} to the database...");
                
                await using MySqlCommand cmd = new("AddGeneratedUser", connection);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@_username", user.Login.Username);
                cmd.Parameters.AddWithValue("@_password", hashedPassword);
                cmd.Parameters.AddWithValue("@_email", user.Email);
                cmd.Parameters.AddWithValue("@_salt", salt);
                cmd.Parameters.AddWithValue("@birthDate", user.Dob.Date.Split("T")[0]);
                
                cmd.Parameters.AddWithValue("@firstName", user.Name.First);
                cmd.Parameters.AddWithValue("@lastName", user.Name.Last);
                cmd.Parameters.AddWithValue("@genderID", user.Gender == "male" ? 1 : 2);
                cmd.Parameters.AddWithValue("@sexualOrientation", random.WeightedRandom([1, 2, 3], [0.5f, 0.25f, 0.25f]));
                cmd.Parameters.AddWithValue("@_coordinates", user.Location.Coordinates.Latitude + "," + user.Location.Coordinates.Longitude);
                cmd.Parameters.AddWithValue("@_address", user.Location.Street.Number + ", " + user.Location.Street.Name + ", " 
                                                        + user.Location.City + ", " 
                                                        + user.Location.Country);
                
                // Random Bio
                var bio = lorem.Sentences(RandomNumberGenerator.GetInt32(1, 2));
                cmd.Parameters.AddWithValue("@_biography", bio);

                var fame = 1000;
                var isBad = random.Bool();
                var fameVariation = random.Int(0, 200);
                if (isBad) fame -= fameVariation;
                else fame += fameVariation;
                cmd.Parameters.AddWithValue("@_fame", fame);
                
                // Random tags
                var tags = new List<int>();
                var numberOfTags = random.Int(1, 5);
                for (int i = 0; i < numberOfTags; i++) {
                    var tag = random.Int(1, 38);
                    while (tags.Contains(tag)) {
                        tag = random.Int(1, 38);
                    }
                    tags.Add(tag);
                }
                
                for (int i = 0; i < numberOfTags; i++) {
                    // Console.WriteLine($"Adding tag{i+1} {tags[i]}");
                    cmd.Parameters.AddWithValue("@tag"+ (i + 1), tags[i]);
                }
                
                if (tags.Count < 5) {
                    for (int i = tags.Count; i < 5; i++) {
                        // Console.WriteLine($"Adding null tag {i+1}");
                        cmd.Parameters.AddWithValue("@tag"+ (i + 1), null);
                    }
                }
                
                using var memoryStream = new MemoryStream();
                
                // Insert images
                // TODO: Add Human face pictures cartoon pictures
                var numberOfImages = random.Int(1, 4);
                for (int i = 0; i < numberOfImages; i++) {
                    var imageUrl = $"https://picsum.photos/400/500.jpg?random={random.Int(1, 1000)}";
                    
                    // Save image to disk
                    var image = await client.GetByteArrayAsync(imageUrl);
                    var url = imagesPath + Guid.NewGuid() + ".jpg";
                    try {
                        // Console.WriteLine($"Saving image {i+1} to disk at {url}");
                        await File.WriteAllBytesAsync(url, image);
                        cmd.Parameters.AddWithValue("@image"+ (i + 1), url);
                    } catch (Exception e) {
                        Console.WriteLine(e.Message);
                        cmd.Parameters.AddWithValue("@image"+ (i + 1), null);
                    }
                }
                
                for (int i = numberOfImages; i < 5; i++) {
                    cmd.Parameters.AddWithValue("@image"+ (i + 1), null);
                }

                var result = await cmd.ExecuteNonQueryAsync();
                Console.WriteLine(result == 0
                    ? $"User {user.Name.First} {user.Name.Last} failed to be added to the database!"
                    : $"User {user.Name.First} {user.Name.Last} added to the database! Password: {user.Login.Password}");
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }
    }
}