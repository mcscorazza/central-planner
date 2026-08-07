// =====================================
// assets/js/modules/planejamento.js
// =====================================

import { supabaseClient } from './supabase.js';

// =====================================
// 1. FUNÇÃO PARA DESENHAR NA TELA
// =====================================
function desenharTarefaNaTela(listaContainer, id, texto, concluida) {
  const novaLi = document.createElement('li');
  novaLi.dataset.id = id;
  if (concluida) novaLi.classList.add('concluida');
  novaLi.innerHTML = `
    <span class="foco-texto">${texto}</span>
    <button class="btn-deletar-foco" title="Remover foco">✖</button>
  `;
  listaContainer.appendChild(novaLi);
}

// =====================================
// 2. CARREGAR OS DADOS DO BANCO
// =====================================
export async function carregarPlanejamento() {
  const { data, error } = await supabaseClient
    .from('dash_macro_semana')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao carregar planejamento:', error);
    return;
  }

  document.querySelectorAll('.macro-tarefas').forEach(ul => ul.innerHTML = '');
  data.forEach(tarefa => {
    const cardCorreto = document.querySelector(`.dia-card[data-dia="${tarefa.dia_semana}"]`);
    if (cardCorreto) {
      const listaTarefas = cardCorreto.querySelector('.macro-tarefas');
      desenharTarefaNaTela(listaTarefas, tarefa.id, tarefa.texto, tarefa.concluida);
    }
  });
}

// =====================================
// 3. EVENTOS: ADICIONAR, EDITAR E DELETAR
// =====================================
export function iniciarEventosPlanejamento() {
  const modalFoco = document.getElementById('modal-foco');
  const formFoco = document.getElementById('form-foco');
  const inputDiaOculto = document.getElementById('input-foco-dia');
  const inputTextoFoco = document.getElementById('input-foco-texto');
  const tituloModal = document.getElementById('modal-foco-titulo');

  document.querySelectorAll('.btn-add-foco').forEach(botao => {
    botao.addEventListener('click', (e) => {
      const cardDia = e.target.closest('.dia-card');
      const diaDaSemana = cardDia.dataset.dia;

      inputDiaOculto.value = diaDaSemana;
      inputTextoFoco.value = '';

      const nomesDias = {
        segunda: 'Segunda-feira', terca: 'Terça-feira', quarta: 'Quarta-feira',
        quinta: 'Quinta-feira', sexta: 'Sexta-feira', sabado: 'Sábado', domingo: 'Domingo'
      };
      tituloModal.innerText = `🎯 Foco para ${nomesDias[diaDaSemana]}`;

      modalFoco.showModal();
    });
  });

  document.getElementById('btn-cancelar-foco')?.addEventListener('click', () => modalFoco.close());

  // --- SALVAR NO BANCO ---
  if (formFoco) {
    formFoco.addEventListener('submit', async (e) => {
      e.preventDefault();

      const texto = inputTextoFoco.value.trim();
      const dia = inputDiaOculto.value;

      if (texto) {
        // Insere no banco de dados
        const { data, error } = await supabaseClient
          .from('dash_macro_semana')
          .insert([{ dia_semana: dia, texto: texto, concluida: false }])
          .select();

        if (error) {
          console.error('Erro ao salvar:', error);
          return;
        }

        if (data && data.length > 0) {
          const tarefaSalva = data[0];
          const cardCorreto = document.querySelector(`.dia-card[data-dia="${dia}"]`);
          const listaTarefas = cardCorreto.querySelector('.macro-tarefas');

          desenharTarefaNaTela(listaTarefas, tarefaSalva.id, tarefaSalva.texto, tarefaSalva.concluida);
        }

        modalFoco.close();
      }
    });
  }

  // --- ATUALIZAR STATUS E DELETAR ---
  const gridSemana = document.querySelector('.semana-grid');
  if (gridSemana) {
    gridSemana.addEventListener('click', async (e) => {

      const li = e.target.closest('li');
      if (!li) return;

      const idDaTarefa = li.dataset.id;

      // DELETAR
      if (e.target.classList.contains('btn-deletar-foco')) {
        if (confirm('Remover este foco?')) {
          li.remove();
          await supabaseClient.from('dash_macro_semana').delete().eq('id', idDaTarefa);
        }
        return;
      }

      // MARCAR CONCLUÍDO
      const clicouNoTexto = e.target.classList.contains('foco-texto');
      const clicouNaLinha = e.target.tagName === 'LI';

      if (clicouNoTexto || clicouNaLinha) {
        const estaConcluida = li.classList.toggle('concluida');
        await supabaseClient.from('dash_macro_semana').update({ concluida: estaConcluida }).eq('id', idDaTarefa);
      }
    });
  }
}

// =====================================
// 4. DESTACAR O DIA DE HOJE
// =====================================
export function destacarDiaAtual() {
  // O JavaScript conta os dias de 0 a 6. 
  // Criamos um array na mesma ordem batendo com os seus 'data-dia'
  const diasDaSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

  // Pega o número do dia de hoje e acha a palavra correspondente
  const hoje = new Date().getDay();
  const nomeDiaDeHoje = diasDaSemana[hoje];

  // 1. Remove a classe 'atual' de TODOS os cards (limpa o HTML fixo)
  document.querySelectorAll('.dia-card').forEach(card => {
    card.classList.remove('atual');
  });

  // 2. Acha o card de hoje e adiciona a classe 'atual'
  const cardHoje = document.querySelector(`.dia-card[data-dia="${nomeDiaDeHoje}"]`);
  if (cardHoje) {
    cardHoje.classList.add('atual');
  }
}