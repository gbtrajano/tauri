// src/pages/Orcamento.tsx
import { useState, useEffect } from 'react';
import { getDatabase } from '../database';
import './pages.css';

interface PecaEstoque {
    id: number;
    codigo: string;
    descricao: string;
    quantidade: number;
    preco_custo: number;
    preco_venda: number;
}

interface Servico {
    id: number;
    nome: string;
    descricao: string;
    preco: number;
}

const Orcamento = () => {
    const [pecas, setPecas] = useState<PecaEstoque[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [selectedPecas, setSelectedPecas] = useState<number[]>([]);
    const [selectedServicoId, setSelectedServicoId] = useState<number | null>(null);
    const [mensagem, setMensagem] = useState('');
    const [total, setTotal] = useState(0);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        const db = await getDatabase();
        const [pecasRows, servicosRows] = await Promise.all([
            db.select<PecaEstoque[]>('SELECT * FROM pecas_estoque ORDER BY descricao'),
            db.select<Servico[]>('SELECT * FROM servicos ORDER BY nome')
        ]);
        setPecas(pecasRows);
        setServicos(servicosRows);
    };

    const togglePeca = (id: number) => {
        setSelectedPecas(prev => 
            prev.includes(id) 
                ? prev.filter(i => i !== id) 
                : [...prev, id]
        );
    };

    const selecionarServico = (id: number | null) => {
        setSelectedServicoId(id);
    };

    const calcularTotal = () => {
        let soma = 0;
        pecas.forEach(p => {
            if (selectedPecas.includes(p.id)) {
                soma += p.preco_venda;
            }
        });
        const servico = servicos.find(s => s.id === selectedServicoId);
        if (servico) {
            soma += servico.preco;
        }
        setTotal(soma);
    };

    const gerarMensagem = () => {
        let msg = 'Orçamento:\n';
        pecas.forEach(p => {
            if (selectedPecas.includes(p.id)) {
                msg += `- ${p.descricao}: R$ ${p.preco_venda.toFixed(2).replace('.', ',')}\n`;
            }
        });
        const servico = servicos.find(s => s.id === selectedServicoId);
        if (servico) {
            msg += `- Serviço: ${servico.nome}`;
            if (servico.descricao) {
                msg += ` (${servico.descricao})`;
            }
            msg += `: R$ ${servico.preco.toFixed(2).replace('.', ',')}\n`;
        }
        msg += `\nTotal: R$ ${total.toFixed(2).replace('.', ',')}`;
        setMensagem(msg);
    };

    useEffect(() => {
        calcularTotal();
        gerarMensagem();
    }, [selectedPecas, selectedServicoId, pecas, servicos]);

    const copiarParaAreaDeTransferencia = async () => {
        try {
            await navigator.clipboard.writeText(mensagem);
            alert('Mensagem copiada para a área de transferência!');
        } catch (err) {
            alert('Falha ao copiar: ' + err);
        }
    };

    return (
        <div className="pagina-container">
            <h1>💰 Orçamento</h1>

            <div className="orcamento-secoes">
                <section className="orcamento-section">
                    <h2>Peças e Produtos do Estoque</h2>
                    {pecas.length === 0 ? (
                        <p className="sem-dados">Nenhum item cadastrado no estoque.</p>
                    ) : (
                        <ul className="lista-selecao">
                            {pecas.map(p => (
                                <li key={p.id} className="item-selecao">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={selectedPecas.includes(p.id)}
                                            onChange={() => togglePeca(p.id)}
                                        />
                                        <span>
                                            {p.descricao} 
                                            {p.codigo && ` (${p.codigo})`} 
                                            : R$ {p.preco_venda.toFixed(2).replace('.', ',')}
                                        </span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="orcamento-section">
                    <h2>Serviços</h2>
                    {servicos.length === 0 ? (
                        <p className="sem-dados">Nenhum serviço cadastrado.</p>
                    ) : (
                        <ul className="lista-selecao">
                            {servicos.map(s => (
                                <li key={s.id} className="item-selecao">
                                    <label>
                                        <input
                                            type="radio"
                                            name="servico"
                                            checked={selectedServicoId === s.id}
                                            onChange={() => selecionarServico(s.id)}
                                        />
                                        <span>
                                            {s.nome}
                                            {s.descricao && ` (${s.descricao})`} 
                                            : R$ {s.preco.toFixed(2).replace('.', ',')}
                                        </span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <div className="orcamento-resumo">
                <h2>Resumo do Orçamento</h2>
                <textarea 
                    value={mensagem} 
                    readOnly 
                    className="textarea-orcamento"
                />
                <div className="orcamento-actions">
                    <button className="botao-config" onClick={copiarParaAreaDeTransferencia}>
                        📋 Copiar Mensagem
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Orcamento;