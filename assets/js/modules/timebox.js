// =====================================
// assets/js/modules/timebox.js
// =====================================

import { supabaseClient } from './supabase.js';

let timeboxState = {};

const grade = document.getElementById('grade-horarios');
const modal = document.getElementById('modal-tarefa');
const formTarefa = document.getElementById('form-tarefa');

// =========================================================
// FUNÇÃO UTILITÁRIA DE DATA (Subida para ficar global)
// =========================================================
function obterDataISO(diasDeDiferenca = 0) {
  const data = new Date();
  data.setDate(data.getDate() + diasDeDiferenca);
  return data.toISOString().split('T')[0];
}

// =========================================================
// CARREGAR DADOS DO SUPABASE
// =========================================================
export async function carregarTimebox() {
  inicializarGrade();
  const diasVisiveis = [obterDataISO(-1), obterDataISO(0), obterDataISO(1)];
  const { data, error } = await supabaseClient
    .from('dash_timebox')
    .select('*')
    .in('data_referencia', diasVisiveis);

  if (error) {
    console.error('Erro ao carregar Timebox:', error);
    return;
  }

  data.forEach(bloco => {
    timeboxState[bloco.hora_id] = {
      titulo: bloco.titulo,
      corSelecionada: bloco.cor,
      duracao: bloco.duracao
    };
    aplicarBlocoVisual(bloco.hora_id, bloco.titulo, bloco.cor, bloco.duracao);
  });
}

// =========================================================
// DESENHAR A GRADE VAZIA
// =========================================================
function inicializarGrade() {
  const dias = [
    { id: 'ontem', container: 'grade-ontem', dataIso: obterDataISO(-1) },
    { id: 'hoje', container: 'grade-hoje', dataIso: obterDataISO(0) },
    { id: 'amanha', container: 'grade-amanha', dataIso: obterDataISO(1) }
  ];

  dias.forEach(dia => {
    const gradeDia = document.getElementById(dia.container);
    if (!gradeDia) return;
    gradeDia.innerHTML = '';

    for (let horaDec = 7; horaDec < 18.5; horaDec += 0.5) {
      const h = Math.floor(horaDec);
      const m = (horaDec % 1 === 0) ? '00' : '30';
      const horaFormatada = `${h.toString().padStart(2, '0')}:${m}`;

      const idHora = horaDec.toString().replace('.', '_');
      const idUnico = `${dia.dataIso}_${idHora}`;

      const divLinha = document.createElement('div');
      divLinha.className = 'linha-tempo';
      divLinha.id = `linha-${idUnico}`;

      const divBlock = document.createElement('div');
      divBlock.className = 'bloco-hora';
      divBlock.dataset.id = idHora;
      divBlock.dataset.data = dia.dataIso;
      divBlock.id = `bloco-${idUnico}`;

      divLinha.innerHTML = `<span class="hora-label">${horaFormatada}</span>`;
      divBlock.innerHTML = `<span class="texto-tarefa" id="texto-${idUnico}">Livre</span>`;

      divBlock.addEventListener('click', () => abrirModal(idHora, horaFormatada, dia.dataIso, idUnico));

      divLinha.appendChild(divBlock);
      gradeDia.appendChild(divLinha);
    }
  });
}

// =========================================================
// LÓGICA DE MODAL E VISUAL
// =========================================================
function abrirModal(idHora, horaFormatada, dataIso, idUnico) {
  document.getElementById('input-hora-id').value = idHora;
  document.getElementById('input-data-id').value = dataIso;
  document.getElementById('modal-hora-display').innerText = `${horaFormatada} (${dataIso.split('-').reverse().join('/')})`;

  const textoAtual = document.getElementById(`texto-${idUnico}`).innerText;
  document.getElementById('input-titulo').value = (textoAtual !== 'Livre') ? textoAtual : '';

  modal.showModal();
}

