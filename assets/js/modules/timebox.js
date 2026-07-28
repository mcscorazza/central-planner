// =====================================
// assets/js/modules/timebox.js
// =====================================

import { supabaseClient } from './supabase.js';

let timeboxState = {};

// Pega a data local no formato YYYY-MM-DD para salvar no banco
const fusoHorarioOffset = (new Date()).getTimezoneOffset() * 60000;
const hoje = (new Date(Date.now() - fusoHorarioOffset)).toISOString().split('T')[0];

const grade = document.getElementById('grade-horarios');
const modal = document.getElementById('modal-tarefa');
const formTarefa = document.getElementById('form-tarefa');
const modalConfirmacao = document.getElementById('modal-confirmacao');

export async function carregarTimebox() {
  inicializarGrade(); // Monta os blocos vazios primeiro

  const { data, error } = await supabaseClient
    .from('dash_timebox')
    .select('*')
    .eq('data_referencia', hoje); // Filtra apenas o dia de hoje!

  if (error) {
    console.error('Erro ao carregar Timebox:', error);
    return;
  }

  // Alimenta o estado local e desenha na tela
  data.forEach(bloco => {
    timeboxState[bloco.hora_id] = { 
      titulo: bloco.titulo, 
      corSelecionada: bloco.cor, 
      duracao: bloco.duracao 
    };
    aplicarBlocoVisual(bloco.hora_id, bloco.titulo, bloco.cor, bloco.duracao);
  });
}

function inicializarGrade() {
  grade.innerHTML = '';
  for (let horaDec = 8; horaDec < 20; horaDec += 0.5) {
    const h = Math.floor(horaDec);
    const m = (horaDec % 1 === 0) ? '00' : '30';
    const horaFormatada = `${h.toString().padStart(2, '0')}:${m}`;
    const idOriginal = horaDec;
    const idStr = idOriginal.toString().replace('.', '_');

    const divLinha = document.createElement('div');
    divLinha.className = 'linha-tempo';
    divLinha.id = `linha-${idStr}`;

    const divBlock = document.createElement('div');
    divBlock.className = 'bloco-hora';
    divBlock.dataset.id = idOriginal;
    divBlock.id = `bloco-${idStr}`;

    divLinha.innerHTML = `<span class="hora-label">${horaFormatada}</span>`;
    divBlock.innerHTML = `<span class="texto-tarefa" id="texto-${idStr}">Livre</span>`;

    divBlock.addEventListener('click', () => {
      document.getElementById('input-hora-id').value = idOriginal;
      document.getElementById('modal-hora-display').innerText = horaFormatada;
      
      const textoAtual = document.getElementById(`texto-${idStr}`).innerText;
      document.getElementById('input-titulo').value = (textoAtual !== 'Livre') ? textoAtual : '';
      
      modal.showModal();
    });

    divLinha.appendChild(divBlock);
    grade.appendChild(divLinha);
  }
}

function aplicarBlocoVisual(idStr, titulo, corSelecionada, duracao) {
  const idOriginal = parseFloat(idStr.replace('_', '.'));
  const caixa = document.getElementById(`bloco-${idStr}`);
  if (!caixa) return;

  for (let i = 1; i < duracao; i++) {
    const proxId = idOriginal + (i * 0.5);
    const proxLinha = document.getElementById(`linha-${proxId.toString().replace('.', '_')}`);
    if (proxLinha) proxLinha.style.display = 'none';
  }

  const novaAltura = (32 * duracao) + (4 * (duracao - 1)); 
  caixa.style.height = `${novaAltura}px`;
  caixa.dataset.duracaoAtiva = duracao;

  document.getElementById(`texto-${idStr}`).innerText = titulo;
  document.getElementById(`texto-${idStr}`).style.color = '#ffffff';
  caixa.style.backgroundColor = `var(--${corSelecionada})`;
  caixa.style.border = "none";
}

async function limparBlocoLogico(idOriginalStr) {
  const caixa = document.getElementById(`bloco-${idOriginalStr}`);
  const duracaoAntiga = parseInt(caixa.dataset.duracaoAtiva) || 1;
  const idOriginalNum = parseFloat(idOriginalStr.replace('_', '.'));

  caixa.style.height = `var(--altura-bloco)`;
  caixa.style.backgroundColor = `var(--cor-vazio)`;
  caixa.style.border = "1px dashed rgba(255,255,255,0.1)"; // Retorna à borda original
  
  const texto = document.getElementById(`texto-${idOriginalStr}`);
  texto.innerText = 'Livre';
  texto.style.color = 'var(--text-muted)';
  caixa.dataset.duracaoAtiva = 1;

  for (let i = 1; i < duracaoAntiga; i++) {
    const proxId = idOriginalNum + (i * 0.5);
    const proxLinha = document.getElementById(`linha-${proxId.toString().replace('.', '_')}`);
    if (proxLinha) proxLinha.style.display = 'flex';
  }

  delete timeboxState[idOriginalStr];

  // Remove do Banco de Dados
  await supabaseClient
    .from('dash_timebox')
    .delete()
    .eq('data_referencia', hoje)
    .eq('hora_id', idOriginalStr);
}

export function iniciarEventosTimebox() {
  // Modal: Cancelar
  document.getElementById('btn-cancelar').addEventListener('click', () => modal.close());

  // Modal: Limpar UM Bloco
  document.getElementById('btn-limpar').addEventListener('click', async () => {
    const idOriginal = document.getElementById('input-hora-id').value;
    const caixaIdStr = idOriginal.toString().replace('.', '_');
    
    await limparBlocoLogico(caixaIdStr);
    modal.close();
  });

  // Modal: Salvar Bloco
  formTarefa.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idOriginal = parseFloat(document.getElementById('input-hora-id').value);
    const titulo = document.getElementById('input-titulo').value;
    const corSelecionada = document.getElementById('select-cor').value;
    const duracao = parseInt(document.getElementById('select-duracao').value);
    const caixaIdStr = idOriginal.toString().replace('.', '_');

    // Sempre limpa visualmente antes de aplicar o novo tamanho para não embolar
    await limparBlocoLogico(caixaIdStr);
    
    aplicarBlocoVisual(caixaIdStr, titulo, corSelecionada, duracao);
    timeboxState[caixaIdStr] = { titulo, corSelecionada, duracao };
    modal.close();

    // Faz o Upsert (Atualiza se já houver registro nesse horário, insere se for novo)
    await supabaseClient.from('dash_timebox').upsert(
      {
        data_referencia: hoje,
        hora_id: caixaIdStr,
        titulo: titulo,
        cor: corSelecionada,
        duracao: duracao
      }, 
      { onConflict: 'user_id, data_referencia, hora_id' }
    );
  });

  // Limpar DIA INTEIRO
  document.getElementById('btn-limpar-dia').addEventListener('click', () => {
    if (Object.keys(timeboxState).length > 0) modalConfirmacao.showModal();
  });

  document.getElementById('btn-cancelar-limpeza').addEventListener('click', () => modalConfirmacao.close());

  document.getElementById('btn-confirmar-limpeza').addEventListener('click', async () => {
    timeboxState = {};
    inicializarGrade(); // Reseta visualmente a grade toda
    modalConfirmacao.close();

    // Deleta do banco todos os blocos do dia de HOJE
    await supabaseClient
      .from('dash_timebox')
      .delete()
      .eq('data_referencia', hoje);
  });
}