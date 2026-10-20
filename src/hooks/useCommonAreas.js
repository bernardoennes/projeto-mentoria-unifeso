import { useEffect, useState } from 'react'
import { fetchCommonAreas } from '../services/commonAreaService.js'

export default function useCommonAreas(organisationId) {
  const [areas, setAreas] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [requestId, setRequestId] = useState(0)

  useEffect(() => {
    let isCurrent = true

    async function loadAreas() {
      setIsLoading(true)
      setError('')

      try {
        const result = await fetchCommonAreas(organisationId)
        if (isCurrent) {
          setAreas(result)
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError?.message ?? 'Não foi possível carregar as áreas comuns.')
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    loadAreas()
    return () => {
      isCurrent = false
    }
  }, [organisationId, requestId])

  return { areas, error, isLoading, retry: () => setRequestId((id) => id + 1) }
}
