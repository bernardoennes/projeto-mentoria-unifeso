import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, Plus, PencilSimple, Paperclip } from '@phosphor-icons/react'
import Header from '../../components/Header/Header.jsx'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabase'

export default function Tickets() {
  const navigate = useNavigate()
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const { user, membership } = useAuth()

  const userName = user?.name ?? 'Morador'
  const accessType = membership?.access_type ?? 'Não definido'

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFiltro, setStatusFiltro] = useState('Todos')
  const [periodoFiltro, setPeriodoFiltro] = useState('30')
  const [termoBusca, setTermoBusca] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)

  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false)

  const [novoAssunto, setNovoAssunto] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('Manutenção Predial')
  const [novoLocal, setNovoLocal] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')

  const fetchTickets = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar chamados:', error.message)
    } else {
      setTickets(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    if (!novoAssunto.trim()) return

    const generatedCode = `#CH-${Math.floor(1000 + Math.random() * 9000)}`

    const newTicketData = {
      code: generatedCode,
      assunto: novoAssunto,
      solicitacao: accessType === 'morador' ? 'Morador' : 'Administração',
      categoria: novaCategoria,
      local: novoLocal,
      situacao: 'Em aberto',
      descricao: novaDescricao
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert([newTicketData])
      .select()

    if (error) {
      alert(`Erro ao criar chamado: ${error.message}`)
    } else if (data) {
      setTickets([data[0], ...tickets])
      setIsNewTicketModalOpen(false)
      setNovoAssunto('')
      setNovoLocal('')
      setNovaDescricao('')
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket) return

    const { error } = await supabase
      .from('tickets')
      .update({ situacao: newStatus })
      .eq('id', selectedTicket.id)

    if (error) {
      alert(`Erro ao atualizar status: ${error.message}`)
    } else {
      setTickets(prev =>
        prev.map(t => (t.id === selectedTicket.id ? { ...t, situacao: newStatus } : t))
      )
      setSelectedTicket(null)
    }
  }

  const ticketsFiltrados = tickets.filter(t => {
    const combinaStatus = statusFiltro === 'Todos' || t.situacao?.toLowerCase() === statusFiltro.toLowerCase()
    const combinaBusca = (t.assunto || '').toLowerCase().includes(termoBusca.toLowerCase()) ||
                          (t.code || '').toLowerCase().includes(termoBusca.toLowerCase())
    return combinaStatus && combinaBusca
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--app-bg)', color: 'var(--text-primary)' }}>
      <Header
        userName={userName}
        accessType={accessType}
        navigationExpanded={isSidebarExpanded}
        onNavigationToggle={setIsSidebarExpanded}
      />

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar
          expanded={isSidebarExpanded}
          onExpand={() => setIsSidebarExpanded(true)}
          onCollapse={() => setIsSidebarExpanded(false)}
          activeId="tickets"
          userName={userName}
          accessType={accessType}
        />

        <main style={{
          flex: 1,
          padding: '24px 40px',
          marginLeft: isSidebarExpanded ? '240px' : '80px',
          transition: 'margin-left 0.3s ease'
        }}>
          
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0,
              marginBottom: '12px'
            }}
          >
            &larr; Voltar à visão geral
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Chamados</h1>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Consulte e gerencie chamados abertos pelo responsável ou moradores.</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {showSearchInput ? (
                <input
                  type="text"
                  placeholder="Buscar por ID ou assunto..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  autoFocus
                  onBlur={() => !termoBusca && setShowSearchInput(false)}
                  style={{
                    height: 'var(--control-height, 40px)',
                    padding: '0 var(--control-padding-x, 12px)',
                    borderRadius: 'var(--control-radius, 8px)',
                    border: '1px solid var(--input-border)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--control-font-size, 13px)'
                  }}
                />
              ) : (
                <button
                  onClick={() => setShowSearchInput(true)}
                  style={{
                    height: 'var(--control-height, 40px)',
                    padding: '0 16px',
                    borderRadius: 'var(--control-radius, 8px)',
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--surface-raised)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <MagnifyingGlass size={16} weight="bold" />
                  Pesquisar
                </button>
              )}

              <button
                onClick={() => setIsNewTicketModalOpen(true)}
                style={{
                  height: 'var(--control-height, 40px)',
                  padding: '0 16px',
                  borderRadius: 'var(--control-radius, 8px)',
                  border: 'none',
                  backgroundColor: 'var(--primary-action-bg)',
                  color: 'var(--primary-action-text)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={16} weight="bold" />
                Novo Chamado
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              style={{
                height: '36px',
                padding: '0 12px',
                borderRadius: 'var(--control-radius, 8px)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            >
              <option value="Todos">Status: Todos</option>
              <option value="Em aberto">Em aberto</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Resolvido">Resolvido</option>
            </select>

            <select
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value)}
              style={{
                height: '36px',
                padding: '0 12px',
                borderRadius: 'var(--control-radius, 8px)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            >
              <option value="30">Período: Últimos 30 dias</option>
              <option value="60">Período: Últimos 60 dias</option>
              <option value="all">Período: Todo o histórico</option>
            </select>
          </div>

          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 'bold' }}>
                  <th style={{ padding: '14px 16px' }}>ID</th>
                  <th style={{ padding: '14px 16px' }}>ASSUNTO</th>
                  <th style={{ padding: '14px 16px' }}>SOLICITAÇÃO</th>
                  <th style={{ padding: '14px 16px' }}>CATEGORIA</th>
                  <th style={{ padding: '14px 16px' }}>SITUAÇÃO</th>
                  <th style={{ padding: '14px 16px' }}>DATA DE ABERTURA</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Carregando chamados...
                    </td>
                  </tr>
                ) : ticketsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhum chamado encontrado.
                    </td>
                  </tr>
                ) : (
                  ticketsFiltrados.map((ticket) => (
                    <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{ticket.code}</td>
                      <td style={{ padding: '14px 16px' }}>{ticket.assunto}</td>
                      <td style={{ padding: '14px 16px' }}>{ticket.solicitacao}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          backgroundColor: 'var(--surface-muted)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          {ticket.categoria}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: ticket.situacao === 'Em aberto' ? 'var(--danger-bg)' : ticket.situacao === 'Em andamento' ? 'var(--accent-soft-bg)' : 'var(--accent-bg)',
                          color: ticket.situacao === 'Em aberto' ? 'var(--danger-text)' : ticket.situacao === 'Em andamento' ? 'var(--accent-soft-text)' : 'var(--success-text)',
                          border: `1px solid ${ticket.situacao === 'Em aberto' ? 'var(--danger-border)' : ticket.situacao === 'Em andamento' ? 'var(--border-color)' : 'var(--success-border)'}`
                        }}>
                          {ticket.situacao}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          title="Editar/Atender Chamado"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <PencilSimple size={18} weight="regular" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </main>
      </div>

      {isNewTicketModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'var(--overlay-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', color: 'var(--text-primary)', lineHeight: '1.2' }}>
                  Novo Chamado
                </h2>
                <p style={{ margin: 0, padding: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Preencha os dados abaixo para registrar uma manutenção ou solicitação no condomínio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTicketModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  lineHeight: '1',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  marginTop: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTicket} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
                  Dados do chamado
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>* Campos obrigatórios</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Assunto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Vazamento na garagem do subsolo 1"
                    value={novoAssunto}
                    onChange={(e) => setNovoAssunto(e.target.value)}
                    style={{
                      width: '100%',
                      height: 'var(--control-height, 40px)',
                      padding: '0 var(--control-padding-x, 12px)',
                      borderRadius: 'var(--control-radius, 8px)',
                      border: '1px solid var(--input-border)',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--control-font-size, 13px)'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                      Categoria *
                    </label>
                    <select
                      value={novaCategoria}
                      onChange={(e) => setNovaCategoria(e.target.value)}
                      style={{
                        width: '100%',
                        height: 'var(--control-height, 40px)',
                        padding: '0 var(--control-padding-x, 12px)',
                        borderRadius: 'var(--control-radius, 8px)',
                        border: '1px solid var(--input-border)',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--control-font-size, 13px)'
                      }}
                    >
                      <option value="Manutenção Predial">Manutenção Predial</option>
                      <option value="Solicitação">Solicitação</option>
                      <option value="Limpeza">Limpeza</option>
                      <option value="Barulho">Barulho</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                      Local da ocorrência *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex.: Bloco A, 3º andar, corredor"
                      value={novoLocal}
                      onChange={(e) => setNovoLocal(e.target.value)}
                      style={{
                        width: '100%',
                        height: 'var(--control-height, 40px)',
                        padding: '0 var(--control-padding-x, 12px)',
                        borderRadius: 'var(--control-radius, 8px)',
                        border: '1px solid var(--input-border)',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--control-font-size, 13px)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Descrição *
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Descreva o problema ou a solicitação, quando começou e outros detalhes que possam ajudar no atendimento."
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px var(--control-padding-x, 12px)',
                      borderRadius: 'var(--control-radius, 8px)',
                      border: '1px solid var(--input-border)',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--control-font-size, 13px)',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Anexos (opcional)
                  </label>
                  <div style={{
                    border: '1px dashed var(--border-strong)',
                    borderRadius: 'var(--control-radius, 8px)',
                    padding: '14px 16px',
                    backgroundColor: 'var(--surface-inset)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <Paperclip size={20} weight="regular" style={{ color: 'var(--text-muted)' }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500' }}>
                          Arraste arquivos para cá ou selecione no seu computador
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          JPG, PNG ou PDF. Até 5 arquivos de 10 MB cada.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--control-radius, 8px)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--surface-raised)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Selecionar arquivos
                    </button>
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', flex: '1 1 200px' }}>
                  Após o envio, acompanhe o atendimento na lista de chamados.
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setIsNewTicketModalOpen(false)}
                    style={{
                      height: 'var(--control-height, 40px)',
                      padding: '0 20px',
                      borderRadius: 'var(--control-radius, 8px)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    style={{
                      height: 'var(--control-height, 40px)',
                      padding: '0 20px',
                      borderRadius: 'var(--control-radius, 8px)',
                      border: 'none',
                      backgroundColor: 'var(--primary-action-bg)',
                      color: 'var(--primary-action-text)',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Enviar chamado
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'var(--overlay-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-strong)',
            padding: '24px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)', lineHeight: '1.2' }}>
                Gerenciar Chamado {selectedTicket.code}
              </h2>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  lineHeight: '1',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  marginTop: '-2px'
                }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '13px', margin: '4px 0', color: 'var(--text-primary)' }}>
              <strong>Assunto:</strong> {selectedTicket.assunto}
            </p>
            <p style={{ fontSize: '13px', margin: '4px 0', color: 'var(--text-primary)' }}>
              <strong>Solicitação:</strong> {selectedTicket.solicitacao}
            </p>
            <p style={{ fontSize: '13px', margin: '4px 0 12px 0', color: 'var(--text-primary)' }}>
              <strong>Categoria:</strong> {selectedTicket.categoria}
            </p>

            <div style={{ backgroundColor: 'var(--surface-inset)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Descrição:</strong>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{selectedTicket.descricao}</p>
            </div>

            <label style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'block' }}>
              Alterar Situação:
              <select
                value={selectedTicket.situacao}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 36px 0 12px',
                  marginTop: '6px',
                  borderRadius: 'var(--control-radius, 8px)',
                  border: '1px solid var(--input-border)',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: '600',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 256 256'%3E%3Cpath fill='%23718078' d='M213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80a8 8 0 0 1 11.32-11.32L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32Z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  cursor: 'pointer'
                }}
              >
                <option value="Em aberto">Em aberto</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Resolvido">Resolvido</option>
              </select>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{
                  height: '38px',
                  padding: '0 20px',
                  borderRadius: 'var(--control-radius, 8px)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}