/* eslint-disable no-undef */

const ARTIFACT_PATH = "./../src/artifacts/contracts/Turing.sol/Turing.json";

const localBlockchainAddress = "http://127.0.0.1:8545/";

const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const provider = new ethers.providers.JsonRpcProvider(localBlockchainAddress);
let contractEvent;
let signer = provider.getSigner();

let rankingData = [];

window.ethereum.on("accountsChanged", async () => {
  await reloadSigner();
});

async function _intializeContract(init) {
  const response = await fetch(ARTIFACT_PATH);
  const artifact = await response.json(); // Lê o JSON
  const abi = artifact.abi; // Extrai o  ABI
  const contract = new ethers.Contract(tokenAddress, abi, init);
  return contract;
}

// Function to reload the signer and reinitialize the page
async function reloadSigner() {
  try {
      // Get the current account from MetaMask
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
          // Update the signer with the new account
          signer = provider.getSigner(accounts[0]);
          console.log("Signer updated:", await signer.getAddress());

      } else {
          console.error("No accounts found in MetaMask");
      }
  } catch (error) {
      console.error("Error reloading signer:", error);
  }
}

async function connectToMetaMask() {
  if (typeof window.ethereum !== 'undefined') {
      try {
          // Request account access
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          console.log("Connected account:", accounts[0]);

          // Update the signer with the new account
          signer = provider.getSigner(accounts[0]);

          // Initialize contract to listen to events
          contractEvent = await _intializeContract(provider);

          // Configure event listeners
          contractEvent.on('IssueToken', async (to, amount) => {
            console.log(`IssueToken event emitted. {${to}, ${amount}}`);
            
            const toItem = rankingData.find((item) => item.codename === to);
            toItem.balance += toNumberAmount(amount);

            updateRankingData();
          });

          contractEvent.on('Vote', async (from, to, amount) => {
            console.log(`Vote event emitted. {from: ${from}, to: ${to}, ${amount}}`);
            const fromItem = rankingData.find(item => item.codename === from);
            const toItem = rankingData.find(item => item.codename === to);
            
            // Atualiza balance dos objetos
            amount = toNumberAmount(amount);
            fromItem.balance -= amount;
            toItem.balance += amount;

            updateRankingData();
          });
          
      } catch (error) {
          console.error("User denied account access or an error occurred:", error);
      }
  } else {
      console.error("MetaMask is not installed!");
  }
}

// Call the function to connect to MetaMask
connectToMetaMask();

async function loadPage() {
  if (typeof window.ethereum !== "undefined") {
    try {
      const contract = await _intializeContract(signer);

      await getVotingStatus(contract);

      // Chama a função Solidity
      const rankingString = await contract.getRanking();
      rankingData = parseRankingData(rankingString);

      console.log("Ranking Recebido:", rankingData);
      formatBalanceRankingData();
      updateRankingData();
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    }
  } else {
    alert("MetaMask não encontrado! Instale-o para continuar.");
  }
}

function formatBalanceRankingData(){
  rankingData.forEach((item) => {
    item.balance = toNumberAmount(item.balance);
  })
}

/**
 * Transforma amount em numero formatado
 */
function toNumberAmount(amount) {
  return parseFloat(amount) / Math.pow(10, 18);
}

/**
 * Transforma balance em string formatada
 */
function toStringBalance(balance) {
  return balance.toFixed(18).replace(".", ",");
}

function updateRankingData() {
  const rankingList = document.getElementById("rankingList");
  rankingList.innerHTML = ""; // Limpa a lista antes de adicionar novos elementos

  rankingData.sort((a, b) => b.balance - a.balance);

  rankingData.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("ranking-item");
    div.innerHTML = `<span>${item.codename}</span> <span>${toStringBalance(item.balance)} T</span>`;
    rankingList.appendChild(div);
  });
}

const voteButton = document.getElementById("button-vote");

async function getVotingStatus(contract) {
  const [votingStatus] = await contract.functions.getVotingStatus();

  if (votingStatus) {
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

  return rankingString
    .split(";") // Separa os candidatos
    .filter((item) => item.includes("-")) // Filtra strings vazias
    .map((entry) => {
      const [codename, balance] = entry.split("-"); // Divide nome e saldo
      return { codename, balance }; // Formata o saldo
    });
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
    try {
      await contract.functions.votingOn();
      voteButton.classList.remove("button-off");
      voteButton.classList.add("button-on");
    } catch (error) {
      voteButton.classList.add("button-off");
      voteButton.classList.remove("button-on");
      switchInput.checked = false;
      
      alert("Unable to change Voting status");
      console.log(error);
    }
  } else {
    try {
      await contract.functions.votingOff();
      voteButton.classList.add("button-off");
      voteButton.classList.remove("button-on");
    } catch (error) {
      voteButton.classList.remove("button-off");
      voteButton.classList.add("button-on");
      switchInput.checked = true;

      alert("Unable to change Voting status");
      console.log(error);
    }
  }
}

// Seleciona botão Issue Token e inputs
const issueTokenButton = document.getElementById("button-issue-token");
const codenameInput = document.getElementById("codename");
const amountInput = document.getElementById("amount");

function getAmount(){
  const regex = /\D/;  // \D corresponde a qualquer caractere que não seja número (equivalente a [^0-9])

  // Verifica se existe algum caractere não numérico na string
  if (regex.test(amountInput.value)) {
    return 0;
  }
  return new ethers.BigNumber.from(amountInput.value);
}

// Adiciona Listener para botão Issue Token
issueTokenButton.addEventListener("click", async () => {
  const codename = codenameInput.value.trim(); // Remove espaços extras
  const amount = getAmount();

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
  if (!switchInput.checked) {
    console.log("Unable to vote");
    return;
  }

  const codename = codenameInput.value.trim(); // Remove espaços extras
  const amount = getAmount();

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
