// =====================================
// assets/js/modules/courses.js
// =====================================

import { supabaseClient } from './supabase.js';

let cursos = [];

export async function carregarCursos() {
  const { data, error } = await supabaseClient
    .from('dash_cursos')
    .select('*')
    .order('created_at', { ascending: true });

  if (!error) {
    cursos = data;
    renderizarCursos();
  }
}

function renderizarCursos() {
  const container = document.getElementById('lista-cursos-container');
  if (!container) return;

  container.innerHTML = '';

  cursos.forEach((curso, indexCurso) => {
    // Usamos <details> nativo do HTML para o Acordeon
    const details = document.createElement('details');
    details.className = 'curso-item';

    // Calcula o progresso (opcional, para ficar bonito no título)
    const estacoesTotal = curso.estacoes.length;
    const estacoesConcluidas = curso.estacoes.filter(e => e.concluida).length;
    let progresso = estacoesTotal > 0 ? Math.round((estacoesConcluidas / estacoesTotal) * 100) : 0;

    // Cabeçalho do curso
    const summary = document.createElement('summary');
    summary.innerHTML = `
      <div class="curso-header">
        <span class="curso-titulo">${curso.titulo}</span>
        <div class="curso-acoes">
          <span class="curso-progresso">${progresso}%</span>
          <span class="curso-deletar" title="Excluir Roadmap">✖</span>
        </div>
      </div>
    `;

    // Deletar Curso
    summary.querySelector('.curso-deletar').addEventListener('click', async (e) => {
      e.preventDefault(); // Impede o acordeon de abrir/fechar ao clicar no "X"
      if (confirm(`Remover o roadmap "${curso.titulo}" inteiro?`)) {
        const idDoCurso = curso.id;
        cursos.splice(indexCurso, 1);
        renderizarCursos();

        await supabaseClient.from('dash_cursos').delete().eq('id', idDoCurso);
      }
    });

    details.appendChild(summary);

    // Lista de Estações (O miolo do acordeon)
    const ulEstacoes = document.createElement('ul');
    ulEstacoes.className = 'lista-estacoes';

    curso.estacoes.forEach((estacao, indexEstacao) => {
      const li = document.createElement('li');
      li.className = `estacao-item ${estacao.concluida ? 'concluida' : ''}`;

      li.innerHTML = `
        <input type="checkbox" class="estacao-checkbox" ${estacao.concluida ? 'checked' : ''}>
        <span>${estacao.nome}</span>
      `;

      // Evento de marcar estação como concluída
      li.querySelector('input').addEventListener('change', async (e) => {
        curso.estacoes[indexEstacao].concluida = e.target.checked;
        renderizarCursos(); // Atualiza a tela (e a % de progresso)

        await supabaseClient
          .from('dash_cursos')
          .update({ estacoes: curso.estacoes })
          .eq('id', curso.id);
      });

      ulEstacoes.appendChild(li);
    });

    // Adiciona botão para inserir nova estação no final da lista
    const btnNovaEstacao = document.createElement('button');
    btnNovaEstacao.className = 'btn-add-estacao';
    btnNovaEstacao.innerText = '+ Adicionar Estação';
    btnNovaEstacao.addEventListener('click', async () => {
      const nomeEstacao = prompt(`Nome da nova estação/tópico para o roadmap "${curso.titulo}":`);
      if (nomeEstacao && nomeEstacao.trim() !== '') {
        curso.estacoes.push({ nome: nomeEstacao.trim(), concluida: false });
        // Mantém o acordeon aberto após adicionar
        details.open = true;
        renderizarCursos();

        await supabaseClient
          .from('dash_cursos')
          .update({ estacoes: curso.estacoes })
          .eq('id', curso.id);
      }
    });

    const acoesContainer = document.createElement('div');
    acoesContainer.className = 'estacao-acoes-container';
    acoesContainer.appendChild(btnNovaEstacao);

    details.appendChild(ulEstacoes);
    details.appendChild(acoesContainer);
    container.appendChild(details);
  });
}

export function iniciarEventosCursos() {
  const btnNovoCurso = document.getElementById('btn-novo-curso');
  if (btnNovoCurso) {
    btnNovoCurso.addEventListener('click', async () => {
      const titulo = prompt('Qual o nome do novo Roadmap ou Curso?');
      if (titulo && titulo.trim() !== '') {
        const { data, error } = await supabaseClient
          .from('dash_cursos')
          .insert([{ titulo: titulo.trim(), estacoes: [] }])
          .select();

        if (!error && data) {
          cursos.push(data[0]);
          renderizarCursos();
        }
      }
    });
  }
}