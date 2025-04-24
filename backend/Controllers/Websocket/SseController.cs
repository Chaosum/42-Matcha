using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace backend.Controllers.Websocket;

public class SseController(ISseService sseService) : ControllerBase
{
    [SwaggerIgnore]
    [Route("/sse" + "/{token}")]
    public async Task Get(string token)
    {
        if (HttpContext.WebSockets.IsWebSocketRequest)
        {
            using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
            try {
                await sseService.HandleWebsocket(webSocket, token);
            } catch (Exception e) {
                Console.WriteLine(e);
            }
        }
        else
        {
            HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        }
    }
}