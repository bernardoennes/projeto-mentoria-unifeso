import { useCallback, useEffect, useRef, useState } from 'react'
import {
  addAnnouncementComment,
  createAnnouncement,
  deleteAnnouncement,
  deleteAnnouncementComment,
  fetchAnnouncements,
  setAnnouncementPinned,
  updateAnnouncementComment,
  updateAnnouncementContent,
} from '../services/announcementService.js'

export default function useAnnouncements(organisationId) {
  const requestId = useRef(0)
  const [state, setState] = useState({
    organisationId: '',
    announcements: [],
    isLoading: Boolean(organisationId),
    error: '',
  })

  const reload = useCallback(async () => {
    requestId.current += 1
    const currentRequestId = requestId.current

    if (!organisationId) {
      setState({ organisationId: '', announcements: [], isLoading: false, error: '' })
      return
    }

    setState((current) => ({
      ...current,
      organisationId: String(organisationId),
      isLoading: true,
      error: '',
    }))

    try {
      const announcements = await fetchAnnouncements(organisationId)
      if (currentRequestId === requestId.current) {
        setState({
          organisationId: String(organisationId),
          announcements,
          isLoading: false,
          error: '',
        })
      }
    } catch (error) {
      if (currentRequestId === requestId.current) {
        setState({
          organisationId: String(organisationId),
          announcements: [],
          isLoading: false,
          error: error?.message ?? 'Não foi possível carregar os avisos.',
        })
      }
    }
  }, [organisationId])

  useEffect(() => {
    queueMicrotask(reload)
  }, [reload])

  const saveUpdatedAnnouncement = (updatedAnnouncement) => {
    setState((current) => ({
      ...current,
      announcements: current.announcements
        .map((announcement) => (
          announcement.id === updatedAnnouncement.id ? updatedAnnouncement : announcement
        ))
        .sort((first, second) => (
          Number(second.pinned) - Number(first.pinned)
          || second.createdAt.localeCompare(first.createdAt)
        )),
    }))

    return updatedAnnouncement
  }

  const publish = async (values) => {
    const announcement = await createAnnouncement(organisationId, values)
    setState((current) => ({
      ...current,
      announcements: [announcement, ...current.announcements].sort((first, second) => (
        Number(second.pinned) - Number(first.pinned)
        || second.createdAt.localeCompare(first.createdAt)
      )),
    }))
    return announcement
  }

  const saveAnnouncement = async (announcementId, values, userId) => (
    saveUpdatedAnnouncement(await updateAnnouncementContent(
      organisationId,
      announcementId,
      values,
      userId,
    ))
  )

  const removeAnnouncement = async (announcementId, userId) => {
    await deleteAnnouncement(organisationId, announcementId, userId)
    setState((current) => ({
      ...current,
      announcements: current.announcements.filter((item) => item.id !== announcementId),
    }))
  }

  const togglePinned = async (announcementId, pinned) => (
    saveUpdatedAnnouncement(await setAnnouncementPinned(
      organisationId,
      announcementId,
      pinned,
    ))
  )

  const comment = async (announcementId, values) => (
    saveUpdatedAnnouncement(await addAnnouncementComment(
      organisationId,
      announcementId,
      values,
    ))
  )

  const saveComment = async (announcementId, commentId, body, userId) => (
    saveUpdatedAnnouncement(await updateAnnouncementComment(
      organisationId,
      announcementId,
      commentId,
      body,
      userId,
    ))
  )

  const removeComment = async (announcementId, commentId, userId) => (
    saveUpdatedAnnouncement(await deleteAnnouncementComment(
      organisationId,
      announcementId,
      commentId,
      userId,
    ))
  )

  const isCurrentOrganisation = state.organisationId === String(organisationId ?? '')

  return {
    announcements: isCurrentOrganisation ? state.announcements : [],
    isLoading: Boolean(organisationId) && (!isCurrentOrganisation || state.isLoading),
    error: isCurrentOrganisation ? state.error : '',
    reload,
    publish,
    saveAnnouncement,
    removeAnnouncement,
    togglePinned,
    comment,
    saveComment,
    removeComment,
  }
}
