// =====================================
// assets/js/modules/calendario.js
// =====================================

export function renderizarCalendario() {
  const diasContainer = document.getElementById('calendario-dias');
  const tituloMes = document.getElementById('mes-ano-topo');
  if (!diasContainer) return;

  const hoje = new Date();
  const mes = hoje.getMonth();
  const ano = hoje.getFullYear();
  const diaAtual = hoje.getDate();

  const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  tituloMes.innerText = `📅 ${nomesMeses[mes]} ${ano}`;

  // Descobre quantos dias tem este mês (O truque é pedir o dia '0' do mês seguinte)
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  // Descobre qual dia da semana cai o dia 1º (0 = Domingo, 6 = Sábado)
  const primeiroDiaDaSemana = new Date(ano, mes, 1).getDay();

  diasContainer.innerHTML = ''; // Limpa antes de desenhar

  // 1. Injeta divs vazias até chegar no dia 1º
  for (let i = 0; i < primeiroDiaDaSemana; i++) {
    const divVazia = document.createElement('div');
    divVazia.className = 'cal-dia vazio';
    diasContainer.appendChild(divVazia);
  }

  // 2. Cria os dias do mês
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const divDia = document.createElement('div');
    divDia.className = 'cal-dia';
    divDia.innerText = dia;

    // Descobre em que dia da semana cai este número
    const diaSemana = new Date(ano, mes, dia).getDay();

    // Aplica as cores de final de semana
    if (diaSemana === 0) divDia.classList.add('domingo');
    if (diaSemana === 6) divDia.classList.add('sabado');

    // Destaca o dia de hoje
    if (dia === diaAtual) divDia.classList.add('hoje');

    diasContainer.appendChild(divDia);
  }
}