// =======================================
// assets/js/modules/finance.js
// =======================================

import { supabaseClient } from './supabase.js';

let contas = [];

export async function carregarFinanceiro() {
  const { data, error } = await supabaseClient
    .from('dash_financas')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao carregar finanças:', error);
    return;
  }

  contas = data;
  renderizarFinanceiro();
}

function renderizarFinanceiro() {
  const lista = document.getElementById('lista-financeira');
  lista.innerHTML = '';
  let totalPendente = 0;

  // Ordena: não pagas primeiro, pagas no final
  const contasOrdenadas = [...contas].sort((a, b) => a.pago - b.pago);

  contasOrdenadas.forEach(conta => {
    const li = document.createElement('li');
    li.className = `fin-item ${conta.pago ? 'pago' : ''}`;
    
    // O valor do banco de dados (NUMERIC) pode vir como string em requisições HTTP, então convertemos:
    const valorFormatado = parseFloat(conta.valor).toFixed(2).replace('.', ',');

    li.innerHTML = `
      <div class="fin-status" title="Clique para alterar o status"></div>
      <div class="fin-detalhes">
          <span class="fin-nome">${conta.nome}</span>
          <span class="fin-vencimento">Vence: ${conta.vencimento}</span>
      </div>
      <span class="fin-valor">R$ ${valorFormatado}</span>
      <span class="fin-deletar" title="Excluir conta">✖</span>
    `;

    // Evento: Marcar/Desmarcar como Pago (Update)
    li.querySelector('.fin-status').addEventListener('click', async () => {
      conta.pago = !conta.pago; 
      renderizarFinanceiro(); // Atualiza a tela (e o total) instantaneamente
      
      await supabaseClient
        .from('dash_financas')
        .update({ pago: conta.pago })
        .eq('id', conta.id);
    });

    // Evento: Deletar Conta
    li.querySelector('.fin-deletar').addEventListener('click', async () => {
      if (confirm(`Deseja remover a conta "${conta.nome}"?`)) {
        contas = contas.filter(c => c.id !== conta.id);
        renderizarFinanceiro(); 
        
        await supabaseClient
          .from('dash_financas')
          .delete()
          .eq('id', conta.id);
      }
    });

    lista.appendChild(li);

    if (!conta.pago) {
      totalPendente += parseFloat(conta.valor);
    }
  });

  // Atualiza o total na tela
  const spanTotal = document.getElementById('fin-total');
  spanTotal.innerText = `R$ ${totalPendente.toFixed(2).replace('.', ',')}`;
  
  if (totalPendente === 0) {
    spanTotal.style.color = 'var(--text-muted)';
  } else {
    spanTotal.style.color = 'var(--cor-falha)'; // Alerta visual quando há contas
  }
}

export function iniciarEventosFinanceiro() {
  const modalFin = document.getElementById('modal-financeiro');
  const btnNovaConta = document.getElementById('btn-nova-conta');
  const formFin = document.getElementById('form-financeiro');
  const btnCancelarFin = document.getElementById('btn-cancelar-fin');

  // Abre Modal
  btnNovaConta.addEventListener('click', () => {
    document.getElementById('fin-input-nome').value = '';
    document.getElementById('fin-input-vencimento').value = '';
    document.getElementById('fin-input-valor').value = '';
    modalFin.showModal();
  });

  // Cancela Modal
  btnCancelarFin.addEventListener('click', () => modalFin.close());

  // Salvar Nova Conta (Insert)
  formFin.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('fin-input-nome').value;
    const vencimento = document.getElementById('fin-input-vencimento').value;
    const valor = parseFloat(document.getElementById('fin-input-valor').value);
    
    modalFin.close();

    const { data, error } = await supabaseClient
      .from('dash_financas')
      .insert([{ nome, vencimento, valor, pago: false }])
      .select();

    if (!error && data) {
      contas.push(data[0]);
      renderizarFinanceiro();
    }
  });
}