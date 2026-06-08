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
}

const Estoque = () => {
    const [pecas, setPecas] = useState<PecaEstoque[]>([]);
    const [codigo, setCodigo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [nome, setNome] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [preco_custo, setPrecoCusto] = useState('');
    const [preco_venda, setPrecoVenda] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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
                'INSERT INTO pecas_estoque (nome, codigo, descricao, quantidade, preco_custo, preco_venda) VALUES (?, ?, ?, ?, ?, ?)',
                [nome, codigo, descricao, parseInt(quantidade) || 0, parseFloat(preco_custo) || 0, parseFloat(preco_venda) || 0]
            );
            setCodigo('');
            setDescricao('');
            setNome('');
            setQuantidade('');
            setPrecoCusto('');
            setPrecoVenda('');
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
                            <th>Preço Custo</th>
                            <th>Preço Venda</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPecas.map(p => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>{p.nome}</td>
                                <td>{p.codigo}</td>
                                <td>{p.descricao}</td>
                                <td>{p.quantidade}</td>
                                <td>R$ {p.preco_custo.toFixed(2)}</td>
                                <td>R$ {p.preco_venda.toFixed(2)}</td>
                                <td>
                                    <button className="botao-excluir" onClick={() => excluir(p.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Estoque;