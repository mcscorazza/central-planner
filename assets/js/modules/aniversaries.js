import { supabaseClient } from './supabase.js';

let todosAniversarios = [];

export async function carregarAniversarios() {
  const { data, error } = await supabaseClient
    .from('dash_aniversarios')
    .select('*');

  if (!error && data) {
    todosAniversarios = data;
    renderizarAniversarios();
  }
}

function renderizarAniversarios() {
  const container = document.getElementById('lista-aniversarios');
  if (!container) return;
  container.innerHTML = '';

  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1; // getMonth vai de 0 a 11, então somamos 1
  const diaAtual = hoje.getDate();

  // 1. Filtra apenas quem faz aniversário neste mês
  const aniversariantesDoMes = todosAniversarios.filter(pessoa => {
    // A data vem do banco no padrão "YYYY-MM-DD"
    const [, mesBanco] = pessoa.data_nascimento.split('-');
    return parseInt(mesBanco) === mesAtual;
  });

  // 2. Ordena pelo dia (do menor para o maior)
  aniversariantesDoMes.sort((a, b) => {
    const diaA = parseInt(a.data_nascimento.split('-')[2]);
    const diaB = parseInt(b.data_nascimento.split('-')[2]);
    return diaA - diaB;
  });

  // 3. Desenha na tela
  aniversariantesDoMes.forEach(pessoa => {
    const [ano, mes, dia] = pessoa.data_nascimento.split('-');
    const ehHoje = parseInt(dia) === diaAtual;

    // Calcula a idade que a pessoa está fazendo
    const idade = hoje.getFullYear() - parseInt(ano);

    const li = document.createElement('li');
    li.className = `aniv-item ${ehHoje ? 'aniv-hoje' : ''}`;

    // Pega a primeira letra do nome para fazer um avatar bonitinho
    const inicial = pessoa.nome.charAt(0).toUpperCase();

    li.innerHTML = `
      <div class="aniv-avatar">${inicial}</div>
      <div class="aniv-detalhes">
        <span class="aniv-nome">${pessoa.nome}</span>
        <span class="aniv-data">${dia}/${mes} • Faz ${idade} anos</span>
      </div>
      ${ehHoje ? '<span class="aniv-badge">Hoje! 🎉</span>' : ''}
      <span class="aniv-deletar" title="Remover">✖</span>
    `;

    // Função de Excluir
    li.querySelector('.aniv-deletar').addEventListener('click', async () => {
      if (confirm(`Remover ${pessoa.nome} da lista?`)) {
        await supabaseClient.from('dash_aniversarios').delete().eq('id', pessoa.id);
        carregarAniversarios(); // recarrega
      }
    });

    container.appendChild(li);
  });

  if (aniversariantesDoMes.length === 0) {
    container.innerHTML = `<li style="text-align:center; color: var(--text-muted); padding: 12px 0;">Nenhum aniversário este mês.</li>`;
  }
}

export function iniciarEventosAniversarios() {
  const btnNovo = document.getElementById('btn-novo-aniv');
  const modalAniv = document.getElementById('modal-aniversario');
  const formAniv = document.getElementById('form-aniversario');
  const btnCancelar = document.getElementById('btn-cancelar-aniv');

  if (btnNovo && modalAniv) {
    btnNovo.addEventListener('click', () => {
      formAniv.reset();
      modalAniv.showModal();
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener('click', () => {
      modalAniv.close();
    });
  }

  if (formAniv) {
    formAniv.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nome = document.getElementById('input-aniv-nome').value.trim();
      const dataNascimento = document.getElementById('input-aniv-data').value;
      if (nome && dataNascimento) {
        await supabaseClient
          .from('dash_aniversarios')
          .insert([{ nome: nome, data_nascimento: dataNascimento }]);

        carregarAniversarios();
        modalAniv.close();
      }
    });
  }
}