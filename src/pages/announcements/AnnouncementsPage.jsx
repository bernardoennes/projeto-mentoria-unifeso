import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  ChatCircleDots,
  MagnifyingGlass,
  PencilSimple,
  PaperPlaneTilt,
  PushPin,
  Trash,
  X,
} from '@phosphor-icons/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header.jsx'
import PageSubheader from '../../components/PageSubheader/PageSubheader.jsx'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import useAnnouncements from '../../hooks/useAnnouncements.js'
import { canManageCondominium } from '../../utils/permissions.js'
import styles from './AnnouncementsPage.module.css'

const COMMENT_CHARACTER_LIMIT = 200
const ANNOUNCEMENT_CHARACTER_LIMIT = 400
const ANNOUNCEMENTS_PER_BATCH = 8
const IMAGE_FILE_SIZE_LIMIT = 1024 * 1024
const ANNOUNCEMENT_PREVIEW_LIMIT = 100

function formatDate(dateValue) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue))
}

function countComments(comments) {
  return comments.length
}

function getAnnouncementPreview(body) {
  const normalizedBody = String(body ?? '').trim()

  if (normalizedBody.length <= ANNOUNCEMENT_PREVIEW_LIMIT) {
    return normalizedBody
  }

  return `${normalizedBody.slice(0, ANNOUNCEMENT_PREVIEW_LIMIT).trimEnd()}…`
}

function AnnouncementCard({ announcement, onTogglePinned, canManage, animationDelay }) {
  return (
    <article className={styles.announcementCard} style={{ animationDelay }}>
      <Link
        className={styles.cardOverlayLink}
        to={`/avisos/${announcement.id}`}
        aria-label={`Abrir aviso: ${announcement.title}`}
      />
      <div className={styles.cardTopline}>
        <span className={styles.category}>Aviso · Condomínio</span>
        {announcement.pinned && (
          <span className={styles.pinnedLabel}>
            <PushPin size={14} weight="fill" aria-hidden="true" />
            Fixado
          </span>
        )}
        {canManage && (
          <button
            type="button"
            className={styles.iconButton}
            aria-label={announcement.pinned ? 'Desafixar aviso' : 'Fixar aviso'}
            title={announcement.pinned ? 'Desafixar aviso' : 'Fixar aviso'}
            onClick={() => onTogglePinned(announcement)}
          >
            <PushPin size={17} weight={announcement.pinned ? 'fill' : 'regular'} aria-hidden="true" />
          </button>
        )}
      </div>
      <h2>
        {announcement.title}
      </h2>
      <p className={styles.cardExcerpt}>{getAnnouncementPreview(announcement.body)}</p>
      <div className={styles.cardFooter}>
        <span>{announcement.author?.name ?? 'Morador'} · {formatDate(announcement.createdAt)}</span>
        <span className={styles.commentLink}>
          <ChatCircleDots size={17} aria-hidden="true" />
          {countComments(announcement.comments)} comentários
        </span>
      </div>
    </article>
  )
}

