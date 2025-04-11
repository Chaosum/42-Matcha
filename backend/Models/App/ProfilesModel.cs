using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Models.App
{
    public class ProfilesModel
    {
        public required int Id { get; set;}
        public required string userName { get; set;}
        public required string FirstName { get; set;}
        public required string LastName { get; set;}
        public required int age { get; set;}
        public required string address { get; set;}
        public required string [] tags { get; set; }
        public required string profileImageUrl { get; set;}
        public required int distance { get; set;}
        public required int fame { get; set;}
        public required int calculatedFame { get; set;}
        public required int commonTags { get; set;}
    }
}