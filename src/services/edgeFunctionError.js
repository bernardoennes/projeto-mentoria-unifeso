export async function getEdgeFunctionError(error) {
  const status = error?.context?.status ?? error?.status
  let message = error?.message

  if (error?.name === 'FunctionsFetchError') {
    message = 'A chamada não chegou à Edge Function. O navegador bloqueou o POST; verifique se o preflight OPTIONS responde com os cabeçalhos CORS para esta origem e para authorization, apikey, x-client-info e content-type.'
  }

  if (typeof error?.context?.clone === 'function') {
    try {
      const responseBody = await error.context.clone().json()
      message = responseBody?.message ?? responseBody?.error ?? message
    } catch {
      // Keep the SDK message when the response has no JSON body.
    }
  }

  const result = new Error(message ?? 'A Edge Function não conseguiu concluir a solicitação.')
  result.status = status
  return result
}