function PublishDialog({
  onClose,
  onPublish,
  author,
  error,
  isSaving,
  initialAnnouncement = null,
}) {
  const [title, setTitle] = useState(initialAnnouncement?.title ?? '')
  const [body, setBody] = useState(initialAnnouncement?.body ?? '')
  const [image, setImage] = useState(initialAnnouncement?.image
    ? { data: initialAnnouncement.image, name: 'Imagem atual' }
    : null)
  const [isReadingImage, setIsReadingImage] = useState(false)
  const [formError, setFormError] = useState('')
  const imageInputRef = useRef(null)

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    setFormError('')

    if (!file) {
      setImage(null)
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setImage(null)
      setFormError('Escolha uma imagem JPG, PNG, WebP ou GIF.')
      event.target.value = ''
      return
    }

    if (file.size > IMAGE_FILE_SIZE_LIMIT) {
      setImage(null)
      setFormError('A imagem deve ter no máximo 1 MB.')
      event.target.value = ''
      return
    }

    setImage(null)
    setIsReadingImage(true)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage({ data: reader.result, name: file.name })
      } else {
        setFormError('Não foi possível carregar a imagem selecionada.')
      }
      setIsReadingImage(false)
    }
    reader.onerror = () => {
      setFormError('Não foi possível carregar a imagem selecionada.')
      setIsReadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  const submit = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!title.trim() || !body.trim()) {
      setFormError('Preencha o título e o conteúdo do aviso.')
      return
    }
    if (body.length > ANNOUNCEMENT_CHARACTER_LIMIT) {
      setFormError(`O aviso deve ter no máximo ${ANNOUNCEMENT_CHARACTER_LIMIT} caracteres.`)
      return
    }

    try {
      await onPublish({
        title,
        body,
        image: image?.data ?? null,
        author,
      })
      onClose()
    } catch (publishError) {
      setFormError(publishError?.message ?? 'Não foi possível publicar o aviso.')
    }
  }

  return (
    <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        className={styles.publishDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-title"
      >
        <div className={styles.dialogHeading}>
          <div>
            <span className={styles.category}>{initialAnnouncement ? 'Editar comunicado' : 'Área do síndico'}</span>
            <h2 id="publish-title">{initialAnnouncement ? 'Editar aviso' : 'Publicar aviso'}</h2>
          </div>
          <button type="button" className={styles.iconButton} aria-label="Fechar" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <form className={styles.publishForm} onSubmit={submit}>
          <label>
            Título
            <input
              autoFocus
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Manutenção da piscina"
              required
            />
          </label>
          <label>
            Conteúdo
            <textarea
              rows={6}
              maxLength={ANNOUNCEMENT_CHARACTER_LIMIT}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Escreva as informações que os moradores precisam saber."
              required
            />
            <span className={styles.characterCount}>
              {body.length}/{ANNOUNCEMENT_CHARACTER_LIMIT} caracteres
            </span>
          </label>
          <label>
            Imagem (opcional)
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
            />
            <span className={styles.fieldHint}>Uma imagem JPG, PNG, WebP ou GIF, até 1 MB.</span>
          </label>
          {image && (
            <div className={styles.imagePreview}>
              <img src={image.data} alt="Prévia da imagem do aviso" />
              <button
                type="button"
                className={styles.textButton}
                onClick={() => {
                  setImage(null)
                  if (imageInputRef.current) imageInputRef.current.value = ''
                }}
              >
                Remover imagem
              </button>
            </div>
          )}
          {(formError || error) && <p className={styles.formError} role="alert">{formError || error}</p>}
          <div className={styles.dialogActions}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>Cancelar</button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSaving || isReadingImage}
            >
              {isSaving
                ? initialAnnouncement ? 'Salvando…' : 'Publicando…'
                : isReadingImage
                  ? 'Carregando imagem…'
                  : initialAnnouncement ? 'Salvar alterações' : 'Publicar aviso'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function CommentItem({ item, comments, onReply, onEdit, onDelete, currentUserId }) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item.body)
  const replies = comments.filter((comment) => comment.parentId === item.id)
  const canEdit = Boolean(currentUserId)
    && String(item.author?.id ?? '') === String(currentUserId)

  const submitReply = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await onReply(item.id, replyText)
      setReplyText('')
      setIsReplying(false)
    } catch (replyError) {
      setError(replyError?.message ?? 'Não foi possível enviar a resposta.')
    }
  }

  const submitEdit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await onEdit(item.id, editText)
      setIsEditing(false)
    } catch (editError) {
      setError(editError?.message ?? 'Não foi possível editar o comentário.')
    }
  }

  const deleteComment = async () => {
    if (!window.confirm('Excluir este comentário e todas as respostas vinculadas?')) return

    setError('')
    try {
      await onDelete(item.id)
    } catch (deleteError) {
      setError(deleteError?.message ?? 'Não foi possível excluir o comentário.')
    }
  }

  return (
    <article className={styles.commentItem}>
      <span className={styles.avatar} aria-hidden="true">
        {(item.author?.name ?? 'M').trim().charAt(0).toUpperCase()}
      </span>
      <div className={styles.commentContent}>
        <strong>{item.author?.name ?? 'Morador'}</strong>
        <span className={styles.commentMeta}>
          {item.author?.accessType ?? 'Morador'} · {formatDate(item.createdAt)}
        </span>
        {isEditing ? (
          <form className={styles.commentEditForm} onSubmit={submitEdit}>
            <textarea
              rows={3}
              maxLength={COMMENT_CHARACTER_LIMIT}
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              required
            />
            <span className={styles.characterCount}>
              {editText.length}/{COMMENT_CHARACTER_LIMIT} caracteres
            </span>
            <div className={styles.inlineActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => {
                setEditText(item.body)
                setIsEditing(false)
              }}>
                Cancelar
              </button>
              <button type="submit" className={styles.primaryButton}>Salvar</button>
            </div>
          </form>
        ) : (
          <>
            <p>{item.body}</p>
            <div className={styles.commentActions}>
              <button
                type="button"
                className={styles.replyButton}
                onClick={() => setIsReplying((current) => !current)}
              >
                {isReplying ? 'Cancelar resposta' : 'Responder'}
              </button>
              {canEdit && (
                <>
                  <button type="button" className={styles.replyButton} onClick={() => {
                    setEditText(item.body)
                    setIsEditing(true)
                  }}>
                    <PencilSimple size={14} aria-hidden="true" />
                    Editar
                  </button>
                  <button type="button" className={styles.dangerTextButton} onClick={deleteComment}>
                    <Trash size={14} aria-hidden="true" />
                    Excluir
                  </button>
                </>
              )}
            </div>
          </>
        )}
        {error && <p className={styles.formError} role="alert">{error}</p>}
        {isReplying && (
          <form className={styles.replyForm} onSubmit={submitReply}>
            <textarea
              rows={2}
              maxLength={COMMENT_CHARACTER_LIMIT}
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder="Escreva uma resposta…"
              required
            />
            <span className={styles.characterCount}>
              {replyText.length}/{COMMENT_CHARACTER_LIMIT} caracteres
            </span>
            {error && <p className={styles.formError} role="alert">{error}</p>}
            <button type="submit" className={styles.primaryButton}>Enviar resposta</button>
          </form>
        )}
        {replies.map((reply) => (
          <CommentItem
            key={reply.id}
            item={reply}
            comments={comments}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </article>
  )
}

function CommentComposer({ onSubmit, placeholder = 'Escreva um comentário…' }) {
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await onSubmit(body)
      setBody('')
    } catch (submitError) {
      setError(submitError?.message ?? 'Não foi possível enviar o comentário.')
    }
  }

  return (
    <form className={styles.commentComposer} onSubmit={submit}>
      <textarea
        rows={2}
        maxLength={COMMENT_CHARACTER_LIMIT}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={placeholder}
        required
      />
      <span className={styles.characterCount}>
        {body.length}/{COMMENT_CHARACTER_LIMIT} caracteres
      </span>
      {error && <p className={styles.formError} role="alert">{error}</p>}
      <div className={styles.composerActions}>
        <button type="submit" className={styles.primaryButton} aria-label="Enviar comentário">
          <PaperPlaneTilt size={17} weight="fill" aria-hidden="true" />
          Enviar
        </button>
      </div>
    </form>
  )
}

