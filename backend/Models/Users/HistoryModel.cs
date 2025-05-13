namespace backend.Models.Users;

public class HistoryModel(string name, string username)
{
    public string Name { get; set; } = name;
    public string Username { get; set; } = username;
}