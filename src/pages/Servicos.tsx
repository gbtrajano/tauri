// src/pages/Servicos.tsx
import { useState, useEffect, FormEvent } from 'react';
import { getDatabase } from '../database';
import './pages.css';

interface Servico {
    id: number;
    nome: string;
    descricao: string;
    preco: number;
}

const Servicos = () => {
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [preco, setPreco] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const carregarServicos = async () => {
        const db = await getDatabase();
        const rows = await db.select<Servico[]>('SELECT * FROM servicos ORDER BY id DESC');
        setServicos(rows);
    };

    const cadastrar = async (e: FormEvent) => {
        e.preventDefault();
        if (!nome) {
            alert('Nome do serviço é obrigatório.');
            return;
        }
        const db = await getDatabase();
        try {
            await db.execute(
                'INSERT INTO servicos (nome, descricao, preco) VALUES (?, ?, ?)',
                [nome, descricao, parseFloat(preco) || 0]
            );
            setNome('');
            setDescricao('');
            setPreco('');
            carregarServicos();
        } catch (error: any) {
            alert('Erro ao cadastrar serviço: ' + error.message);
        }
    };

    const excluir = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
            const db = await getDatabase();
            await db.execute('DELETE FROM servicos WHERE id = ?', [id]);
            carregarServicos();
        }
    };

    useEffect(() => {
        carregarServicos();
    }, []);

    // Filter servicos based on search term
    const filteredServicos = servicos.filter(s => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            s.nome.toLowerCase().includes(term) ||
            s.descricao.toLowerCase().includes(term) ||
            s.preco.toString().includes(term)
        );
    });

    return (
        <div className="pagina-container">
            <h1>🔧 Cadastro de Serviços</h1>

            <form onSubmit={cadastrar} className="form-cadastro">
                <input placeholder="Nome do Serviço *" value={nome} onChange={e => setNome(e.target.value)} required />
                <input placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} />
                <input placeholder="Preço" type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} />
                <button type="submit">➕ Cadastrar Serviço</button>
            </form>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Pesquisar serviços (nome, descrição, preço)..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredServicos.length === 0 ? (
                <p className="sem-dados">Nenhum serviço cadastrado.</p>
            ) : (
                <table className="tabela-dados">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Descrição</th>
                            <th>Preço</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredServicos.map(s => (
                            <tr key={s.id}>
                                <td>{s.id}</td>
                                <td>{s.nome}</td>
                                <td>{s.descricao}</td>
                                <td>R$ {s.preco.toFixed(2)}</td>
                                <td>
                                    <button className="botao-excluir" onClick={() => excluir(s.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Servicos;