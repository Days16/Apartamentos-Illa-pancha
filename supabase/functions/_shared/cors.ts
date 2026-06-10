const ALLOWED_ORIGINS = [
    "https://apartamentosillapancha.com",
    "https://www.apartamentosillapancha.com",
    "http://localhost:5173",
    "https://localhost:5173",
];

export function getCorsHeaders(req: Request): Record<string, string> {
    const origin = req.headers.get("origin") ?? "";
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : "",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Vary": "Origin",
    };
}
