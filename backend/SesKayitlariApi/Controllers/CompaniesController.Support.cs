namespace SesKayitlariApi.Controllers;

// ---- Request DTO'ları ----------------------------------------------

public class CreateCompanyRequest
{
    public string Name { get; set; } = default!;
}

public class UpdateCompanyRequest
{
    public string Name { get; set; } = default!;
}

public class AssignUserRequest
{
    // Keycloak access token'ındaki "sub" claim'i — atanacak kullanıcının
    // değişmeyen benzersiz kimliği. Bu uygulamada henüz bir "kullanıcı
    // arama/listeleme" özelliği olmadığı için (Keycloak kullanıcı listesi
    // ayrı bir entegrasyon gerektirir), admin bu id'yi Keycloak admin
    // konsolundan/kullanıcının kendisinden öğrenip buraya girer.
    public string UserId { get; set; } = default!;
}

// ---- Response DTO'su --------------------------------------------------

public class UserCompanyAssignmentDto
{
    public int Id { get; set; }
    public string UserId { get; set; } = default!;
}