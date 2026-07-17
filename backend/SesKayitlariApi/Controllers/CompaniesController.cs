using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace SesKayitlariApi.Controllers;

[ApiController]
[Route("api/companies")]
[Authorize]
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
    // Topbar/RecordsFilterForm şirket seçicileri bunu kullanır. TÜM
    // roller çağırabilir.
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

        if (companies.Count == 0)
        {
            _logger.LogInformation(
                "Kullanıcının erişebildiği şirket bulunamadı: userId={UserId}",
                userId);
        }

        return Ok(companies);
    }

    // GET /api/companies/all
    // SİSTEMDEKİ TÜM şirketleri döner (kullanıcının atamalarına
    // bakmaksızın) — SADECE Yönetici. "Şirketler" yönetim sayfası
    // (/sirketler) bunu kullanır. Yukarıdaki GetAccessibleCompanies
    // İLE KARIŞTIRILMAMALI.
    [HttpGet("all")]
    [Authorize(Policy = "Yonetici")]
    [ProducesResponseType(typeof(IReadOnlyList<CompanyDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAllCompanies(CancellationToken cancellationToken)
    {
        var companies = await _companyAccessService.GetAllCompaniesAsync(cancellationToken);
        return Ok(companies);
    }

    // POST /api/companies
    [HttpPost]
    [Authorize(Policy = "Yonetici")]
    [ProducesResponseType(typeof(CompanyDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateCompany(
        [FromBody] CreateCompanyRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request?.Name))
        {
            return BadRequest(new { message = "Şirket adı zorunludur." });
        }

        var company = await _companyAccessService.CreateCompanyAsync(
            request.Name.Trim(), cancellationToken);

        _logger.LogInformation(
            "Şirket oluşturuldu: companyId={CompanyId}, byUserId={UserId}",
            company.Id, GetCurrentUserId());

        return CreatedAtAction(nameof(GetAllCompanies), company);
    }

    // PUT /api/companies/{id}
    [HttpPut("{id:int}")]
    [Authorize(Policy = "Yonetici")]
    [ProducesResponseType(typeof(CompanyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCompany(
        int id,
        [FromBody] UpdateCompanyRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request?.Name))
        {
            return BadRequest(new { message = "Şirket adı zorunludur." });
        }

        var updated = await _companyAccessService.UpdateCompanyAsync(
            id, request.Name.Trim(), cancellationToken);
        if (updated is null)
        {
            return NotFound();
        }

        _logger.LogInformation(
            "Şirket güncellendi: companyId={CompanyId}, byUserId={UserId}",
            id, GetCurrentUserId());

        return Ok(updated);
    }

    // DELETE /api/companies/{id}
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "Yonetici")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteCompany(int id, CancellationToken cancellationToken)
    {
        try
        {
            var deleted = await _companyAccessService.DeleteCompanyAsync(id, cancellationToken);
            if (!deleted)
            {
                return NotFound();
            }
        }
        catch (DbUpdateException ex)
        {
            // FK Restrict: bu şirkete ait CallRecords varken silinemez
            // (bkz. AppDbContext.cs -> CallRecordEntity ilişki notu:
            // "yanlışlıkla cascade delete ile ses kayıtlarının
            // kaybolmasını engeller").
            _logger.LogWarning(ex,
                "Şirket silinemedi (ilişkili kayıtlar var): companyId={CompanyId}", id);
            return Conflict(new
            {
                message = "Bu şirkete ait ses kayıtları bulunduğu için şirket silinemez.",
            });
        }

        _logger.LogInformation(
            "Şirket silindi: companyId={CompanyId}, byUserId={UserId}",
            id, GetCurrentUserId());

        return NoContent();
    }

    // GET /api/companies/{id}/assignments
    [HttpGet("{id:int}/assignments")]
    [Authorize(Policy = "Yonetici")]
    [ProducesResponseType(typeof(IReadOnlyList<UserCompanyAssignmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAssignments(int id, CancellationToken cancellationToken)
    {
        var assignments = await _companyAccessService.GetCompanyAssignmentsAsync(id, cancellationToken);
        return Ok(assignments);
    }

    // POST /api/companies/{id}/assignments
    [HttpPost("{id:int}/assignments")]
    [Authorize(Policy = "Yonetici")]
    [ProducesResponseType(typeof(UserCompanyAssignmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignUser(
        int id,
        [FromBody] AssignUserRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request?.UserId))
        {
            return BadRequest(new { message = "userId zorunludur." });
        }

        var assignment = await _companyAccessService.AssignUserAsync(
            id, request.UserId.Trim(), cancellationToken);
        if (assignment is null)
        {
            return NotFound(new { message = "Şirket bulunamadı." });
        }

        _logger.LogInformation(
            "Kullanıcı şirkete atandı: companyId={CompanyId}, assignedUserId={AssignedUserId}, byUserId={ByUserId}",
            id, request.UserId, GetCurrentUserId());

        return CreatedAtAction(nameof(GetAssignments), new { id }, assignment);
    }

    // DELETE /api/companies/{id}/assignments/{userId}
    [HttpDelete("{id:int}/assignments/{userId}")]
    [Authorize(Policy = "Yonetici")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnassignUser(
        int id,
        string userId,
        CancellationToken cancellationToken)
    {
        var removed = await _companyAccessService.UnassignUserAsync(id, userId, cancellationToken);
        if (!removed)
        {
            return NotFound();
        }

        _logger.LogInformation(
            "Kullanıcının şirket ataması kaldırıldı: companyId={CompanyId}, unassignedUserId={UnassignedUserId}, byUserId={ByUserId}",
            id, userId, GetCurrentUserId());

        return NoContent();
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value;
    }
}