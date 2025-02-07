/* eslint-disable no-undef */

const ARTIFACT_PATH = "./../src/artifacts/contracts/Turing.sol/Turing.json";

const localBlockchainAddress = "http://127.0.0.1:8545/";

const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const provider = new ethers.providers.JsonRpcProvider(localBlockchainAddress)
const contractEvent = _intializeContract(provider);
let signer = provider.getSigner();

let rankingData = []

// window.ethereum.on("accountsChanged", async () => {
//   signer = provider.getSigner();
// });

async function _intializeContract(init) {
  const response = await fetch(ARTIFACT_PATH);
  const artifact = await response.json(); // Lê o JSON
  const abi = artifact.abi; // Extrai o  ABI
  const contract = new ethers.Contract(
      tokenAddress,
      abi,
      init
  );
  return contract
}

async function loadPage() {
  if (typeof window.ethereum !== "undefined") {
      try {
          const contract = await _intializeContract(signer);

          await getVotingStatus(contract);

          // Chama a função Solidity
          const rankingString = await contract.getRanking();
          rankingData = parseRankingData(rankingString);


          console.log("Ranking Recebido:", rankingData);
          updateRankingData();
      } catch (error) {
          console.error("Erro ao carregar ranking:", error);
      }
  } else {
      alert("MetaMask não encontrado! Instale-o para continuar.");
  }
}

function updateRankingData() {
  const rankingList = document.getElementById("rankingList");
  rankingList.innerHTML = ""; // Limpa a lista antes de adicionar novos elementos

  rankingData.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("ranking-item");
    div.innerHTML = `<span>${item.codename}</span> <span>${item.balance}</span>`;
    rankingList.appendChild(div);
  });
}

const voteButton = document.getElementById("button-vote");

async function getVotingStatus(contract){
  const [votingStatus] = await contract.functions.getVotingStatus();

  if(votingStatus) {
    switchInput.checked = true;
    voteButton.classList.remove("button-off");
    voteButton.classList.add("button-on");
  } else {
    switchInput.checked = false;
    voteButton.classList.add("button-off");
    voteButton.classList.remove("button-on");
  }
}

function parseRankingData(rankingString) {
  if (!rankingString || rankingString.trim() === "") return [];

  return rankingString.split(";") // Separa os candidatos
      .filter(item => item.includes("-")) // Filtra strings vazias
      .map(entry => {
          const [codename, balance] = entry.split("-"); // Divide nome e saldo
          return { codename, balance: formatBalance(balance) }; // Formata o saldo
      });
}

// Função para formatar o saldo (exemplo: converter "1000000000000000000" para "1 T")
function formatBalance(balance) {
  const balanceNum = BigInt(balance);
  // if (balanceNum >= 10n ** 18n) return (balanceNum / 10n ** 18n).toString() + " T";
  return balanceNum.toString() + " T"; // Se for menor que 1 T, retorna normal
}

// Carrega o ranking automaticamente ao carregar a página
window.addEventListener("load", loadPage);

// Seleciona o switch e o botão
const switchInput = document.querySelector(".switch input");

// Adiciona um evento para detectar mudanças no switch
switchInput.addEventListener("change", updateButtonState);

// Função para atualizar a classe do botão
async function updateButtonState() {

  const contract = await _intializeContract(signer);
  
  if (switchInput.checked) {
    voteButton.classList.remove("button-off");
    voteButton.classList.add("button-on");
    try {
      await contract.functions.votingOn();
    } catch (error) {
      alert("Unable to change Voting status");
      console.log(error);     
    }
  } else {
    voteButton.classList.add("button-off");
    voteButton.classList.remove("button-on");
    try {
      console.log(contract.functions);
      await contract.functions.votingOff();
    } catch (error) {
      alert("Unable to change Voting status");
      console.log(error);     
    }
  }
}

// Seleciona botão Issue Token e inputs
const issueTokenButton = document.getElementById("button-issue-token");
const codenameInput = document.getElementById("codename");
const amountInput = document.getElementById("amount");

// Adiciona Listener para botão Issue Token
issueTokenButton.addEventListener("click", async () => {
    const codename = codenameInput.value.trim(); // Remove espaços extras
    const amount = parseFloat(amountInput.value); // Converte string para número

    if (!codename || isNaN(amount) || amount <= 0) {
        alert("Por favor, preencha um codename válido e um amount maior que zero.");
        return;
    }

    codenameInput.value = amountInput.value = "";

    const contract = await _intializeContract(signer);
    try {
      await contract.issueToken(codename, amount);
    } catch (error) {
        console.log("Issue Token failed. Error message:", error.message);
    }
});

// Adiciona Listener para botão Vote
voteButton.addEventListener("click", async () => {
    if(!switchInput.checked){
      console.log("Unable to vote");
      return;
    }
  
    const codename = codenameInput.value.trim(); // Remove espaços extras
    const amount = parseFloat(amountInput.value); // Converte string para número

    if (!codename || isNaN(amount) || amount <= 0) {
        alert("Por favor, preencha um codename válido e um amount maior que zero.");
        return;
    }

    codenameInput.value = amountInput.value = "";

    const contract = await _intializeContract(signer);
    try {
      await contract.vote(codename, amount);
    } catch (error) {
        console.log("Vote failed. Error message:", error.reason);
    }
});

contractEvent.on('IssueToken', async (to, amount) => {
  console.log('Transfer event emitted. {to, amount}');
  rankingData.find(item => item.codename === to).amount += amount;
  updateRankingData();
});

/**
 * ISSUE TOKEN
 * 
 * RANKING E EVENTOS
 * 
 * VOTING
 * 
 * REQUIREMENTS
 */