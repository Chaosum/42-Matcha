namespace backend.Models.Auth;

public class LoginModel
{
    public string? UserName { get; set; }
    public string? Password { get; set; }
}

public class ResetPasswordModel
{
    public string? Password { get; set; }
    public string? ConfirmPassword { get; set; }
}