namespace IquitosDelivery.Application.Common;

public static class UserProfiles
{
    public const string Customer = "Customer";
    public const string BusinessOwner = "BusinessOwner";
    public const string Driver = "Driver";
    public const string Collaborator = "Collaborator";
    public const string Admin = "Admin";

    public static string RoleToDefaultProfile(string role) => role switch
    {
        "Customer" => Customer,
        "Restaurant" => BusinessOwner,
        "Driver" => Driver,
        "Admin" => Admin,
        _ => Customer
    };

    public static string ProfileToEffectiveRole(string profile) => profile switch
    {
        Customer => "Customer",
        BusinessOwner => "Restaurant",
        Driver => "Driver",
        Collaborator => "Customer",
        Admin => "Admin",
        _ => "Customer"
    };

    public static bool IsValidProfile(string profile) =>
        profile is Customer or BusinessOwner or Driver or Collaborator or Admin;
}
