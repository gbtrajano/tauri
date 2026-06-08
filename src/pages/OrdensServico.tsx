// src/pages/OrdensServico.tsx
import { useState, useEffect, FormEvent } from 'react';
import { getDatabase } from '../database';
import './pages.css';

interface OrdemServico {
    id: number;
    veiculo_id: number;
    status: string;
    descricao: string;
    data_abertura: string;
    data_fechamento: string | null;
}

interface Veiculo {
    id: number;
    placa: string;
    marca: string;
    modelo: string;
    ano: number;
    cor: string;
    cliente_id: number;
}

interface Cliente {
    id: number;
    nome: string;
}

const OrdensServico = () => {
    const [ordens, setOrdens] = useState<OrdemServico[]>([]);
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);

    // Form fields for creating new order
    const [veiculoId, setVeiculoId] = useState('');
    const [descricao, setDescricao] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'todos' | 'aberta' | 'fechada'>('todos');

    const carregarDados = async () => {
        const db = await getDatabase();
        const [ordensRows, veiculosRows, clientesRows] = await Promise.all([
            db.select<OrdemServico[]>('SELECT * FROM ordens_servico ORDER BY id DESC'),
            db.select<Veiculo[]>('SELECT v.*, c.nome as cliente_nome FROM veiculos v JOIN clientes c ON v.cliente_id = c.id ORDER BY v.id DESC'),
            db.select<Cliente[]>('SELECT * FROM clientes ORDER BY nome')
        ]);

        setOrdens(ordensRows);
        setVeiculos(veiculosRows);
        setClientes(clientesRows);
    };

    const cadastrarOrdem = async (e: FormEvent) => {
        e.preventDefault();
        if (!veiculoId || !descricao) {
            alert('Por favor, selecione um veículo e descreva o serviço.');
            return;
        }

        const db = await getDatabase();
        try {
            await db.execute(
                'INSERT INTO ordens_servico (veiculo_id, descricao) VALUES (?, ?)',
                [parseInt(veiculoId), descricao]
            );

            // Reset form
            setVeiculoId('');
            setDescricao('');

            await carregarDados();
        } catch (error: any) {
            alert('Erro ao criar ordem de serviço: ' + error.message);
        }
    };

    const fecharOrdem = async (id: number) => {
        if (window.confirm('Tem certeza que deseja fechar esta ordem de serviço?')) {
            const db = await getDatabase();
            await db.execute(
                `UPDATE ordens_servico SET status = ?, data_fechamento = datetime('now') WHERE id = ?`,
                ['fechada', id]
            );
            await carregarDados();
        }
    };

    const excluirOrdem = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
            const db = await getDatabase();
            await db.execute('DELETE FROM ordens_servico WHERE id = ?', [id]);
            await db.execute('DELETE FROM ordem_servico_itens WHERE ordem_servico_id = ?', [id]);
            await carregarDados();
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    // Filter ordens based on search and status
    const filteredOrdens = ordens.filter(o => {
        // Status filter
        if (statusFilter !== 'todos' && o.status !== statusFilter) {
            return false;
        }

        // Search filter
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const veiculo = veiculos.find(v => v.id === o.veiculo_id);
        if (!veiculo) return false;
        return (
            veiculo.placa.toLowerCase().includes(term) ||
            veiculo.marca.toLowerCase().includes(term) ||
            veiculo.modelo.toLowerCase().includes(term) ||
            o.descricao.toLowerCase().includes(term) ||
            o.status.toLowerCase().includes(term)
        );
    });

    return (
        <div className="pagina-container">
            <h1>📋 Ordens de Serviço</h1>

            <div className="ordens-header">
                <form onSubmit={cadastrarOrdem} className="form-cadastro">
                    <div className="form-group">
                        <label>Veículo *</label>
                        <select value={veiculoId} onChange={e => setVeiculoId(e.target.value)} required>
                            <option value="">-- Selecione um Veículo --</option>
                            {veiculos.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.placa} - {v.marca} {v.modelo} ({v.ano})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Descrição do Problema *</label>
                        <textarea 
                            value={descricao} 
                            onChange={e => setDescricao(e.target.value)} 
                            required
                            rows={3}
                        />
                    </div>

                    <button type="submit">➕ Criar Ordem de Serviço</button>
                </form>

                <div className="ordens-filtros">
                    <select 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value as any)}
                    >
                        <option value="todos">Todos os Status</option>
                        <option value="aberta">Abertas</option>
                        <option value="fechada">Fechadas</option>
                    </select>

                    <input
                        type="text"
                        placeholder="🔍 Pesquisar ordens (placa, marca, modelo, descrição)..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {filteredOrdens.length === 0 ? (
                <p className="sem-dados">Nenhuma ordem de serviço encontrada.</p>
            ) : (
                <>
                    <div className="ordens-resumo">
                        <h2>Ordens de Serviço</h2>
                        <table className="tabela-dados">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Veículo</th>
                                    <th>Cliente</th>
                                    <th>Data Abertura</th>
                                    <th>Status</th>
                                    <th>Valor Estimado</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrdens.map(o => {
                                    const veiculo = veiculos.find(v => v.id === o.veiculo_id);
                                    const cliente = veiculo ? clientes.find(c => c.id === veiculo.cliente_id) : null;
                                    const statusTexto = o.status === 'aberta' ? 'Aberta' : 'Fechada';
                                    const statusCor = o.status === 'aberta' ? '#f39c12' : '#27ae60';

                                    return (
                                        <tr key={o.id}>
                                            <td>{o.id}</td>
                                            <td>
                                                {veiculo ? `${veiculo.placa} - ${veiculo.marca} {v.modelo}` : 'Veículo não encontrado'}
                                            </td>
                                            <td>{cliente ? cliente.nome : 'Cliente não encontrado'}</td>
                                            <td>{new Date(o.data_abertura).toLocaleString()}</td>
                                            <td>
                                                <span style={{ 
                                                    display: 'inline-block',
                                                    padding: '0.25rem 0.5rem',
                                                    background: statusCor,
                                                    color: 'white',
                                                    borderRadius: '4px',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {statusTexto}
                                                </span>
                                            </td>
                                            <td>R$ 0,00</td> {/* Valor será calculado dinamicamente em versão futura */}
                                            <td>
                                                {o.status === 'aberta' && (
                                                    <>
                                                        <button 
                                                            className="botao-config" 
                                                            onClick={() => fecharOrdem(o.id)}
                                                        >
                                                            ✅ Fechar
                                                        </button>
                                                        <button 
                                                            className="botao-excluir" 
                                                            onClick={() => excluirOrdem(o.id)}
                                                        >
                                                            🗑 Excluir
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Detalhes da ordem selecionada (expansível) */}
                    {/* Em uma versão futura, isso poderia ser um modal ou página separada */}
                </>
            )}
        </div>
    );
};

export default OrdensServico;