export default function AnnouncementsPage() {
  const { user, membership } = useAuth()
  const { noticeId } = useParams()
  const navigate = useNavigate()
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [isPublishOpen, setIsPublishOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [visibleCount, setVisibleCount] = useState(ANNOUNCEMENTS_PER_BATCH)
  const contentBodyRef = useRef(null)
  const loadMoreRef = useRef(null)
  const organisationId = membership?.organisation_id
  const canManage = canManageCondominium(membership)
  const author = {
    id: user?.id ?? null,
    name: user?.name ?? 'Morador',
    accessType: membership?.access_type ?? 'Morador',
  }
  const {
    announcements,
    isLoading,
    error,
    reload,
    publish,
    saveAnnouncement,
    removeAnnouncement,
    togglePinned,
    comment,
    saveComment,
    removeComment,
  } = useAnnouncements(organisationId)
  const announcement = announcements.find((item) => item.id === noticeId)

  const filteredAnnouncements = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')

    const results = announcements.filter((item) => {
      if (filter === 'pinned' && !item.pinned) return false

      return !normalizedSearch
        || `${item.title} ${item.body}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
    })

    return filter === 'recent'
      ? results.sort((first, second) => second.createdAt.localeCompare(first.createdAt))
      : results
  }, [announcements, filter, search])
  const visibleAnnouncements = filteredAnnouncements.slice(0, visibleCount)

  useEffect(() => {
    const sentinel = loadMoreRef.current
    const scrollContainer = contentBodyRef.current

    if (
      !sentinel
      || !scrollContainer
      || visibleCount >= filteredAnnouncements.length
      || typeof IntersectionObserver === 'undefined'
    ) {
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleCount((count) => Math.min(
          count + ANNOUNCEMENTS_PER_BATCH,
          filteredAnnouncements.length,
        ))
      }
    }, {
      root: scrollContainer,
      threshold: 0.1,
    })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [filteredAnnouncements.length, visibleCount])

  const handleTogglePinned = async (item) => {
    setActionError('')
    try {
      await togglePinned(item.id, !item.pinned)
    } catch (pinError) {
      setActionError(pinError?.message ?? 'Não foi possível atualizar o aviso.')
    }
  }

  const handlePublish = async (values) => {
    setIsSaving(true)
    setActionError('')
    try {
      const created = await publish(values)
      navigate(`/avisos/${created.id}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAnnouncement = async (values) => {
    setIsSaving(true)
    setActionError('')
    try {
      await saveAnnouncement(editingAnnouncement.id, values, author.id)
      setEditingAnnouncement(null)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAnnouncement = async () => {
    if (!window.confirm('Excluir este aviso e toda a conversa? Esta ação não pode ser desfeita.')) {
      return
    }

    setActionError('')
    try {
      await removeAnnouncement(announcement.id, author.id)
      navigate('/avisos')
    } catch (deleteError) {
      setActionError(deleteError?.message ?? 'Não foi possível excluir o aviso.')
    }
  }

  const handleComment = async (targetId, body, parentId = null) => (
    comment(targetId, { body, parentId, author })
  )
  const handleEditComment = async (targetId, body) => (
    saveComment(announcement.id, targetId, body, author.id)
  )
  const handleDeleteComment = async (targetId) => (
    removeComment(announcement.id, targetId, author.id)
  )

  const overlayClass = isSidebarExpanded ? ` ${styles.overlayVisible}` : ''

  return (
    <div className={styles.pageShell}>
      <Header
        userName={author.name}
        accessType={author.accessType}
        navigationExpanded={isSidebarExpanded}
        onNavigationToggle={setIsSidebarExpanded}
      />
      <div className={styles.pageBody}>
        <button
          type="button"
          className={`${styles.pageOverlay}${overlayClass}`}
          aria-label="Fechar navegação"
          aria-hidden={!isSidebarExpanded}
          tabIndex={isSidebarExpanded ? 0 : -1}
          onClick={() => setIsSidebarExpanded(false)}
        />
        <Sidebar
          expanded={isSidebarExpanded}
          onExpand={() => setIsSidebarExpanded(true)}
          onCollapse={() => setIsSidebarExpanded(false)}
          activeId="avisos"
          userName={author.name}
          accessType={author.accessType}
        />
        <main className={styles.content}>
          {!noticeId && (
            <PageSubheader
              className={styles.pageSubheader}
              title="Avisos do condomínio"
              subtitle="Comunicados e informações importantes para os moradores."
              backTo="/"
              backLabel="Voltar para Home"
            />
          )}

          <div
            className={`${styles.contentBody}${noticeId ? ` ${styles.detailContentBody}` : ''}`}
            ref={contentBodyRef}
          >
            {!noticeId && (
              <>
                <section className={styles.listToolbar} aria-label="Buscar e filtrar avisos">
                  <label className={styles.searchField}>
                    <MagnifyingGlass size={19} aria-hidden="true" />
                    <span className={styles.visuallyHidden}>Buscar avisos</span>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value)
                        setVisibleCount(ANNOUNCEMENTS_PER_BATCH)
                      }}
                      placeholder="Buscar por título ou conteúdo"
                    />
                  </label>
                  <label className={styles.filterField}>
                    <span className={styles.visuallyHidden}>Filtrar avisos</span>
                    <select
                      value={filter}
                      onChange={(event) => {
                        setFilter(event.target.value)
                        setVisibleCount(ANNOUNCEMENTS_PER_BATCH)
                      }}
                    >
                      <option value="all">Todos os avisos</option>
                      <option value="recent">Mais recentes</option>
                      <option value="pinned">Fixados</option>
                    </select>
                  </label>
                  {canManage && (
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => setIsPublishOpen(true)}
                    >
                      <Bell size={17} weight="bold" aria-hidden="true" />
                      Publicar aviso
                    </button>
                  )}
                </section>
                <div className={styles.resultsHeader}>
                  <h2>Comunicados</h2>
                  {!isLoading && <span>{filteredAnnouncements.length} {filteredAnnouncements.length === 1 ? 'aviso' : 'avisos'}</span>}
                </div>
                {actionError && <p className={styles.errorMessage} role="alert">{actionError}</p>}
                {error && (
                  <div className={styles.errorMessage} role="alert">
                    <span>{error}</span>
                    <button type="button" className={styles.textButton} onClick={reload}>Tentar novamente</button>
                  </div>
                )}
                {isLoading && <p className={styles.emptyState}>Carregando avisos…</p>}
                {!isLoading && !error && filteredAnnouncements.length > 0 && (
                  <div className={styles.announcementList}>
                    {visibleAnnouncements.map((item, index) => (
                      <AnnouncementCard
                        key={item.id}
                        announcement={item}
                        canManage={canManage}
                        onTogglePinned={handleTogglePinned}
                        animationDelay={`${(index % ANNOUNCEMENTS_PER_BATCH) * 55}ms`}
                      />
                    ))}
                    {visibleCount < filteredAnnouncements.length && (
                      <div ref={loadMoreRef} className={styles.loadMoreSentinel} aria-live="polite">
                        Carregando mais avisos…
                      </div>
                    )}
                  </div>
                )}
                {!isLoading && !error && filteredAnnouncements.length === 0 && (
                  <section className={styles.emptyState}>
                    <span className={styles.emptyIcon}><Bell size={24} aria-hidden="true" /></span>
                    <h2>{search || filter === 'pinned' ? 'Nenhum aviso encontrado' : 'Ainda não há avisos'}</h2>
                    <p>
                      {search || filter === 'pinned'
                        ? 'Tente ajustar a busca ou o filtro selecionado.'
                        : canManage
                          ? 'Publique o primeiro comunicado para os moradores do condomínio.'
                          : 'Quando um novo comunicado for publicado, ele aparecerá aqui.'}
                    </p>
                    {canManage && !search && filter !== 'pinned' && (
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => setIsPublishOpen(true)}
                      >
                        Publicar primeiro aviso
                      </button>
                    )}
                  </section>
                )}
              </>
            )}

            {noticeId && isLoading && <p className={styles.emptyState}>Carregando aviso…</p>}
            {noticeId && error && (
              <div className={styles.errorMessage} role="alert">
                <span>{error}</span>
                <button type="button" className={styles.textButton} onClick={reload}>Tentar novamente</button>
              </div>
            )}
            {noticeId && !isLoading && !error && !announcement && (
              <section className={styles.emptyState}>
                <h2>Aviso não encontrado</h2>
                <p>Ele pode ter sido removido ou pertencer a outro condomínio.</p>
                <Link to="/avisos" className={styles.secondaryButton}>Ver todos os avisos</Link>
              </section>
            )}
            {noticeId && announcement && (
              <div className={styles.detailLayout}>
                <article className={styles.noticePost}>
                  <div className={styles.cardTopline}>
                    <span className={styles.category}>Aviso · Condomínio</span>
                    {announcement.pinned && (
                      <span className={styles.pinnedLabel}>
                        <PushPin size={14} weight="fill" aria-hidden="true" />
                        Fixado
                      </span>
                    )}
                    <div className={styles.noticeActions}>
                      {canManage && (
                        <button
                          type="button"
                          className={styles.iconButton}
                          aria-label={announcement.pinned ? 'Desafixar aviso' : 'Fixar aviso'}
                          title={announcement.pinned ? 'Desafixar aviso' : 'Fixar aviso'}
                          onClick={() => handleTogglePinned(announcement)}
                        >
                          <PushPin size={17} weight={announcement.pinned ? 'fill' : 'regular'} aria-hidden="true" />
                        </button>
                      )}
                      {announcement.author?.id
                        && String(announcement.author.id) === String(author.id)
                        && (
                        <>
                          <button
                            type="button"
                            className={styles.iconButton}
                            aria-label="Editar aviso"
                            title="Editar aviso"
                            onClick={() => setEditingAnnouncement(announcement)}
                          >
                            <PencilSimple size={17} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconButton} ${styles.deleteIconButton}`}
                            aria-label="Excluir aviso"
                            title="Excluir aviso"
                            onClick={handleDeleteAnnouncement}
                          >
                            <Trash size={17} aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <h2>{announcement.title}</h2>
                  <p className={styles.postMeta}>
                    {announcement.author?.name ?? 'Morador'} · publicado em {formatDate(announcement.createdAt)}
                  </p>
                  <p className={styles.postBody}>{announcement.body}</p>
                  {announcement.image && (
                    <img
                      className={styles.postImage}
                      src={announcement.image}
                      alt={`Imagem do aviso: ${announcement.title}`}
                    />
                  )}
                  <div className={styles.postFooter}>
                    <ChatCircleDots size={17} aria-hidden="true" />
                    {countComments(announcement.comments)} comentários
                  </div>
                </article>

                <section className={styles.conversation} aria-labelledby="conversation-title">
                  <div className={styles.conversationHeading}>
                    <h2 id="conversation-title">Conversa</h2>
                    <span>{countComments(announcement.comments)} comentários</span>
                  </div>
                  <div className={styles.commentList}>
                    {announcement.comments
                      .filter((item) => !item.parentId)
                      .map((item) => (
                        <CommentItem
                          key={item.id}
                          item={item}
                          comments={announcement.comments}
                          onReply={(parentId, body) => handleComment(announcement.id, body, parentId)}
                          onEdit={handleEditComment}
                          onDelete={handleDeleteComment}
                          currentUserId={author.id}
                        />
                      ))}
                    {announcement.comments.length === 0 && (
                      <p className={styles.noComments}>Ainda não há comentários. Seja a primeira pessoa a participar.</p>
                    )}
                  </div>
                  <CommentComposer onSubmit={(body) => handleComment(announcement.id, body)} />
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
      {isPublishOpen && (
        <PublishDialog
          onClose={() => setIsPublishOpen(false)}
          onPublish={handlePublish}
          author={author}
          error={actionError}
          isSaving={isSaving}
        />
      )}
      {editingAnnouncement && (
        <PublishDialog
          key={editingAnnouncement.id}
          onClose={() => setEditingAnnouncement(null)}
          onPublish={handleSaveAnnouncement}
          author={author}
          error={actionError}
          isSaving={isSaving}
          initialAnnouncement={editingAnnouncement}
        />
      )}
    </div>
  )
}
