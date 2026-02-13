// 1. Pegando os elementos do DOM que vamos usar
const form = document.querySelector('form'); // formulário inteiro
const selectMoedaDe = document.getElementById('moeda-de'); // select "de"
const selectMoedaPara = document.getElementById('moeda-para'); // select "para"
const inputValor = document.getElementById('valor'); // input de valor

// Elementos para mostrar os resultados na página
const figuraDe = document.querySelector('section.box-logo figure:first-child p'); // parágrafo do "de"
const figuraPara = document.querySelector('section.box-logo figure:last-child p'); // parágrafo do "para"

const imgMoedaDe = document.getElementById('img-moeda-de'); // imagem da moeda "de"
const imgMoedaPara = document.getElementById('img-moeda-para'); // imagem da moeda "para"
const nomeMoedaDe = document.getElementById('nome-moeda-de'); // nome moeda "de"
const nomeMoedaPara = document.getElementById('nome-moeda-para'); // nome moeda "para"

// 2. Objeto com as cotações (inicialmente fictícios, serão atualizados)
const cotacoes = {
  BRL: 1,
  USD: 5.30,
  GBP: 7.10,
  EUR: 6.20,
  BTC: 120000, // valor fictício
  JPY: 0.048
};

// 3. Objeto com as informações das moedas (nome, imagem e símbolo)
const moedasInfo = {
  BRL: { nome: 'Real Brasileiro', img: './assets/brasil.png', simbolo: 'R$' },
  USD: { nome: 'Dólar Americano', img: './assets/estados-unidos.png', simbolo: 'US$' },
  GBP: { nome: 'Libra Esterlina', img: './assets/libra.png', simbolo: '£' },
  EUR: { nome: 'Euro', img: './assets/euro.png', simbolo: '€' },
  BTC: { nome: 'Bitcoin', img: './assets/bitcoin.png', simbolo: '₿' },
  JPY: { nome: 'Iene Japonês', img: './assets/iene.png', simbolo: '¥' }
};

// 4. Função para formatar valores com símbolo da moeda usando Intl.NumberFormat
function formatarValor(valor, moeda) {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: moeda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(valor);
}

// 5. Função async para buscar cotação real da API AwesomeAPI
const buscarCotacao = async (moedaDe, moedaPara) => {
  if (moedaDe === moedaPara) return 1;

  // Tratamento especial: BRL -> BTC não existe, inverte BTC->BRL
  if (moedaDe === 'BRL' && moedaPara === 'BTC') {
    const btcToBrl = await buscarCotacao('BTC', 'BRL');
    return 1 / btcToBrl;
  }

  const parMoeda = `${moedaDe}-${moedaPara}`;

  try {
    const response = await fetch(`https://economia.awesomeapi.com.br/json/last/${parMoeda}`);
    if (!response.ok) throw new Error('Erro na requisição da API');

    const data = await response.json();
    const chave = parMoeda.replace('-', '');

    return Number(data[chave].bid);
  } catch (error) {
    console.warn('API não respondeu, usando valores fixos.', error);
    return null; // fallback será usado
  }
};

// 6. Função para atualizar o objeto cotacoes com dados da API
const atualizarCotacoes = async () => {
  const moedasParaAtualizar = Object.keys(cotacoes).filter(m => m !== 'BRL'); // todas menos BRL
  const pares = moedasParaAtualizar.map(moeda => `${moeda}-BRL`).join(',');

  try {
    const response = await fetch(`https://economia.awesomeapi.com.br/json/last/${pares}`);
    if (!response.ok) throw new Error('Erro ao buscar cotações da API');

    const dados = await response.json();

    moedasParaAtualizar.forEach(moeda => {
      const chave = `${moeda}BRL`;
      if (dados[chave] && dados[chave].bid) {
        cotacoes[moeda] = Number(dados[chave].bid);
      }
    });

    console.log('Cotacoes atualizadas:', cotacoes);
  } catch (error) {
    console.error('Falha ao atualizar cotações:', error);
  }
};

// 7. Evento submit do formulário
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const moedaDe = selectMoedaDe.value;
  const moedaPara = selectMoedaPara.value;
  const valor = Number(inputValor.value);

  if (!valor || valor <= 0) {
    alert('Por favor, digite um valor válido!');
    return;
  }

  // Atualiza as cotações fixas antes da conversão
  await atualizarCotacoes();

  // Busca a cotação real da API
  const cotacao = await buscarCotacao(moedaDe, moedaPara);

  // Usa fallback atualizado se API falhar
  const cotacaoUsada = cotacao || (cotacoes[moedaDe] / cotacoes[moedaPara]);

  const valorConvertido = valor * cotacaoUsada;

  // Atualiza textos com valores formatados corretamente
  figuraDe.textContent = formatarValor(valor, moedaDe);
  figuraPara.textContent = formatarValor(valorConvertido, moedaPara);

  // Atualiza imagens e nomes das moedas
  imgMoedaDe.src = moedasInfo[moedaDe].img;
  imgMoedaDe.alt = moedasInfo[moedaDe].nome;
  nomeMoedaDe.textContent = moedasInfo[moedaDe].nome;

  imgMoedaPara.src = moedasInfo[moedaPara].img;
  imgMoedaPara.alt = moedasInfo[moedaPara].nome;
  nomeMoedaPara.textContent = moedasInfo[moedaPara].nome;
});