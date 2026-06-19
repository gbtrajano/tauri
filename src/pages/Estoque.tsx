// src/pages/Estoque.tsx
import { useState, useEffect, FormEvent } from 'react';
import { getDatabase } from '../database';
import './pages.css';

interface PecaEstoque {
    id: number;
    nome: string;
    codigo: string;
    descricao: string;
    quantidade: number;
    preco_custo: number;
    preco_venda: number;
    estoque_minimo: number;
}

const Estoque = () => {
    const [pecas, setPecas] = useState<PecaEstoque[]>([]);
    const [codigo, setCodigo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [nome, setNome] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [preco_custo, setPrecoCusto] = useState('');
    const [preco_venda, setPrecoVenda] = useState('');
    const [estoque_minimo, setEstoqueMinimo] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Edição de estoque mínimo inline
    const [editandoMinimoId, setEditandoMinimoId] = useState<number | null>(null);
    const [novoMinimo, setNovoMinimo] = useState('');

    // Modal de baixa de estoque
    const [baixaModalId, setBaixaModalId] = useState<number | null>(null);
    const [baixaQtd, setBaixaQtd] = useState('');
    const [baixaMotivo, setBaixaMotivo] = useState('');

    const carregarPecas = async () => {
        const db = await getDatabase();
        const rows = await db.select<PecaEstoque[]>('SELECT * FROM pecas_estoque ORDER BY id DESC');
        setPecas(rows);
    };

    const cadastrar = async (e: FormEvent) => {
        e.preventDefault();
        if (!nome || !codigo || !descricao) {
            alert('Nome, código e descrição são obrigatórios.');
            return;
        }
        const db = await getDatabase();
        try {
            await db.execute(
                'INSERT INTO pecas_estoque (nome, codigo, descricao, quantidade, preco_custo, preco_venda, estoque_minimo) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    nome,
                    codigo,
                    descricao,
                    parseInt(quantidade) || 0,
                    parseFloat(preco_custo) || 0,
                    parseFloat(preco_venda) || 0,
                    parseInt(estoque_minimo) || 0,
                ]
            );
            setCodigo('');
            setDescricao('');
            setNome('');
            setQuantidade('');
            setPrecoCusto('');
            setPrecoVenda('');
            setEstoqueMinimo('');
            carregarPecas();
        } catch (error: any) {
            if (error.message.includes('UNIQUE constraint failed')) {
                alert('Este código já está cadastrado no estoque.');
            } else {
                alert('Erro ao cadastrar item: ' + error.message);
            }
        }
    };

    const excluir = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este item do estoque?')) {
            const db = await getDatabase();
            await db.execute('DELETE FROM pecas_estoque WHERE id = ?', [id]);
            carregarPecas();
        }
    };

    // Salvar estoque mínimo editado inline
    const salvarMinimo = async (id: number) => {
        const valor = parseInt(novoMinimo);
        if (isNaN(valor) || valor < 0) {
            alert('Informe um número válido (0 ou maior).');
            return;
        }
        const db = await getDatabase();
        await db.execute('UPDATE pecas_estoque SET estoque_minimo = ? WHERE id = ?', [valor, id]);
        setEditandoMinimoId(null);
        setNovoMinimo('');
        carregarPecas();
    };

    // Registrar baixa de estoque
    const confirmarBaixa = async () => {
        const qtd = parseInt(baixaQtd);
        if (!qtd || qtd <= 0) {
            alert('Informe uma quantidade válida maior que zero.');
            return;
        }
        if (!baixaMotivo.trim()) {
            alert('Informe o motivo da baixa.');
            return;
        }
        const peca = pecas.find(p => p.id === baixaModalId);
        if (!peca) return;
        if (qtd > peca.quantidade) {
            alert(`Quantidade insuficiente. Estoque atual: ${peca.quantidade}`);
            return;
        }
        const db = await getDatabase();
        await db.execute(
            'UPDATE pecas_estoque SET quantidade = quantidade - ? WHERE id = ?',
            [qtd, baixaModalId]
        );
        setBaixaModalId(null);
        setBaixaQtd('');
        setBaixaMotivo('');
        carregarPecas();
    };

    useEffect(() => {
        carregarPecas();
    }, []);

    // Filter pecas based on search term
    const filteredPecas = pecas.filter(p => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            p.nome.toLowerCase().includes(term) ||
            p.codigo.toLowerCase().includes(term) ||
            p.descricao.toLowerCase().includes(term) ||
            p.quantidade.toString().includes(term) ||
            p.preco_custo.toString().includes(term) ||
            p.preco_venda.toString().includes(term)
        );
    });

    return (
        <div className="pagina-container">
            <h1>📦 Controle de Estoque</h1>

            <form onSubmit={cadastrar} className="form-cadastro">
                <input placeholder="Nome *" value={nome} onChange={e => setNome(e.target.value)} required />
                <input placeholder="Código *" value={codigo} onChange={e => setCodigo(e.target.value)} required />
                <input placeholder="Descrição *" value={descricao} onChange={e => setDescricao(e.target.value)} required />
                <input placeholder="Quantidade" type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} />
                <input placeholder="Preço de Custo" type="number" step="0.01" value={preco_custo} onChange={e => setPrecoCusto(e.target.value)} />
                <input placeholder="Preço de Venda" type="number" step="0.01" value={preco_venda} onChange={e => setPrecoVenda(e.target.value)} />
                <input placeholder="Estoque Mínimo" type="number" min="0" value={estoque_minimo} onChange={e => setEstoqueMinimo(e.target.value)} title="Alerta quando o estoque atingir este valor" />
                <button type="submit">➕ Cadastrar Item</button>
            </form>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Pesquisar itens (nome, código, descrição, quantidade, preços)..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredPecas.length === 0 ? (
                <p className="sem-dados">Nenhum item cadastrado no estoque.</p>
            ) : (
                <table className="tabela-dados">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Código</th>
                            <th>Descrição</th>
                            <th>Quantidade</th>
                            <th>Est. Mínimo</th>
                            <th>Preço Custo</th>
                            <th>Preço Venda</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPecas.map(p => {
                            const abaixoDoMinimo = p.quantidade <= p.estoque_minimo && p.estoque_minimo > 0;
                            return (
                                <tr key={p.id} style={abaixoDoMinimo ? { background: 'rgba(231, 76, 60, 0.12)' } : {}}>
                                    <td>{p.id}</td>
                                    <td>{p.nome}</td>
                                    <td>{p.codigo}</td>
                                    <td>{p.descricao}</td>
                                    <td>
                                        <span style={abaixoDoMinimo ? { color: '#e74c3c', fontWeight: 'bold' } : {}}>
                                            {abaixoDoMinimo && '⚠️ '}
                                            {p.quantidade}
                                        </span>
                                    </td>
                                    <td>
                                        {editandoMinimoId === p.id ? (
                                            <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={novoMinimo}
                                                    onChange={e => setNovoMinimo(e.target.value)}
                                                    style={{ width: '60px', padding: '2px 4px' }}
                                                    autoFocus
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') salvarMinimo(p.id);
                                                        if (e.key === 'Escape') setEditandoMinimoId(null);
                                                    }}
                                                />
                                                <button
                                                    className="botao-config"
                                                    style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                                                    onClick={() => salvarMinimo(p.id)}
                                                >✔</button>
                                                <button
                                                    className="botao-excluir"
                                                    style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                                                    onClick={() => setEditandoMinimoId(null)}
                                                >✖</button>
                                            </span>
                                        ) : (
                                            <span
                                                title="Clique para editar o estoque mínimo"
                                                style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                                                onClick={() => {
                                                    setEditandoMinimoId(p.id);
                                                    setNovoMinimo(String(p.estoque_minimo));
                                                }}
                                            >
                                                {p.estoque_minimo}
                                            </span>
                                        )}
                                    </td>
                                    <td>R$ {Number(p.preco_custo).toFixed(2)}</td>
                                    <td>R$ {Number(p.preco_venda).toFixed(2)}</td>
                                    <td style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        <button
                                            className="botao-config"
                                            onClick={() => {
                                                setBaixaModalId(p.id);
                                                setBaixaQtd('');
                                                setBaixaMotivo('');
                                            }}
                                        >
                                            📉 Baixa
                                        </button>
                                        <button className="botao-excluir" onClick={() => excluir(p.id)}>🗑 Excluir</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            {/* Modal de Baixa de Estoque */}
            {baixaModalId !== null && (() => {
                const peca = pecas.find(p => p.id === baixaModalId);
                return (
                    <div
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000
                        }}
                        onClick={e => { if (e.target === e.currentTarget) setBaixaModalId(null); }}
                    >
                        <div style={{
                            background: 'var(--card-bg, #1e2130)',
                            border: '1px solid var(--border-color, #2e3450)',
                            borderRadius: '12px',
                            padding: '2rem',
                            width: '100%',
                            maxWidth: '420px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                        }}>
                            <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>📉 Baixa de Estoque</h2>
                            <p style={{ color: 'var(--text-muted, #8892b0)', marginBottom: '1.5rem' }}>
                                <strong>{peca?.nome}</strong> ({peca?.codigo})<br />
                                Quantidade atual: <strong>{peca?.quantidade}</strong>
                            </p>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Quantidade a retirar *</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={peca?.quantidade}
                                    value={baixaQtd}
                                    onChange={e => setBaixaQtd(e.target.value)}
                                    placeholder="Ex: 2"
                                    autoFocus
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Motivo da baixa *</label>
                                <input
                                    type="text"
                                    value={baixaMotivo}
                                    onChange={e => setBaixaMotivo(e.target.value)}
                                    placeholder="Ex: Usado em OS #12, Defeito, Devolução..."
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button
                                    className="botao-excluir"
                                    onClick={() => setBaixaModalId(null)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="botao-config"
                                    onClick={confirmarBaixa}
                                >
                                    ✔ Confirmar Baixa
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default Estoque;