// src/pages/Veiculos.tsx
import { useState, useEffect, FormEvent } from 'react';
import { getDatabase } from '../database';
import './pages.css';

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

const Veiculos = () => {
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [placa, setPlaca] = useState('');
    const [marca, setMarca] = useState('');
    const [modelo, setModelo] = useState('');
    const [ano, setAno] = useState('');
    const [cor, setCor] = useState('');
    const [clienteId, setClienteId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const carregarVeiculos = async () => {
        const db = await getDatabase();
        const rows = await db.select<Veiculo[]>('SELECT * FROM veiculos ORDER BY id DESC');
        setVeiculos(rows);
    };

    const carregarClientes = async () => {
        const db = await getDatabase();
        const rows = await db.select<Cliente[]>('SELECT id, nome FROM clientes ORDER BY nome');
        setClientes(rows);
    };

    const cadastrar = async (e: FormEvent) => {
        e.preventDefault();
        if (!clienteId) {
            alert('Por favor, selecione um cliente para o veículo.');
            return;
        }
        const db = await getDatabase();
        await db.execute(
            'INSERT INTO veiculos (placa, marca, modelo, ano, cor, cliente_id) VALUES (?, ?, ?, ?, ?, ?)',
            [placa, marca, modelo, parseInt(ano) || 0, cor, parseInt(clienteId)]
        );
        setPlaca('');
        setMarca('');
        setModelo('');
        setAno('');
        setCor('');
        setClienteId('');
        carregarVeiculos();
    };

    const excluir = async (id: number) => {
        const db = await getDatabase();
        await db.execute('DELETE FROM veiculos WHERE id = ?', [id]);
        carregarVeiculos();
    };

    useEffect(() => {
        carregarVeiculos();
        carregarClientes();
    }, []);

    // Filter veiculos based on search term
    const filteredVeiculos = veiculos.filter(v => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            v.placa.toLowerCase().includes(term) ||
            v.marca.toLowerCase().includes(term) ||
            v.modelo.toLowerCase().includes(term) ||
            v.ano.toString().includes(term) ||
            v.cor.toLowerCase().includes(term)
        );
    });

    return (
        <div className="pagina-container">
            <h1>🚗 Cadastro de Veículos</h1>

            <form onSubmit={cadastrar} className="form-cadastro">
                <input placeholder="Placa *" value={placa} onChange={e => setPlaca(e.target.value)} required />
                <input placeholder="Marca" value={marca} onChange={e => setMarca(e.target.value)} />
                <input placeholder="Modelo" value={modelo} onChange={e => setModelo(e.target.value)} />
                <input placeholder="Ano" type="number" value={ano} onChange={e => setAno(e.target.value)} />
                <input placeholder="Cor" value={cor} onChange={e => setCor(e.target.value)} />
                <select value={clienteId} onChange={e => setClienteId(e.target.value)}>
                    <option value="">-- Selecione um Cliente --</option>
                    {clientes.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.nome}
                        </option>
                    ))}
                </select>
                <button type="submit">➕ Cadastrar Veículo</button>
            </form>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Pesquisar veículos (placa, marca, modelo, ano, cor)..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredVeiculos.length === 0 ? (
                <p className="sem-dados">Nenhum veículo encontrado.</p>
            ) : (
                <table className="tabela-dados">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Placa</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Ano</th>
                            <th>Cor</th>
                            <th>Cliente</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVeiculos.map(v => {
                            const cliente = clientes.find(c => c.id === v.cliente_id);
                            const clienteNome = cliente ? cliente.nome : 'Não identificado';
                            return (
                                <tr key={v.id}>
                                    <td>{v.id}</td>
                                    <td>{v.placa}</td>
                                    <td>{v.marca}</td>
                                    <td>{v.modelo}</td>
                                    <td>{v.ano}</td>
                                    <td>{v.cor}</td>
                                    <td>{clienteNome}</td>
                                    <td>
                                        <button className="botao-excluir" onClick={() => excluir(v.id)}>Excluir</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Veiculos;