function aplicarBlocoVisual(idUnico, titulo, corSelecionada, duracao) {
  const dataIso = idUnico.substring(0, 10);
  const horaStr = idUnico.substring(11);
  const idOriginal = parseFloat(horaStr.replace('_', '.'));
  const caixa = document.getElementById(`bloco-${idUnico}`);

  if (!caixa) return;

  for (let i = 1; i < duracao; i++) {
    const proxId = idOriginal + (i * 0.5);
    const proxIdStr = proxId.toString().replace('.', '_');
    const proxLinha = document.getElementById(`linha-${dataIso}_${proxIdStr}`);
    if (proxLinha) proxLinha.style.display = 'none';
  }

  const novaAltura = (32 * duracao) + (4 * (duracao - 1));
  caixa.style.height = `${novaAltura}px`;
  caixa.dataset.duracaoAtiva = duracao;

  const textoElement = document.getElementById(`texto-${idUnico}`);
  if (textoElement) {
    textoElement.innerText = titulo;
    textoElement.style.color = '#ffffff';
  }

  caixa.style.backgroundColor = `var(--${corSelecionada})`;
  caixa.style.border = "none";
}

function limparBlocoLogico(idUnicoDOM) {
  const caixa = document.getElementById(`bloco-${idUnicoDOM}`);
  if (!caixa) return;

  const duracaoAntiga = parseInt(caixa.dataset.duracaoAtiva) || 1;
  const dataReferencia = idUnicoDOM.substring(0, 10);
  const horaStr = idUnicoDOM.substring(11);
  const horaDec = parseFloat(horaStr.replace('_', '.'));

  caixa.style.height = `32px`;
  caixa.style.backgroundColor = `var(--bg-panel)`;
  caixa.style.border = "1px dashed rgba(255,255,255,0.1)";

  const textoElement = document.getElementById(`texto-${idUnicoDOM}`);
  if (textoElement) {
    textoElement.innerText = 'Livre';
    textoElement.style.color = 'var(--text-muted)';
  }
  caixa.dataset.duracaoAtiva = 1;

  for (let i = 1; i < duracaoAntiga; i++) {
    const proxId = horaDec + (i * 0.5);
    const proxIdStr = proxId.toString().replace('.', '_');
    const proxLinha = document.getElementById(`linha-${dataReferencia}_${proxIdStr}`);
    if (proxLinha) proxLinha.style.display = 'flex';
  }
}

// =========================================================
// EVENTOS (SALVAR E LIMPAR)
// =========================================================
export function iniciarEventosTimebox() {
  document.getElementById('btn-cancelar').addEventListener('click', () => modal.close());

  formTarefa.addEventListener('submit', async (e) => {
    e.preventDefault();
    const valorInputHora = document.getElementById('input-hora-id').value;
    const horaDec = parseFloat(valorInputHora.replace('_', '.'));
    const dataReferencia = document.getElementById('input-data-id').value;
    const titulo = document.getElementById('input-titulo').value;
    const corSelecionada = document.getElementById('select-cor').value;
    const duracao = parseInt(document.getElementById('select-duracao').value);

    const horaStr = horaDec.toString().replace('.', '_');
    const idUnicoDOM = `${dataReferencia}_${horaStr}`;

    limparBlocoLogico(idUnicoDOM);
    aplicarBlocoVisual(idUnicoDOM, titulo, corSelecionada, duracao);

    timeboxState[idUnicoDOM] = { titulo, corSelecionada, duracao };
    modal.close();

    await supabaseClient.from('dash_timebox').upsert(
      {
        data_referencia: dataReferencia,
        hora_id: idUnicoDOM,
        titulo: titulo,
        cor: corSelecionada,
        duracao: duracao
      },
      { onConflict: 'user_id, data_referencia, hora_id' }
    );
  });

  // CORREÇÃO 3: ADICIONADO BOTÃO DE LIMPAR (DELETAR DO BANCO)
  const btnLimpar = document.getElementById('btn-limpar');
  if (btnLimpar) {
    btnLimpar.addEventListener('click', async () => {
      const valorInputHora = document.getElementById('input-hora-id').value;
      const horaDec = parseFloat(valorInputHora.replace('_', '.'));
      const dataReferencia = document.getElementById('input-data-id').value;

      const horaStr = horaDec.toString().replace('.', '_');
      const idUnicoDOM = `${dataReferencia}_${horaStr}`;

      limparBlocoLogico(idUnicoDOM);
      delete timeboxState[idUnicoDOM];
      modal.close();

      await supabaseClient
        .from('dash_timebox')
        .delete()
        .match({ data_referencia: dataReferencia, hora_id: idUnicoDOM });
    });
  }
}