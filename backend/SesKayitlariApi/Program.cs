using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SesKayitlariApi.Auth;
using SesKayitlariApi.Controllers;
using SesKayitlariApi.Data;
using SesKayitlariApi.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------
// Veritabanı (EF Core)
// ---------------------------------------------------------------------
// SQL Server varsayıldı. Farklı bir veritabanı kullanılacaksa (ör.
// PostgreSQL) sadece bu iki satır + ilgili NuGet paketi değişir,
// Companies/RecordsRepository kodunun HİÇBİRİ değişmez (Npgsql.EntityFrameworkCore.PostgreSQL
// + options.UseNpgsql(connectionString)).
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException(
        "appsettings.json içinde ConnectionStrings:Default tanımlı değil.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Controllers/RecordsController.Support.cs içinde tanımlı sözleşmelerin
// EF Core implementasyonları (Services/ klasörü).
builder.Services.AddScoped<ICompanyAccessService, CompanyAccessService>();
builder.Services.AddScoped<IRecordsRepository, RecordsRepository>();

// ---------------------------------------------------------------------
// Keycloak yapılandırması (appsettings.json -> "Keycloak" bölümü)
// ---------------------------------------------------------------------
// KeycloakOptions.cs (Adım 1) burada bind ediliyor. Url/Realm/ClientId
// değerleri frontend/.env'deki VITE_KEYCLOAK_* değerleriyle (ClientId
// hariç, o API için ayrı olabilir) AYNI Keycloak sunucusunu/realm'ini
// göstermeli — aksi halde frontend'de alınan token burada reddedilir.
//
// NOT: KeycloakOptions içinde bir "Authority" HESAPLANMIŞ property'si
// olmalı, örn: Authority => $"{Url?.TrimEnd('/')}/realms/{Realm}"
// Aşağıdaki kod bunun var olduğunu varsayıyor.
builder.Services
    .AddOptions<KeycloakOptions>()
    .Bind(builder.Configuration.GetSection(KeycloakOptions.SectionName))
    .ValidateDataAnnotations();

// Middleware kurulumu sırasında (henüz DI container hazır değilken)
// KeycloakOptions'a ihtiyacımız var; bu yüzden configuration'dan
// doğrudan da okuyoruz (yukarıdaki Options kaydı, controller'lar içinde
// IOptions<KeycloakOptions> enjekte etmek isteyenler içindir).
var keycloakOptions = builder.Configuration
    .GetSection(KeycloakOptions.SectionName)
    .Get<KeycloakOptions>()
    ?? throw new InvalidOperationException(
        "appsettings.json içinde \"Keycloak\" bölümü bulunamadı. " +
        "Url, Realm ve ClientId alanlarını doldurduğundan emin ol.");

if (string.IsNullOrWhiteSpace(keycloakOptions.Url) ||
    string.IsNullOrWhiteSpace(keycloakOptions.Realm))
{
    throw new InvalidOperationException(
        "Keycloak:Url ve Keycloak:Realm appsettings.json içinde tanımlı olmalı.");
}

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };

// ---------------------------------------------------------------------
// JWT Bearer Authentication (Keycloak)
// ---------------------------------------------------------------------
// Authority, Keycloak'ın bu realm için OIDC discovery/JWKS uç noktasını
// otomatik bulmasını sağlar; token imzası buradan doğrulanır. ASP.NET
// Core imzayı KENDİ doğrular — Keycloak'a her istekte tekrar sormaz
// (JWKS anahtarları cache'lenir).
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = keycloakOptions.Authority;

        // Audience doğrulaması: Keycloak token'ının "aud" claim'inde bu
        // API'nin client id'sinin bulunmasını zorunlu kılar. Eğer bu API
        // için Keycloak'ta ayrı bir client TANIMLANMADIYSA (yani SPA
        // client'ı kullanılıyorsa) bu satır token'ı REDDEDEBİLİR — o
        // durumda ValidateAudience = false yapıp sadece issuer
        // doğrulamasına güvenmen gerekebilir. Bu netleşene kadar
        // bilinçli bırakıldı (bkz. Adım 1 notu: "Bu API için Keycloak'ta
        // ayrı bir client oluşturulmuş mu?").
        options.Audience = keycloakOptions.ClientId;

        // Keycloak test/dev sunucusu geçerli bir HTTPS sertifikasına
        // sahip değilse (self-signed vb.) bu satırı GEÇİCİ olarak false
        // yapman gerekebilir. ÜRETİMDE MUTLAKA true KALMALI.
        options.RequireHttpsMetadata = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            // Sunucular arası saat farkına küçük bir tolerans.
            ClockSkew = TimeSpan.FromSeconds(30),
        };

        // Doğrulama hatalarını (özellikle geliştirme sırasında) konsola
        // yazdırır — "neden 401 alıyorum" sorusuna hızlı cevap verir.
        // ÜRETİMDE bu detaylı hata mesajlarının response'a SIZMADIĞINDAN
        // emin ol (aşağıda sadece loglanıyor, response'a yazılmıyor).
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("Keycloak.JwtBearer");
                logger.LogWarning(
                    context.Exception,
                    "JWT doğrulama başarısız oldu.");
                return Task.CompletedTask;
            },
        };
    });

// Keycloak realm rolleri "realm_access.roles" claim'i içinde gelir;
// standart .NET RoleClaimType bunu otomatik okumaz. Bu transformer,
// token içindeki realm rollerini uygulamanın bildiği rollere (frontend
// roleMapping.ts ile BİREBİR aynı eşleme) çevirip ClaimTypes.Role olarak
// ekler — böylece [Authorize(Roles="Yönetici")] ve RequireRole çalışır.
builder.Services.AddSingleton<IClaimsTransformation, KeycloakRoleClaimsTransformer>();

builder.Services.AddAuthorization(options =>
{
    // Frontend'deki RESTRICTED_PATH_ROLES tablosunun backend karşılığı.
    // İsimler auth/permissions.ts ile BİREBİR aynı tutulmalı.
    options.AddPolicy("Yonetici", p => p.RequireRole("Yönetici"));
    options.AddPolicy("YoneticiVeSupervisor", p => p.RequireRole("Yönetici", "Supervisor"));
});

// ---------------------------------------------------------------------
// CORS — frontend'in (Vite dev server, varsayılan localhost:5173) bu
// API'ye istek atabilmesi için. Üretimde allowedOrigins'i gerçek
// frontend domain'ine göre appsettings.json'da güncelle.
// ---------------------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Ses Kayitlari API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT access token. Example: 'Bearer {token}'"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseCors();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Ses Kayitlari API v1");
    c.EnablePersistAuthorization();
});

// SIRALAMA ÖNEMLİ: UseAuthentication her zaman UseAuthorization'dan
// ÖNCE gelmeli, aksi halde [Authorize] attribute'ları düzgün çalışmaz.
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Hızlı bir "backend ayakta mı" kontrolü — kimlik doğrulama gerektirmez.
// Bilerek [Authorize] YOK; frontend veya izleme araçları token olmadan
// da API'nin ayakta olup olmadığını kontrol edebilsin diye.
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }))
    .AllowAnonymous();

app.Run();