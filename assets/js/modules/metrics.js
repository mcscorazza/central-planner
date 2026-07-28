// ====================================
// assets/js/modules/metrics.js
// ====================================

import { supabaseClient } from './supabase.js';

const fusoHorarioOffset = (new Date()).getTimezoneOffset() * 60000;
const hoje = (new Date(Date.now() - fusoHorarioOffset)).toISOString().split('T')[0];

let estadoDiario = {
  nivel_energia: null,
  sono_inicio: '',
  sono_fim: ''
};

export async function carregarMetricas() {
  const { data, error } = await supabaseClient
    .from('dash_metricas_diarias')
    .select('*')
    .eq('data_referencia', hoje)
    .maybeSingle();

  if (data) {
    estadoDiario.nivel_energia = data.nivel_energia || null;
    estadoDiario.sono_inicio = data.sono_inicio || '';
    estadoDiario.sono_fim = data.sono_fim || '';
  }

  renderizarEnergia();
  renderizarSono();
}

async function salvarMetricasNoBanco() {
  await supabaseClient.from('dash_metricas_diarias').upsert({
    data_referencia: hoje,
    nivel_energia: estadoDiario.nivel_energia,
    sono_inicio: estadoDiario.sono_inicio,
    sono_fim: estadoDiario.sono_fim
  }, { onConflict: 'user_id, data_referencia' });
}

const mensagensEnergia = {
  baixa: "Pegue leve. Foque apenas no essencial hoje.",
  media: "Ritmo constante. Bom dia para tarefas moderadas.",
  alta: "No auge! Ideal para deep work e projetos complexos."
};

function renderizarEnergia() {
  const botoesEnergia = document.querySelectorAll('.btn-energia');
  const textoStatus = document.getElementById('energia-status');

  // Limpa todos os botões com as classes específicas
  botoesEnergia.forEach(btn => {
    btn.classList.remove('ativa-baixa', 'ativa-media', 'ativa-alta');
  });

  if (estadoDiario.nivel_energia) {
    const btnAtivo = document.querySelector(`.btn-energia[data-nivel="${estadoDiario.nivel_energia}"]`);

    if (btnAtivo) {
      btnAtivo.classList.add(`ativa-${estadoDiario.nivel_energia}`);

      if (textoStatus) {
        textoStatus.innerText = mensagensEnergia[estadoDiario.nivel_energia];
        textoStatus.style.color = "var(--text-main)";
      }
    }
  }
}

export function iniciarEventosEnergia() {
  const botoes = document.querySelectorAll('.btn-energia');

  botoes.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const nivelSelecionado = e.currentTarget.dataset.nivel;

      estadoDiario.nivel_energia = nivelSelecionado;
      renderizarEnergia();

      await salvarMetricasNoBanco();
    });
  });
}


function calcularDuracaoSono(inicio, fim) {
  if (!inicio || !fim) return null;
  let [hInicio, mInicio] = inicio.split(':').map(Number);
  let [hFim, mFim] = fim.split(':').map(Number);

  let totalInicio = (hInicio * 60) + mInicio;
  let totalFim = (hFim * 60) + mFim;

  if (totalFim < totalInicio) totalFim += 24 * 60;

  let diff = totalFim - totalInicio;
  return { horas: Math.floor(diff / 60), minutos: diff % 60 };
}

function renderizarSono() {
  const inputInicio = document.getElementById('sono-inicio');
  const inputFim = document.getElementById('sono-fim');
  const divResultado = document.getElementById('sono-resultado');

  inputInicio.value = estadoDiario.sono_inicio;
  inputFim.value = estadoDiario.sono_fim;

  const duracao = calcularDuracaoSono(estadoDiario.sono_inicio, estadoDiario.sono_fim);

  if (duracao) {
    let cor = 'var(--cor-falha)';
    if (duracao.horas >= 7) cor = 'var(--cor-check)';
    else if (duracao.horas >= 5) cor = 'var(--cor-alerta)';

    divResultado.innerHTML = `Tempo total de descanso:<span class="sono-destaque" style="color: ${cor}">${duracao.horas}h ${duracao.minutos}m</span>`;
  } else {
    divResultado.innerHTML = `<span style="font-style: italic;">Insira os horários para calcular</span>`;
  }
}

export function iniciarEventosSono() {
  document.getElementById('btn-salvar-sono').addEventListener('click', async () => {
    estadoDiario.sono_inicio = document.getElementById('sono-inicio').value;
    estadoDiario.sono_fim = document.getElementById('sono-fim').value;
    renderizarSono();
    await salvarMetricasNoBanco();
  });
}