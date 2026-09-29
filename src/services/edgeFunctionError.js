function createRequestError(error, message) {
  const result = new Error(message)
  result.status = error?.context?.status ?? error?.status
  result.code = error?.code
  return result
}

export function getRequestError(error, message = 'Não foi possível concluir a solicitação. Tente novamente.') {
  return createRequestError(error, message)
}

export async function getEdgeFunctionError(
  error,
  message = 'Não foi possível concluir a solicitação. Tente novamente.',
) {
  return createRequestError(error, message)
}
