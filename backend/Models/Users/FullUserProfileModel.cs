using System.ComponentModel;
using Swashbuckle.AspNetCore.Annotations;

namespace backend.Models.Users;

public class FullUserProfileModel
{
    [SwaggerIgnore]
    public int? Id {get;set;}

    [SwaggerIgnore]
    public string? Username {get;set;}

    [DefaultValue("Jean")]
    public string? FirstName {get;set;}

    [DefaultValue("Bono")]
    public string? LastName {get;set;}

    [DefaultValue(1)]
    public int? Gender {get;set;} // 1: Men 2: Women

    [DefaultValue(1)]
    public int? SexualOrientation {get;set;}

    [DefaultValue("This is a bio.")]
    public string? Biography {get;set;}

    [DefaultValue("45.7736192,4.7579136")] // 45.7736192 4.7579136 → École 42 position
    public string? Coordinates {get;set;}

    [DefaultValue("")]
    public string? Address {get;set;}
    
    [DefaultValue(0)]
    public int? ProfileCompletionPercentage {get;set;}
    
    [DefaultValue(0)]
    public int? FameRating {get;set;}
    
    // For GET request
    [SwaggerIgnore]
    public bool? IsVerified {get;set;}
    
    [SwaggerIgnore]
    public string[]? Tags {get;set;}
    
    [SwaggerIgnore]
    public string? profilePictureUrl {get;set;}
    [SwaggerIgnore]
    public string[]? pictures {get;set;}
    
    [SwaggerIgnore]
    public DateTime birthDate {get;set;}
    
    
    [SwaggerIgnore]
    public int? Status {get;set;}

    [SwaggerIgnore] 
    public bool? isLiked { get; set; }
    
    [SwaggerIgnore]
    public bool? isMatched {get;set;}
    
    [SwaggerIgnore]
    public bool? isBlocked {get;set;}
}
