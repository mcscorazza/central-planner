// =====================================
// assets/js/modules/projetos.js
// =====================================

import { supabaseClient } from './supabase.js';

let projetosAtivos = [];

export async function carregarProjetos() {
  const { data, error } = await supabaseClient
    .from('dash_projetos')
    .select('*, dash_tarefas(*)')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao carregar projetos:', error);
    return;
  }

  projetosAtivos = data;
  renderizarProjetos();
}

function renderizarProjetos() {
  const container = document.getElementById('lista-projetos-container');
  container.innerHTML = '';

  projetosAtivos.forEach(projeto => {
    const divItem = document.createElement('div');
    divItem.className = `projeto-item ${projeto.aberto ? '' : 'collapsed'}`;
    
    // Cabeçalho do Projeto
    const divHeader = document.createElement('div');
    divHeader.className = 'projeto-header';
    divHeader.innerHTML = `
      <div class="projeto-titulo">${projeto.nome}</div>
      <div class="projeto-acoes">
        <button class="btn-add-tarefa" title="Adicionar Tarefa">+ tarefa</button>
        <span class="btn-deletar-projeto" title="Excluir Projeto">✖</span>
      </div>
    `;

    // Acordeon e Banco de Dados (Exclusivo: abre um, fecha os outros)
    divHeader.querySelector('.projeto-titulo').addEventListener('click', async () => {
      const estavaAberto = projeto.aberto;
      
      // Atualiza o visual e estado local
      projetosAtivos.forEach(p => p.aberto = false);
      if (!estavaAberto) projeto.aberto = true;
      renderizarProjetos();

      // Salva no banco o estado aberto/fechado em background
      await supabaseClient.from('dash_projetos').update({ aberto: false }).neq('id', '00000000-0000-0000-0000-000000000000'); // Fecha geral
      if (projeto.aberto) {
        await supabaseClient.from('dash_projetos').update({ aberto: true }).eq('id', projeto.id);
      }
    });

    // Modal de Nova Tarefa
    divHeader.querySelector('.btn-add-tarefa').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('input-id-projeto-tarefa').value = projeto.id;
      document.getElementById('input-desc-tarefa').value = '';
      document.getElementById('modal-nova-tarefa').showModal();
    });

    // Deletar Projeto (Delete Cascade atuará aqui)
    divHeader.querySelector('.btn-deletar-projeto').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm(`Tem certeza que deseja excluir o projeto "${projeto.nome}" e todas as tarefas?`)) {
        projetosAtivos = projetosAtivos.filter(p => p.id !== projeto.id);
        renderizarProjetos();
        await supabaseClient.from('dash_projetos').delete().eq('id', projeto.id);
      }
    });

    // Lista de Tarefas
    const ulTarefas = document.createElement('ul');
    ulTarefas.className = 'lista-tarefas';

    // Ordena as tarefas pela data de criação
    const tarefasOrdenadas = projeto.dash_tarefas.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    tarefasOrdenadas.forEach(tarefa => {
      const li = document.createElement('li');
      li.className = `tarefa-item ${tarefa.concluida ? 'concluida' : ''}`;
      li.innerHTML = `
        <input type="checkbox" class="tarefa-checkbox" ${tarefa.concluida ? 'checked' : ''}>
        <span>${tarefa.descricao}</span>
      `;

      // Atualizar Tarefa no Banco
      li.querySelector('input').addEventListener('change', async (e) => {
        const isChecked = e.target.checked;
        tarefa.concluida = isChecked;
        renderizarProjetos();
        await supabaseClient.from('dash_tarefas').update({ concluida: isChecked }).eq('id', tarefa.id);
      });

      ulTarefas.appendChild(li);
    });

    if (projeto.dash_tarefas.length === 0) {
      ulTarefas.innerHTML = `<li class="tarefa-item" style="color: var(--text-muted); font-style: italic; justify-content: center;">Nenhuma tarefa pendente</li>`;
    }

    divItem.appendChild(divHeader);
    divItem.appendChild(ulTarefas);
    container.appendChild(divItem);
  });
}

// Configura os modais e os envios de formulário
export function iniciarEventosProjetos() {
  const modalNovoProj = document.getElementById('modal-novo-projeto');
  const modalNovaTarefa = document.getElementById('modal-nova-tarefa');

  // NOVO PROJETO
  document.getElementById('btn-novo-projeto').addEventListener('click', () => {
    document.getElementById('input-nome-projeto').value = '';
    modalNovoProj.showModal();
  });

  document.getElementById('btn-cancelar-projeto').addEventListener('click', () => modalNovoProj.close());

  document.getElementById('form-novo-projeto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('input-nome-projeto').value;
    modalNovoProj.close();

    // Fecha os outros e cria o novo no banco
    projetosAtivos.forEach(p => p.aberto = false);
    await supabaseClient.from('dash_projetos').update({ aberto: false }).neq('id', '00000000-0000-0000-0000-000000000000');

    const { data } = await supabaseClient
      .from('dash_projetos')
      .insert([{ nome: nome, aberto: true }])
      .select('*, dash_tarefas(*)');

    projetosAtivos.push(data[0]);
    renderizarProjetos();
  });

  // NOVA TAREFA
  document.getElementById('btn-cancelar-tarefa').addEventListener('click', () => modalNovaTarefa.close());

  document.getElementById('form-nova-tarefa').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idProj = document.getElementById('input-id-projeto-tarefa').value;
    const desc = document.getElementById('input-desc-tarefa').value;
    modalNovaTarefa.close();

    const { data } = await supabaseClient
      .from('dash_tarefas')
      .insert([{ projeto_id: idProj, descricao: desc, concluida: false }])
      .select();

    // Acha o projeto localmente e insere a tarefa
    const projeto = projetosAtivos.find(p => p.id === idProj);
    if (projeto) {
      projeto.dash_tarefas.push(data[0]);
      projeto.aberto = true; // Força abrir para mostrar
      renderizarProjetos();
      // Atualiza banco pra deixar aberto
      await supabaseClient.from('dash_projetos').update({ aberto: true }).eq('id', idProj);
    }
  });
}