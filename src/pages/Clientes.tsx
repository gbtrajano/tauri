// src/pages/Clientes.tsx
import { useState, useEffect, FormEvent } from 'react';
import { getDatabase } from '../database';
import './pages.css';

interface Cliente {
    id: number;
    nome: string;
    cpf_cnpj: string;
    telefone: string;
    email: string;
}

const Clientes = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [nome, setNome] = useState('');
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const carregarClientes = async () => {
        const db = await getDatabase();
        const rows = await db.select<Cliente[]>('SELECT * FROM clientes ORDER BY id DESC');
        setClientes(rows);
    };

    const cadastrar = async (e: FormEvent) => {
        e.preventDefault();
        const db = await getDatabase();
        await db.execute(
            'INSERT INTO clientes (nome, cpf_cnpj, telefone, email) VALUES (?, ?, ?, ?)',
            [nome, cpfCnpj, telefone, email]
        );
        setNome('');
        setCpfCnpj('');
        setTelefone('');
        setEmail('');
        carregarClientes();
    };

    const excluir = async (id: number) => {
        const db = await getDatabase();
        await db.execute('DELETE FROM clientes WHERE id = ?', [id]);
        carregarClientes();
    };

    useEffect(() => {
        carregarClientes();
    }, []);

    // Filter clientes based on search term
    const filteredClientes = clientes.filter(c => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            c.nome.toLowerCase().includes(term) ||
            (c.cpf_cnpj && c.cpf_cnpj.toLowerCase().includes(term)) ||
            c.telefone.toLowerCase().includes(term) ||
            c.email.toLowerCase().includes(term)
        );
    });

    return (
        <div className="pagina-container">
            <h1>👥 Cadastro de Clientes</h1>

            <form onSubmit={cadastrar} className="form-cadastro">
                <input placeholder="Nome *" value={nome} onChange={e => setNome(e.target.value)} required />
                <input placeholder="CPF/CNPJ" value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} />
                <input placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
                <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <button type="submit">➕ Cadastrar Cliente</button>
            </form>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Pesquisar clientes (nome, cpf/cnpj, telefone, email)..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredClientes.length === 0 ? (
                <p className="sem-dados">Nenhum cliente encontrado.</p>
            ) : (
                <table className="tabela-dados">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>CPF/CNPJ</th>
                            <th>Telefone</th>
                            <th>Email</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClientes.map(c => (
                            <tr key={c.id}>
                                <td>{c.id}</td>
                                <td>{c.nome}</td>
                                <td>{c.cpf_cnpj || '-'}</td>
                                <td>{c.telefone}</td>
                                <td>{c.email}</td>
                                <td>
                                    <button className="botao-excluir" onClick={() => excluir(c.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Clientes;