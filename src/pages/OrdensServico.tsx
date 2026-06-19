// src/pages/OrdensServico.tsx
import { useState, useEffect, FormEvent } from 'react';
import { getDatabase } from '../database';
import './pages.css';

interface OrdemServico {
    id: number;
    veiculo_id: number;
    status: string;
    descricao: string;
    valor_estimado: number;
    data_abertura: string;
    data_fechamento: string | null;
    nivel_combustivel: string;
    estado_visual: string;
    pertences_deixados: string;
    diagnostico_tecnico: string;
    previsao_entrega: string;
}

interface Veiculo {
    id: number;
    placa: string;
    marca: string;
    modelo: string;
    ano: number;
    cor: string;
    cliente_id: number;
    cliente_nome?: string;
}

interface Servico {
    id: number;
    nome: string;
    preco: number;
}

interface Peca {
    id: number;
    nome: string;
    preco_venda: number;
    quantidade: number;
}

interface ItemOS {
    id: number;
    tipo: 'servico' | 'peca';
    item_id: number;
    quantidade: number;
    preco_unitario: number;
    nome?: string;
}

const OrdensServico = () => {
    // List View States
    const [view, setView] = useState<'list' | 'form'>('list');
    const [ordens, setOrdens] = useState<OrdemServico[]>([]);
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    
    // Lookups
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [pecas, setPecas] = useState<Peca[]>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'todos' | 'aberta' | 'fechada'>('todos');

    // Form States
    const [formId, setFormId] = useState<number | null>(null);
    const [veiculoId, setVeiculoId] = useState('');
    const [descricao, setDescricao] = useState(''); // Sintoma relatado
    const [nivelCombustivel, setNivelCombustivel] = useState('');
    const [estadoVisual, setEstadoVisual] = useState('');
    const [pertences, setPertences] = useState('');
    const [diagnostico, setDiagnostico] = useState('');
    const [previsaoEntrega, setPrevisaoEntrega] = useState('');
    const [statusOS, setStatusOS] = useState('aberta');
    
    // Itens States
    const [itens, setItens] = useState<ItemOS[]>([]);
    const [novoItemTipo, setNovoItemTipo] = useState<'servico' | 'peca'>('servico');
    const [novoItemId, setNovoItemId] = useState('');
    const [novoItemQtd, setNovoItemQtd] = useState('1');

    const carregarDados = async () => {
        const db = await getDatabase();
        const [ordensRows, veiculosRows, servicosRows, pecasRows] = await Promise.all([
            db.select<OrdemServico[]>('SELECT * FROM ordens_servico ORDER BY id DESC'),
            db.select<Veiculo[]>('SELECT v.*, c.nome as cliente_nome FROM veiculos v JOIN clientes c ON v.cliente_id = c.id ORDER BY v.id DESC'),
            db.select<Servico[]>('SELECT * FROM servicos ORDER BY nome'),
            db.select<Peca[]>('SELECT * FROM pecas_estoque ORDER BY nome')
        ]);

        setOrdens(ordensRows);
        setVeiculos(veiculosRows);
        setServicos(servicosRows);
        setPecas(pecasRows);
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const calcularTotalOS = () => {
        return itens.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);
    };

    const abrirFormulario = async (os?: OrdemServico) => {
        if (os) {
            setFormId(os.id);
            setVeiculoId(os.veiculo_id.toString());
            setDescricao(os.descricao || '');
            setNivelCombustivel(os.nivel_combustivel || '');
            setEstadoVisual(os.estado_visual || '');
            setPertences(os.pertences_deixados || '');
            setDiagnostico(os.diagnostico_tecnico || '');
            setPrevisaoEntrega(os.previsao_entrega || '');
            setStatusOS(os.status || 'aberta');
            
            const db = await getDatabase();
            const itensOS = await db.select<ItemOS[]>('SELECT * FROM ordem_servico_itens WHERE ordem_servico_id = ?', [os.id]);
            
            // Map names
            const itensComNomes = itensOS.map(item => {
                if (item.tipo === 'servico') {
                    const s = servicos.find(x => x.id === item.item_id);
                    return { ...item, nome: s ? s.nome : 'Serviço Desconhecido' };
                } else {
                    const p = pecas.find(x => x.id === item.item_id);
                    return { ...item, nome: p ? p.nome : 'Peça Desconhecida' };
                }
            });
            setItens(itensComNomes);
        } else {
            setFormId(null);
            setVeiculoId('');
            setDescricao('');
            setNivelCombustivel('');
            setEstadoVisual('');
            setPertences('');
            setDiagnostico('');
            setPrevisaoEntrega('');
            setStatusOS('aberta');
            setItens([]);
        }
        setView('form');
    };

    const salvarOrdem = async (e: FormEvent) => {
        e.preventDefault();
        if (!veiculoId || !descricao) {
            alert('Selecione um veículo e preencha o sintoma relatado.');
            return;
        }

        const db = await getDatabase();
        const total = calcularTotalOS();

        try {
            if (formId) {
                // Update
                await db.execute(
                    `UPDATE ordens_servico SET 
                        veiculo_id = ?, descricao = ?, nivel_combustivel = ?, estado_visual = ?, 
                        pertences_deixados = ?, diagnostico_tecnico = ?, previsao_entrega = ?, 
                        status = ?, valor_estimado = ?
                    WHERE id = ?`,
                    [parseInt(veiculoId), descricao, nivelCombustivel, estadoVisual, pertences, diagnostico, previsaoEntrega, statusOS, total, formId]
                );
                
                // Se fechou, atualiza data
                if (statusOS === 'fechada') {
                    await db.execute(`UPDATE ordens_servico SET data_fechamento = datetime('now', 'localtime') WHERE id = ?`, [formId]);
                }
                alert('Ordem atualizada com sucesso!');
            } else {
                // Insert
                await db.execute(
                    `INSERT INTO ordens_servico (
                        veiculo_id, descricao, nivel_combustivel, estado_visual, pertences_deixados, 
                        diagnostico_tecnico, previsao_entrega, valor_estimado, data_abertura
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
                    [parseInt(veiculoId), descricao, nivelCombustivel, estadoVisual, pertences, diagnostico, previsaoEntrega, total]
                );
                alert('Ordem criada com sucesso!');
            }

            setView('list');
            carregarDados();
        } catch (error: any) {
            alert('Erro ao salvar OS: ' + error.message);
        }
    };

    const adicionarItem = async () => {
        if (!novoItemId || !novoItemQtd || parseInt(novoItemQtd) <= 0) return;
        
        let nome = '';
        let preco = 0;
        
        if (novoItemTipo === 'servico') {
            const s = servicos.find(x => x.id === parseInt(novoItemId));
            if (s) { nome = s.nome; preco = s.preco; }
        } else {
            const p = pecas.find(x => x.id === parseInt(novoItemId));
            if (p) { nome = p.nome; preco = p.preco_venda; }
        }

        const novoItem: ItemOS = {
            id: Date.now(), // temporary ID for UI
            tipo: novoItemTipo,
            item_id: parseInt(novoItemId),
            quantidade: parseInt(novoItemQtd),
            preco_unitario: preco,
            nome
        };

        if (formId) {
            // Save directly to db if OS already exists
            const db = await getDatabase();
            await db.execute(
                'INSERT INTO ordem_servico_itens (ordem_servico_id, tipo, item_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?, ?)',
                [formId, novoItem.tipo, novoItem.item_id, novoItem.quantidade, novoItem.preco_unitario]
            );
            // Reload itens
            const itensOS = await db.select<ItemOS[]>('SELECT * FROM ordem_servico_itens WHERE ordem_servico_id = ?', [formId]);
            const itensComNomes = itensOS.map(item => {
                if (item.tipo === 'servico') {
                    const s = servicos.find(x => x.id === item.item_id);
                    return { ...item, nome: s ? s.nome : 'Serviço Desconhecido' };
                } else {
                    const p = pecas.find(x => x.id === item.item_id);
                    return { ...item, nome: p ? p.nome : 'Peça Desconhecida' };
                }
            });
            setItens(itensComNomes);
        } else {
            // Just add to state if creating new OS (Wait, usually better to save OS first. Let's force save OS before adding items)
            alert('Por favor, salve a OS primeiro antes de adicionar peças ou serviços.');
            return;
        }

        setNovoItemId('');
        setNovoItemQtd('1');
    };

    const removerItem = async (itemId: number) => {
        if (formId && window.confirm('Remover este item?')) {
            const db = await getDatabase();
            await db.execute('DELETE FROM ordem_servico_itens WHERE id = ?', [itemId]);
            setItens(itens.filter(i => i.id !== itemId));
        }
    };

    const excluirOrdem = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
            const db = await getDatabase();
            await db.execute('DELETE FROM ordens_servico WHERE id = ?', [id]);
            await db.execute('DELETE FROM ordem_servico_itens WHERE ordem_servico_id = ?', [id]);
            carregarDados();
        }
    };

    const filteredOrdens = ordens.filter(o => {
        if (statusFilter !== 'todos' && o.status !== statusFilter) return false;
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const veiculo = veiculos.find(v => v.id === o.veiculo_id);
        if (!veiculo) return false;
        return (
            veiculo.placa.toLowerCase().includes(term) ||
            veiculo.marca.toLowerCase().includes(term) ||
            veiculo.modelo.toLowerCase().includes(term) ||
            (veiculo.cliente_nome && veiculo.cliente_nome.toLowerCase().includes(term)) ||
            (o.descricao && o.descricao.toLowerCase().includes(term))
        );
    });

    return (
        <div className="pagina-container">
            <h1>📋 Ordens de Serviço</h1>

            {view === 'list' && (
                <>
                    <div className="ordens-header">
                        <button className="botao-config" onClick={() => abrirFormulario()}>
                            ➕ Nova Ordem de Serviço
                        </button>
                        <div className="ordens-filtros" style={{ flexDirection: 'row' }}>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                                <option value="todos">Todos os Status</option>
                                <option value="aberta">Abertas</option>
                                <option value="fechada">Fechadas</option>
                            </select>
                            <input
                                type="text"
                                placeholder="🔍 Pesquisar ordens (placa, cliente, descrição)..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {filteredOrdens.length === 0 ? (
                        <p className="sem-dados">Nenhuma ordem de serviço encontrada.</p>
                    ) : (
                        <div className="ordens-resumo">
                            <table className="tabela-dados">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Veículo</th>
                                        <th>Cliente</th>
                                        <th>Abertura</th>
                                        <th>Status</th>
                                        <th>Valor Total</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrdens.map(o => {
                                        const veiculo = veiculos.find(v => v.id === o.veiculo_id);
                                        const statusTexto = o.status === 'aberta' ? 'Aberta' : 'Fechada';
                                        const statusCor = o.status === 'aberta' ? '#f39c12' : '#27ae60';

                                        return (
                                            <tr key={o.id}>
                                                <td>{o.id}</td>
                                                <td>{veiculo ? `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}` : '-'}</td>
                                                <td>{veiculo?.cliente_nome || '-'}</td>
                                                <td>{o.data_abertura ? o.data_abertura.substring(0, 16).replace('T', ' ') : '-'}</td>
                                                <td>
                                                    <span style={{ background: statusCor, color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                                        {statusTexto}
                                                    </span>
                                                </td>
                                                <td>R$ {(o.valor_estimado ?? 0).toFixed(2).replace('.', ',')}</td>
                                                <td>
                                                    <button className="botao-config" onClick={() => abrirFormulario(o)}>✏️ Editar</button>
                                                    <button className="botao-excluir" onClick={() => excluirOrdem(o.id)} style={{ marginLeft: '8px' }}>🗑</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {view === 'form' && (
                <div className="os-form-container">
                    <form onSubmit={salvarOrdem}>
                        <div className="os-form-section">
                            <h3>🚗 Identificação</h3>
                            <div className="os-grid">
                                <div className="form-group">
                                    <label>Veículo *</label>
                                    <select value={veiculoId} onChange={e => setVeiculoId(e.target.value)} required disabled={!!formId}>
                                        <option value="">-- Selecione um Veículo --</option>
                                        {veiculos.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.placa} - {v.marca} {v.modelo} ({v.cliente_nome})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {formId && (
                                    <div className="form-group">
                                        <label>Status da OS</label>
                                        <select value={statusOS} onChange={e => setStatusOS(e.target.value)}>
                                            <option value="aberta">Aberta</option>
                                            <option value="fechada">Fechada</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="os-form-section">
                            <h3>📋 Check-in (Vistoria)</h3>
                            <div className="os-grid">
                                <div className="form-group">
                                    <label>Nível de Combustível</label>
                                    <select value={nivelCombustivel} onChange={e => setNivelCombustivel(e.target.value)}>
                                        <option value="">Não Informado</option>
                                        <option value="Reserva">Reserva</option>
                                        <option value="1/4">1/4</option>
                                        <option value="1/2">1/2</option>
                                        <option value="3/4">3/4</option>
                                        <option value="Cheio">Cheio</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Pertences Deixados no Veículo</label>
                                    <input type="text" value={pertences} onChange={e => setPertences(e.target.value)} placeholder="Ex: Óculos, Ferramentas, Som..." className="form-control" style={{ width: '100%', padding: '10px' }} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '14px' }}>
                                <label>Estado Visual (Riscos, amassados, etc.)</label>
                                <textarea value={estadoVisual} onChange={e => setEstadoVisual(e.target.value)} rows={2}></textarea>
                            </div>
                        </div>

                        <div className="os-form-section">
                            <h3>🔧 Diagnóstico e Solicitação</h3>
                            <div className="os-grid">
                                <div className="form-group">
                                    <label>Sintoma Relatado (Pelo Cliente) *</label>
                                    <textarea value={descricao} onChange={e => setDescricao(e.target.value)} required rows={3}></textarea>
                                </div>
                                <div className="form-group">
                                    <label>Diagnóstico Técnico (Pelo Mecânico)</label>
                                    <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} rows={3}></textarea>
                                </div>
                            </div>
                            <div className="form-group" style={{ maxWidth: '250px', marginTop: '14px' }}>
                                <label>Previsão de Entrega</label>
                                <input type="date" value={previsaoEntrega} onChange={e => setPrevisaoEntrega(e.target.value)} style={{ padding: '10px', width: '100%' }} />
                            </div>
                        </div>

                        {formId ? (
                            <div className="os-form-section">
                                <h3>💰 Peças e Serviços (Custos)</h3>
                                <div className="form-cadastro" style={{ marginBottom: '16px' }}>
                                    <select value={novoItemTipo} onChange={e => setNovoItemTipo(e.target.value as any)}>
                                        <option value="servico">Serviço (Mão de Obra)</option>
                                        <option value="peca">Peça</option>
                                    </select>
                                    <select value={novoItemId} onChange={e => setNovoItemId(e.target.value)}>
                                        <option value="">-- Selecione o Item --</option>
                                        {novoItemTipo === 'servico' 
                                            ? servicos.map(s => <option key={s.id} value={s.id}>{s.nome} - R$ {s.preco.toFixed(2)}</option>)
                                            : pecas.map(p => <option key={p.id} value={p.id}>{p.nome} - R$ {p.preco_venda.toFixed(2)} (Estoque: {p.quantidade})</option>)
                                        }
                                    </select>
                                    <input type="number" min="1" value={novoItemQtd} onChange={e => setNovoItemQtd(e.target.value)} placeholder="Qtd" />
                                    <button type="button" onClick={adicionarItem}>➕ Adicionar Item</button>
                                </div>

                                {itens.length > 0 && (
                                    <table className="tabela-dados tabela-itens">
                                        <thead>
                                            <tr>
                                                <th>Tipo</th>
                                                <th>Descrição</th>
                                                <th>Qtd</th>
                                                <th>Unitário</th>
                                                <th>Total</th>
                                                <th>Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itens.map(item => (
                                                <tr key={item.id}>
                                                    <td>{item.tipo === 'servico' ? 'Mão de Obra' : 'Peça'}</td>
                                                    <td>{item.nome}</td>
                                                    <td>{item.quantidade}</td>
                                                    <td>R$ {item.preco_unitario.toFixed(2).replace('.', ',')}</td>
                                                    <td>R$ {(item.quantidade * item.preco_unitario).toFixed(2).replace('.', ',')}</td>
                                                    <td><button type="button" className="botao-excluir" onClick={() => removerItem(item.id)}>Remover</button></td>
                                                </tr>
                                            ))}
                                            <tr style={{ fontWeight: 'bold', background: 'rgba(0,0,0,0.02)' }}>
                                                <td colSpan={4} style={{ textAlign: 'right' }}>VALOR TOTAL DA OS:</td>
                                                <td colSpan={2} style={{ color: 'var(--accent-light)' }}>R$ {calcularTotalOS().toFixed(2).replace('.', ',')}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        ) : (
                            <div className="mensagem-feedback" style={{ marginBottom: '24px' }}>
                                Salve a Ordem de Serviço primeiro para poder adicionar Peças e Serviços.
                            </div>
                        )}

                        <div className="os-actions">
                            <button type="button" className="botao-secundario" onClick={() => setView('list')}>Voltar / Cancelar</button>
                            <button type="submit" className="botao-config">💾 {formId ? 'Salvar Alterações da OS' : 'Criar Ordem de Serviço'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default OrdensServico;