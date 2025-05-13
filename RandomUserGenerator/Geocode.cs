namespace RandomUserGenerator;

public class Feature
{
    public string? type { get; set; }
    public Geometry? geometry { get; set; }
    public Properties? properties { get; set; }
}

public class Geometry
{
    public string? type { get; set; }
    public List<double>? coordinates { get; set; }
}

public class Properties
{
    public string? label { get; set; }
    public double? score { get; set; }
    public string? id { get; set; }
    public string? banId { get; set; }
    public string? name { get; set; }
    public string? postcode { get; set; }
    public string? citycode { get; set; }
    public double? x { get; set; }
    public double? y { get; set; }
    public string? city { get; set; }
    public string? context { get; set; }
    public string? type { get; set; }
    public double? importance { get; set; }
    public string? street { get; set; }
    public string? _type { get; set; }
}

public class Geocode
{
    public string? type { get; set; }
    public List<Feature>? features { get; set; }
}