using System.Data;
using backend.Database;
using MySql.Data.MySqlClient;

namespace backend.Services;

public static class UserService
{
    public static async Task<bool> IsBlocked(string fromUser, string toUser)
    {
        try
        {
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new("IsBlocked", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@fromUser", fromUser);
            cmd.Parameters.AddWithValue("@toUser", toUser);
            
            await using MySqlDataReader reader = cmd.ExecuteReader();
            if (!reader.Read()) {
                Console.WriteLine("No data found");
                return false;
            }
            
            return reader.GetBoolean("is_blocked");
        }
        catch (MySqlException e)
        {
            Console.WriteLine(e.Message);
            return false;
        }
    }

    public static async Task<string> GetName(int userId)
    {
        try {
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new("GetName", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@user_id", userId);
            
            await using MySqlDataReader reader = cmd.ExecuteReader();
            if (!reader.Read()) {
                Console.WriteLine("No data found");
                return "";
            }
            
            var firstName = reader.GetString("first_name") ?? "";
            var lastName = reader.GetString("last_name") ?? "";
            return firstName + " " + lastName;
        }
        catch (MySqlException e)
        {
            Console.WriteLine(e.Message);
            return "";
        }
    }

    public static async Task<int> GetId(string userName)
    {
        try {
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new("getuserid", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@inputUsername", userName);
            
            await using MySqlDataReader reader = cmd.ExecuteReader();
            if (!reader.Read()) {
                Console.WriteLine("No data found");
                return 0;
            }
            
            return reader.GetInt32("id");
        }
        catch (MySqlException e)
        {
            Console.WriteLine(e.Message);
            return 0;
        }
    }
    
    public static async Task SaveLastSeen(int userId, DateTime lastSeen)
    {
        try {
            await using MySqlConnection conn = DbHelper.GetOpenConnection();
            await using MySqlCommand cmd = new("SaveLastSeen", conn);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@_userID", userId);
            cmd.Parameters.AddWithValue("@_lastSeen", lastSeen);
            
            await cmd.ExecuteNonQueryAsync();
        }
        catch (MySqlException e)
        {
            Console.WriteLine(e.Message);
        }
    }
}