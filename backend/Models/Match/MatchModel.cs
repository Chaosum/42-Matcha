namespace backend.Models.Match;

public class MatchModel
{
    public string? Username { get; set; }
    public string? Name { get; set; }
    public string? ImageUrl { get; set; }
}

public class LikeModel
{
    public required string Username { get; set; }
    public bool Liked { get; set; }
}