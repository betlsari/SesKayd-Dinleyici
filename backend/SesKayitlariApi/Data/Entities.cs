namespace SesKayitlariApi.Data;

// =====================================================================
// EF Core entity'leri. Bunlar frontend'e giden DTO'lar (CompanyDto,
// CallRecordDto - bkz. Controllers/RecordsController.Support.cs) İLE
// AYNI DEĞİL — entity'ler veritabanı şemasını, DTO'lar API sözleşmesini
// temsil eder. İkisini kasıtlı olarak ayrı tutuyoruz ki DB şeması
// değiştiğinde frontend'in beklediği JSON şekli otomatik kırılmasın.
// =====================================================================

public class CompanyEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;

    public ICollection<CallRecordEntity> Records { get; set; } = new List<CallRecordEntity>();
    public ICollection<UserCompanyAssignmentEntity> UserAssignments { get; set; } = new List<UserCompanyAssignmentEntity>();
}

public class CallRecordEntity
{
    // String PK: gerçek bir çağrı merkezi/PBX sisteminden gelen
    // dış-sistem id'si olabileceği için (ör. "rec-12" gibi mock veriden
    // farklı olarak GUID ya da PBX'in kendi id'si) int yerine string
    // seçildi. Basit bir kurulum için Guid.NewGuid().ToString() ile de
    // üretebilirsin.
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public DateTime DateTime { get; set; }
    public string CallerNumber { get; set; } = default!;
    public string CalledNumber { get; set; } = default!;
    public string AgentName { get; set; } = default!;
    public string AgentEmail { get; set; } = default!;
    public string Username { get; set; } = default!;
    public int DurationSeconds { get; set; }

    // "Çağrı ID" — dokümandaki iş alanı, PK ile KARIŞTIRILMAMALI. PK
    // (Id) veritabanı/depolama kimliğidir; CallId kullanıcıya gösterilen
    // ve muhtemelen dış sistemden gelen iş kimliğidir.
    public string CallId { get; set; } = default!;

    public int CompanyId { get; set; }
    public CompanyEntity Company { get; set; } = default!;

    public int FileSizeKB { get; set; }
    public string Format { get; set; } = default!;

    // Ses dosyasının fiziksel/obje depolama konumundaki göreceli yolu
    // (ör. "2026/07/rec-12.wav"). MUTLAK path veya URL tutulmaz.
    // Depolama kökü appsettings'te ayrı tutulur.
    public string? AudioStoragePath { get; set; }
}

// Kullanıcı-şirket atama tablosu. Keycloak token'ı SADECE kimliği
// doğrular — "bu kullanıcı hangi şirketlere erişebilir" bilgisi bu
// tabloda, backend'in kendi veritabanında tutulur (bkz. App.tsx
// başındaki mockCompanies notu).
public class UserCompanyAssignmentEntity
{
    public int Id { get; set; }

    // Keycloak access token'ındaki "sub" claim'i — kullanıcının
    // değişmeyen benzersiz kimliği (genelde bir GUID string'i).
    public string UserId { get; set; } = default!;

    public int CompanyId { get; set; }
    public CompanyEntity Company { get; set; } = default!;
}