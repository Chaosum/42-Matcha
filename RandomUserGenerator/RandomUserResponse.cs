using System.Text;
using System.Text.Json.Serialization;
using Newtonsoft.Json;

namespace RandomUserGenerator;

[Serializable]
public class RandomUserResponse
{
    [JsonPropertyName("results")]
    public RandomUser[] Results { get; set; } = [];

    public override string ToString()
    {
        var sb = new StringBuilder();
        foreach (var user in Results)
        {
            user.Name.First = user.Name.First.First().ToString().ToUpper() + user.Name.First.Substring(1);
            user.Name.Last = user.Name.Last.First().ToString().ToUpper() + user.Name.Last.Substring(1);
            sb.Append($"Name: {user.Name.First} {user.Name.Last}\n");
            sb.Append(user.Gender);
            sb.Append($"\nUsername: {user.Login.Username}\n");
            sb.Append($"Email: {user.Email}\n");
            sb.Append($"Birthdate: {user.Dob.Date.Split("T")[0]}\n");
            sb.Append($"Address: {user.Location.Street.Number} {user.Location.Street.Name}, {user.Location.City}, {user.Location.Country}\n");
            sb.Append($"Coordinates: {user.Location.Coordinates.Latitude}, {user.Location.Coordinates.Longitude}\n");
            sb.Append($"Timezone: {user.Location.Timezone.Description}\n");
            // sb.Append($"Password: {user.Login.Password}\n");
            sb.Append("\n");
        }
        return sb.ToString();
    }
}

[Serializable]
public class RandomUser
{
    [JsonPropertyName("gender")]
    public string Gender { get; set; } = string.Empty;
    
    [JsonPropertyName("name")]
    public Name Name { get; set; } = new Name();
    
    [JsonPropertyName("location")]
    public Location Location { get; set; } = new Location();
    
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
    
    [JsonPropertyName("login")]
    public Login Login { get; set; } = new Login();
    
    [JsonPropertyName("dob")]
    public Dob Dob { get; set; } = new Dob();
    
    // [JsonPropertyName("registered")]
    // public Registered Registered { get; set; } = string.Empty;
    
    [JsonPropertyName("info")]
    public Info Info { get; set; } = new Info();
}

[Serializable]
public class Name
{
    [JsonPropertyName("first")]
    public string First { get; set; } = string.Empty;
    
    [JsonPropertyName("last")]
    public string Last { get; set; } = string.Empty;
}

[Serializable]
public class Location
{
    [JsonPropertyName("street")]
    public Street Street { get; set; } = new Street();
    
    [JsonPropertyName("city")]
    public string City { get; set; } = string.Empty;
    
    [JsonPropertyName("state")]
    public string State { get; set; } = string.Empty;
    
    [JsonPropertyName("country")]
    public string Country { get; set; } = string.Empty;
    
    // [JsonPropertyName("postcode")]
    // public int? Postcode { get; set; } = null;
    
    [JsonPropertyName("coordinates")]
    public Coordinates Coordinates { get; set; } = new Coordinates();
    
    [JsonPropertyName("timezone")]
    public Timezone Timezone { get; set; } = new Timezone();
}

[Serializable]
public class Street
{
    [JsonPropertyName("number")]
    public int Number { get; set; }
    
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

[Serializable]
public class Timezone
{
    [JsonPropertyName("offset")]
    public string Offset { get; set; } = string.Empty;
    
    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;
}

[Serializable]
public class Coordinates
{
    [JsonPropertyName("latitude")]
    public string Latitude { get; set; } = string.Empty;
    
    [JsonPropertyName("longitude")]
    public string Longitude { get; set; } = string.Empty;
}

[Serializable]
public class Login
{
    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;
    
    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;
}

[Serializable]
public class Dob
{
    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;
    
    [JsonPropertyName("age")]
    public int Age { get; set; }
}

// ========================

[Serializable]
public class Info
{
    [JsonPropertyName("seed")]
    public string Seed { get; set; } = string.Empty;
    
    [JsonPropertyName("results")]
    public int Results { get; set; }
    
    [JsonPropertyName("page")]
    public int Page { get; set; }
    
    [JsonPropertyName("version")]
    public string Version { get; set; } = string.Empty;
}

[Serializable]
public class AddressData
{
    [JsonProperty("address")] 
    public string Address { get; set; } = string.Empty;

    [JsonProperty("coordinates")] 
    public string Coordinates { get; set; } = string.Empty;
}
    