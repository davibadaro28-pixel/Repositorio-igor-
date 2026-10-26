// Sobe o sistema com um banco SEPARADO (server/data/demo.db) cheio de dados de exemplo:
// 30 dias de vendas, clientes, entregas, estoque e contas. Serve para testar e apresentar
// o sistema sem misturar com os dados reais da loja.
import { join } from 'node:path';

process.env.DB_PATH ||= join(import.meta.dirname, 'data', 'demo.db');
process.env.ADMIN_PASSWORD ||= 'demo1234';

const { start } = await import('./index.js');
const { get } = await import('./db.js');
const { generateDemoData } = await import('./demo-data.js');

if (!get('SELECT 1 FROM orders LIMIT 1')) {
  console.log('Criando dados de demonstração…');
  generateDemoData();
  console.log(`Pronto: ${get('SELECT COUNT(*) AS n FROM orders').n} pedidos de exemplo.`);
  console.log('Logins de teste: admin/demo1234 · caixa/caixa123 · cozinha/cozinha123 · motoboy/moto123');
}

// DEMO_MARCA=generica: mesma demonstração com o nome "Sua Doceria Aqui" (para apresentar a outras lojas)
if (process.env.DEMO_MARCA === 'generica') {
  const { applyGenericBrand } = await import('./brand.js');
  applyGenericBrand();
}

start();
