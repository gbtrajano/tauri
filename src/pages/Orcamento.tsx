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
    const [selectedServicos, setSelectedServicos] = useState<number[]>([]);
    const [mensagem, setMensagem] = useState('');

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

    const toggleServico = (id: number) => {
        setSelectedServicos(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const calcularEGerar = (currentPecas: number[], currentServicos: number[]) => {
        let soma = 0;
        pecas.forEach(p => {
            if (currentPecas.includes(p.id)) {
                soma += p.preco_venda;
            }
        });
        servicos.forEach(s => {
            if (currentServicos.includes(s.id)) {
                soma += s.preco;
            }
        });

        let msg = 'Orçamento:\n';
        pecas.forEach(p => {
            if (currentPecas.includes(p.id)) {
                msg += `- ${p.descricao}: R$ ${p.preco_venda.toFixed(2).replace('.', ',')}\n`;
            }
        });
        servicos.forEach(s => {
            if (currentServicos.includes(s.id)) {
                msg += `- Serviço: ${s.nome}`;
                if (s.descricao) {
                    msg += ` (${s.descricao})`;
                }
                msg += `: R$ ${s.preco.toFixed(2).replace('.', ',')}\n`;
            }
        });
        msg += `\nTotal: R$ ${soma.toFixed(2).replace('.', ',')}`;
        setMensagem(msg);
    };

    useEffect(() => {
        calcularEGerar(selectedPecas, selectedServicos);
    }, [selectedPecas, selectedServicos, pecas, servicos]);

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
                                            type="checkbox"
                                            checked={selectedServicos.includes(s.id)}
                                            onChange={() => toggleServico(s.id)}
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