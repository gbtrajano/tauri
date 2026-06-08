import { useState, useEffect } from 'react';
import { getDatabase } from '../database';

interface Stats {
  clientes: number;
  veiculos: number;
  servicos: number;
  ordensAbertas: number;
  estoqueBaixo: number;
  valorEstoque: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    clientes: 0,
    veiculos: 0,
    servicos: 0,
    ordensAbertas: 0,
    estoqueBaixo: 0,
    valorEstoque: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const db = await getDatabase();
        const [
          clientesResult,
          veiculosResult,
          servicosResult,
          ordensAbertasResult,
          estoqueBaixoResult,
          valorEstoqueResult,
        ] = await Promise.all([
          db.select<{ count: number }[]>('SELECT COUNT(*) as count FROM clientes'),
          db.select<{ count: number }[]>('SELECT COUNT(*) as count FROM veiculos'),
          db.select<{ count: number }[]>('SELECT COUNT(*) as count FROM servicos'),
          db.select<{ count: number }[]>('SELECT COUNT(*) as count FROM ordens_servico WHERE status = ?', ['aberta']),
          db.select<{ count: number }[]>('SELECT COUNT(*) as count FROM pecas_estoque WHERE quantidade < 5'),
          db.select<{ total: number }[]>('SELECT COALESCE(SUM(quantidade * preco_venda), 0) as total FROM pecas_estoque'),
        ]);

        setStats({
          clientes: clientesResult[0].count,
          veiculos: veiculosResult[0].count,
          servicos: servicosResult[0].count,
          ordensAbertas: ordensAbertasResult[0].count,
          estoqueBaixo: estoqueBaixoResult[0].count,
          valorEstoque: valorEstoqueResult[0].total,
        });
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <div className="pagina-container"><p>Carregando estatísticas...</p></div>;
  if (error) return <div className="pagina-container"><p>Erro: {error}</p></div>;

  return (
    <div className="pagina-container">
      <h1>📊 Dashboard</h1>
      <div className="dashboard-grid">
        <div className="card">
          <h2>👥 Clientes</h2>
          <div className="valor">{stats.clientes}</div>
        </div>
        <div className="card">
          <h2>🚗 Veículos</h2>
          <div className="valor">{stats.veiculos}</div>
        </div>
        <div className="card">
          <h2>🔧 Serviços Cadastrados</h2>
          <div className="valor">{stats.servicos}</div>
        </div>
        <div className="card">
          <h2>📋 Ordens Abertas</h2>
          <div className="valor">{stats.ordensAbertas}</div>
        </div>
        <div className="card">
          <h2>⚠️ Estoque Baixo (&lt; 5)</h2>
          <div className="valor">{stats.estoqueBaixo}</div>
        </div>
        <div className="card">
          <h2>💰 Valor Total em Estoque</h2>
          <div className="valor">R$ {stats.valorEstoque.toFixed(2).replace('.', ',')}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;