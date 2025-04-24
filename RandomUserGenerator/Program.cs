using System.Data;
using MySql.Data.MySqlClient;
using RandomUserGenerator;

var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
    ?? "Server=localhost;Port=3307;Database=db;user=root;password=password;";

var imagesPath = Environment.GetEnvironmentVariable("IMAGE_PATH") ?? "/home/mservage/Documents/42matcha/pictures";

// Ask for number of male and female users to generate
Console.WriteLine("Welcome to Random User Generator!");

Console.Write("Enter the number of female users to generate: ");
var numberOfFemaleUsers = int.Parse(Console.ReadLine() ?? "0");

Console.Write("Enter the number of male users to generate: ");
var numberOfMaleUsers = int.Parse(Console.ReadLine() ?? "0");

Console.WriteLine("Initializing...");

// Check if file path exist
if (!Directory.Exists(imagesPath))
    Directory.CreateDirectory(imagesPath);

try
{
    await using MySqlConnection connection = new(connectionString);
    connection.Open();

    if (connection.State != ConnectionState.Open)
    {
        Console.WriteLine("Failed to connect to the database.");
        return;
    }

    Console.WriteLine("Generating User Data...");
    if (numberOfFemaleUsers > 0)
    {
        Console.WriteLine("Generating female users...");
        await GenerateUser.Generate(connection, "female", numberOfFemaleUsers, imagesPath);
        Console.WriteLine("Done!");
    }

    if (numberOfMaleUsers > 0)
    {
        Console.WriteLine("Generating male users...");
        await GenerateUser.Generate(connection, "male", numberOfMaleUsers, imagesPath);
        Console.WriteLine("Done!");
    }

    connection.Close();

}
catch (MySqlException ex)
{
    Console.WriteLine($"MySQL Error: {ex.Message}");
}
catch (Exception ex)
{
    Console.WriteLine($"Error: {ex.Message}");
}

Console.WriteLine("Generation Complete!");