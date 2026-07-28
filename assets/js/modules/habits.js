// =======================================
// assets/js/modules/habits.js
// =======================================

import { supabaseClient } from './supabase.js';

let habitos = [];
const iniciaisDias = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export async function carregarHabitos() {
  const { data, error } = await supabaseClient
    .from('dash_habitos')
    .select('*')
    .order('created_at', { ascending: true });

  if (!error) {
    habitos = data;
    renderizarHabitos();
  }
}

function renderizarHabitos() {
  const container = document.getElementById('lista-habitos-container');
  container.innerHTML = '';

  habitos.forEach((habito, indexHabito) => {
    const divItem = document.createElement('div');
    divItem.className = 'habito-item';

    // Nome do hábito e botão de deletar
    const divInfo = document.createElement('div');
    divInfo.style.display = 'flex';
    divInfo.style.alignItems = 'center';
    divInfo.innerHTML = `
      <span class="habito-nome" title="${habito.nome}">${habito.nome}</span>
      <span class="habito-deletar" title="Excluir hábito">✖</span>
    `;

    // Evento: Deletar hábito (Supabase)
    divInfo.querySelector('.habito-deletar').addEventListener('click', async () => {
      if (confirm(`Remover o hábito "${habito.nome}"?`)) {
        const idDoHabito = habito.id;
        habitos.splice(indexHabito, 1);
        renderizarHabitos(); // Atualiza a tela imediatamente

        await supabaseClient
          .from('dash_habitos')
          .delete()
          .eq('id', idDoHabito);
      }
    });

    // Grid de dias
    const divDias = document.createElement('div');
    divDias.className = 'habito-dias';

    habito.dias.forEach((concluido, indexDia) => {
      const divDia = document.createElement('div');
      divDia.className = `dia ${concluido ? 'concluido' : ''}`;
      divDia.innerText = iniciaisDias[indexDia];
      divDia.title = iniciaisDias[indexDia];

      // Evento: Alternar status do dia ao clicar (Supabase)
      divDia.addEventListener('click', async () => {
        habito.dias[indexDia] = !habito.dias[indexDia];
        renderizarHabitos(); // Atualiza a tela imediatamente

        await supabaseClient
          .from('dash_habitos')
          .update({ dias: habito.dias })
          .eq('id', habito.id);
      });

      divDias.appendChild(divDia);
    });

    divItem.appendChild(divInfo);
    divItem.appendChild(divDias);
    container.appendChild(divItem);
  });
}

export function iniciarEventosHabitos() {
  const btnNovo = document.getElementById('btn-novo-habito');

  const btnLimparSemana = document.getElementById('btn-limpar-habitos');

  if (btnLimparSemana) {
    btnLimparSemana.addEventListener('click', async () => {
      if (habitos.length === 0) return;

      if (confirm('Tem certeza que deseja zerar todos os dias para iniciar uma nova semana?')) {
        const arrayVazio = [false, false, false, false, false, false, false];

        habitos.forEach(habito => {
          habito.dias = [...arrayVazio];
        });
        renderizarHabitos();

        for (const habito of habitos) {
          await supabaseClient
            .from('dash_habitos')
            .update({ dias: arrayVazio })
            .eq('id', habito.id);
        }
      }
    });
  }

  btnNovo.addEventListener('click', async () => {
    const nome = prompt('Qual o nome do novo hábito?');
    if (nome && nome.trim() !== '') {
      const arrayVazio = [false, false, false, false, false, false, false];

      const { data, error } = await supabaseClient
        .from('dash_habitos')
        .insert([{ nome: nome.trim(), dias: arrayVazio }])
        .select();

      if (!error && data) {
        habitos.push(data[0]);
        renderizarHabitos();
      }
    }
  });
}