// script.js

let premium = false;

// Verifica validade do Premium (30 dias)
const hoje = new Date();
const validade = localStorage.getItem("premium_validade");

if (localStorage.getItem("premium_ativo") === "true" && validade) {
  const tempoAtivado = parseInt(validade);
  const dias = (hoje.getTime() - tempoAtivado) / (1000 * 60 * 60 * 24);
  if (dias <= 30) {
    premium = true;
  } else {
    localStorage.removeItem("premium_ativo");
    localStorage.removeItem("premium_validade");
  }
}

// Inicializa a senha no localStorage se ainda não existir
if (!localStorage.getItem("senha_atual")) {
  localStorage.setItem("senha_atual", "0");
}

/**
 * Valida o código de ativação baseado na senha base e no dobro do mês atual
 * Exemplo: Base = [2025, 612, 2024]
 * Para junho (mês 6) multiplicador = 12
 * Código válido seria MBS-2025*12-0612*12-2024*12 = MBS-24300-7344-24288
 * Como excede 9999, modulo 10000 é aplicado para cada número
 */
function validarCodigoNovo(codigoDigitado) {
  const base = [2025, 612, 2024];
  const now = new Date();
  const multiplicador = (now.getMonth() + 1) * 2; // dobro do mês atual

  const extrairNumeros = str => {
    const partes = str.replace(/[^\d]/g, "").match(/\d{4}/g);
    return partes ? partes.map(Number) : null;
  };

  const codigoNumeros = extrairNumeros(codigoDigitado);
  if (!codigoDigitado.startsWith("MBS-") || !codigoNumeros || codigoNumeros.length !== 3) return false;

  for (let i = 0; i < 3; i++) {
    let esperado = base[i] * multiplicador;
    if (esperado >= 10000) esperado = esperado % 10000; // Ajusta para 4 dígitos
    if (codigoNumeros[i] !== esperado) return false;
  }

  return true;
}

function atualizarDisplay() {
  const senha = parseInt(localStorage.getItem("senha_atual") || "0");
  const senhaFormatada = senha.toString().padStart(3, '0');
  const display = document.getElementById("senha-display");
  const atual = document.getElementById("senha-atual");
  if (display) display.innerText = senhaFormatada;
  if (atual) atual.innerText = senhaFormatada;
}

function proximaSenha() {
  let senha = parseInt(localStorage.getItem("senha_atual") || "0");
  senha++;
  if (senha > 999) senha = 1;
  localStorage.setItem("senha_atual", senha.toString());
  atualizarTudo();
  if (premium) falarSenha(senha);
}

function reiniciarSenha() {
  localStorage.setItem("senha_atual", "0");
  atualizarTudo();
}

function definirSenhaComGuiche(idInput, idGuiche) {
  if (!premium) return;
  const input = document.getElementById(idInput);
  const nomeGuiche = document.getElementById(idGuiche)?.value.trim();
  const novaSenha = parseInt(input.value);

  if (isNaN(novaSenha) || novaSenha < 1 || novaSenha > 999) {
    alert("Digite um número entre 1 e 999");
    return;
  }

  localStorage.setItem("senha_atual", novaSenha.toString());
  atualizarTudo();

  if (nomeGuiche) {
    localStorage.setItem("ultimo_guiche", nomeGuiche);
  }

  falarSenha(novaSenha);
}

function falarSenha(num) {
  const tipoSelecionado = localStorage.getItem("voz_tipo") || "male";

  const usarVoz = () => {
    const todasAsVozes = speechSynthesis.getVoices();

    const vozFeminina = todasAsVozes.find(v => v.name.includes("Maria") && v.lang.startsWith("pt"));
    const vozMasculina = todasAsVozes.find(v => v.name.includes("Paulo") && v.lang.startsWith("pt"));

    let vozEscolhida;
    if (tipoSelecionado === "female" && vozFeminina) {
      vozEscolhida = vozFeminina;
    } else if (tipoSelecionado === "male" && vozMasculina) {
      vozEscolhida = vozMasculina;
    } else {
      vozEscolhida = todasAsVozes.find(v => v.lang.startsWith("pt")) || todasAsVozes[0];
    }

    const msg = new SpeechSynthesisUtterance();
    const guiche = localStorage.getItem("ultimo_guiche");
    msg.text = guiche ? `Senha número ${parseInt(num)}, ${guiche}` : `Senha número ${parseInt(num)}`;
    msg.voice = vozEscolhida;
    msg.lang = "pt-BR";
    speechSynthesis.speak(msg);
  };

  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.onvoiceschanged = usarVoz;
  } else {
    usarVoz();
  }
}

function calcularDiasRestantes() {
  if (!premium) return "--";

  const ativacaoTimestamp = localStorage.getItem("premium_validade");
  if (!ativacaoTimestamp) return "--";

  const ativacao = new Date(parseInt(ativacaoTimestamp));
  const validade = new Date(ativacao.getTime() + 30 * 24 * 60 * 60 * 1000);
  const agora = new Date();

  const diffMs = validade - agora;
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDias > 0 ? diffDias : 0;
}

function atualizarDiasRestantes() {
  const elemento = document.getElementById("dias-restantes");
  if (elemento) {
    const dias = calcularDiasRestantes();
    elemento.innerText = dias === 0 ? "Expirado" : dias;
  }
}

function atualizarTudo() {
  atualizarDisplay();

  const status = document.getElementById("status-premium");
  if (status) {
    status.innerText = premium ? "Premium Ativo" : "Grátis";
  }

  atualizarDiasRestantes();

  const entrada = document.getElementById("entrada-premium");
  const divVoz = document.getElementById("voz-premium");
  if (premium) {
    if (entrada) entrada.style.display = "block";
    if (divVoz) divVoz.style.display = "flex";
  } else {
    if (entrada) entrada.style.display = "none";
    if (divVoz) divVoz.style.display = "none";
  }
}

window.onload = () => {
  function listarVozes() {
    const vozes = speechSynthesis.getVoices();
    console.log("Vozes disponíveis:");
    vozes.forEach((v, i) => {
      console.log(`${i}: ${v.name} - ${v.lang}`);
    });
  }

  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.onvoiceschanged = listarVozes;
  } else {
    listarVozes();
  }

  if (premium) {
    const seletor = document.getElementById("seletor-voz");
    if (seletor) {
      seletor.value = localStorage.getItem("voz_tipo") || "male";
      seletor.addEventListener("change", () => {
        localStorage.setItem("voz_tipo", seletor.value);
      });

      const divVoz = document.getElementById("voz-premium");
      if (divVoz) divVoz.style.display = "flex";
    }
  }

  atualizarTudo();
};

setInterval(atualizarTudo, 1000);
