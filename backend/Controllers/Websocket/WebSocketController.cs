using backend.Services;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace backend.Controllers.Websocket;

public class WebSocketController(IWebSocketService webSocketService) : ControllerBase
{
    [SwaggerIgnore]
    [Route("/ws")]
    public async Task Get()
    {
        if (HttpContext.WebSockets.IsWebSocketRequest)
        {
            using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
            try {
                await webSocketService.HandleWebsocket(webSocket);
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