namespace backend.Models.Match;

public class MatchModel
{
    public string? Username { get; set; }
    public string? Name { get; set; }
    public string? ImageUrl { get; set; }
    public bool? IsOnline { get; set; }
}

public class LikeModel
{
    public required string Username { get; set; }
    public required bool Liked { get; set; }
}

public class BlockModel
{
    public required string Username { get; set; }
    public required bool IsBlocked { get; set; }
}

public class ReportModel
{
    public required string Username { get; set; }
}