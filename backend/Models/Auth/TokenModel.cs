namespace backend.Models.Auth;

public class TokenModel
{
    public int Id { get; set; } = 0;
    public string Username { get; set; } = "";

    public TokenModel()
    {
    }

    public TokenModel(int id, string username)
    {
        Id = id;
        Username = username;
    }
}