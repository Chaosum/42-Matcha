namespace Matcha.Models
{
    public class User
    {
        public int ID { get; set; }
        public string email { get; set; }
        public string password { get; set; }
        public string username { get; set; }
        public bool isVerified { get; set; }
        public DateTime birthDate { get; set; }
        public int genderID { get; set; }
        public int rank { get; set; }
        public int profilePictureID { get; set; }
        public bool profileCompleted { get; set; }
        public DateTime createdOn { get; set; }
        public bool isBanned { get; set; }
        public DateTime banDate { get; set; }
    }
}