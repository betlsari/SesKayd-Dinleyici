using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SesKayitlariApi.Controllers;

// Frontend'deki mock veriyi (App.tsx -> mockCompanies) besleyecek gerçek
// endpoint. RecordsController.Support.cs içindeki ICompanyAccessService
// ve CompanyDto'ya bağımlıdır.
[ApiController]
[Route("api/companies")]
[Authorize] // her endpoint en az geçerli bir token ister
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public class CompaniesController : ControllerBase
{
    private readonly ICompanyAccessService _companyAccessService;
    private readonly ILogger<CompaniesController> _logger;

    public CompaniesController(
        ICompanyAccessService companyAccessService,
        ILogger<CompaniesController> logger)
    {
        _companyAccessService = companyAccessService;
        _logger = logger;
    }

    // GET /api/companies
    // Kullanıcının rolü/atamasına göre erişebildiği şirketleri döner.
    // Bu ASLA "tüm şirketler" listesi DEĞİLDİR — sadece bu kullanıcıya
    // atanmış olanlar (bkz. App.tsx başındaki TODO notu: "bu bir iş/yetki
    // verisidir ve Keycloak token'ı SADECE kimliği doğrular").
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CompanyDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAccessibleCompanies(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var companies = await _companyAccessService.GetAccessibleCompaniesAsync(
            userId, cancellationToken);

        // Boş liste normal bir durumdur (henüz hiçbir şirkete atanmamış
        // kullanıcı) — 404/403 DEĞİL, 200 + boş dizi dönüyoruz. Frontend
        // tarafında bu durumun nasıl ele alınacağı (örn. "şirketiniz yok"
        // mesajı) App.tsx/Topbar.tsx tarafında ayrıca ele alınmalı; şu an
        // App.tsx mockCompanies[0]'ı varsayılan seçiyor, bu varsayım
        // gerçek veriyle KIRILABİLİR (boş dizi -> undefined company).
        if (companies.Count == 0)
        {
            _logger.LogInformation(
                "Kullanıcının erişebildiği şirket bulunamadı: userId={UserId}",
                userId);
        }

        return Ok(companies);
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value;
    }
}