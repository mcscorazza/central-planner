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

function formatarTextoVencimento(dataStr) {
  if (!dataStr) return 'Sem data';

  let ano, mes, dia;
  if (dataStr.includes('-')) {
    [ano, mes, dia] = dataStr.split('-');
  } else if (dataStr.includes('/')) {
    [dia, mes, ano] = dataStr.split('/');
  } else {
    return dataStr;
  }

  const dataConta = new Date(ano, mes - 1, dia);
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);
  
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);

  const tempoConta = dataConta.getTime();
  
  if (tempoConta === hoje.getTime()) return 'Hoje';
  if (tempoConta === amanha.getTime()) return 'Amanhã';
  if (tempoConta === ontem.getTime()) return 'Ontem';

  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
}

function renderizarFinanceiro() {
  const lista = document.getElementById('lista-financeira');
  lista.innerHTML = '';
  let totalPendente = 0;

  const contasOrdenadas = [...contas].sort((a, b) => {
    if (a.pago !== b.pago) {
      return a.pago - b.pago; 
    }

    const converterParaData = (dataStr) => {
      if (!dataStr) return 9999999999999;

      if (dataStr.includes('-')) {
        return new Date(dataStr).getTime();
      }
      
      if (dataStr.includes('/')) {
        const [dia, mes, ano] = dataStr.split('/');
        return new Date(`${ano}-${mes}-${dia}`).getTime();
      }
      
      return 9999999999999; 
    };

    const valorA = converterParaData(a.vencimento);
    const valorB = converterParaData(b.vencimento);

    // 2. Desempate: Menor data (mais próxima) fica no topo
    return valorA - valorB;
  });

  contasOrdenadas.forEach(conta => {
const li = document.createElement('li');
    li.className = `fin-item ${conta.pago ? 'pago' : ''}`;
    const textoVencimento = formatarTextoVencimento(conta.vencimento);
    
    let estiloData = '';
    if (!conta.pago && (textoVencimento === 'Hoje' || textoVencimento === 'Ontem' || new Date(conta.vencimento) < new Date())) {
       estiloData = 'color: var(--cor-falha); font-weight: bold;';
    }

    li.innerHTML = `
      <div class="fin-status" title="Clique para alterar o status"></div>
      <div class="fin-detalhes">
          <span class="fin-nome">${conta.nome}</span>
          <span class="fin-vencimento" style="${estiloData}">Vence: ${textoVencimento}</span>
      </div>
      <span class="fin-valor">R$ ${conta.valor.toFixed(2).replace('.', ',')}</span>
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