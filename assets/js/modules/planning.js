// =====================================
// LÓGICA DO PLANEJAMENTO SEMANAL MACRO
// =====================================

export function iniciarEventosPlanejamento() {
  const modalFoco = document.getElementById('modal-foco');
  const formFoco = document.getElementById('form-foco');
  const btnCancelar = document.getElementById('btn-cancelar-foco');
  const inputDiaOculto = document.getElementById('input-foco-dia');
  const inputTextoFoco = document.getElementById('input-foco-texto');
  const tituloModal = document.getElementById('modal-foco-titulo');

  // 1. Pega todos os botões '+' da semana
  const botoesAdd = document.querySelectorAll('.btn-add-foco');

  // 2. Adiciona o evento de clique em cada botão
  botoesAdd.forEach(botao => {
    botao.addEventListener('click', (e) => {
      // Descobre de qual dia é o botão que foi clicado
      const cardDia = e.target.closest('.dia-card');
      const diaDaSemana = cardDia.dataset.dia;

      // Preenche o modal com as informações
      inputDiaOculto.value = diaDaSemana;
      inputTextoFoco.value = ''; // Limpa o campo de texto

      // Deixa o título dinâmico (Opcional, mas fica legal!)
      const nomesDias = {
        segunda: 'Segunda-feira', terca: 'Terça-feira', quarta: 'Quarta-feira',
        quinta: 'Quinta-feira', sexta: 'Sexta-feira', sabado: 'Sábado', domingo: 'Domingo'
      };
      tituloModal.innerText = `🎯 Foco para ${nomesDias[diaDaSemana]}`;

      modalFoco.showModal();
    });
  });

  // 3. Fecha o modal no botão Cancelar
  if (btnCancelar) {
    btnCancelar.addEventListener('click', () => modalFoco.close());
  }

  // 4. Salva o novo foco
  if (formFoco) {
    formFoco.addEventListener('submit', async (e) => {
      e.preventDefault();

      const texto = inputTextoFoco.value.trim();
      const dia = inputDiaOculto.value;

      if (texto) {
        // Encontra a lista (<ul>) correspondente ao dia escolhido
        const cardCorreto = document.querySelector(`.dia-card[data-dia="${dia}"]`);
        const listaTarefas = cardCorreto.querySelector('.macro-tarefas');

        // Cria a nova linha visualmente
        const novaLi = document.createElement('li');
        novaLi.innerText = texto;
        listaTarefas.appendChild(novaLi);

        // --- AQUI ENTRARIA O CÓDIGO DO SUPABASE PARA SALVAR NO BANCO ---
        // await supabaseClient.from('dash_macro_semana').insert([...]);

        modalFoco.close();
      }
    });
  }
}