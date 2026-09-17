import { carregarTarefas } from "./api.js";
import { renderizarEstado } from "./estados.js";
import { instalarEventosDoQuadro } from "./renderizacao.js";

const CHAVE_TAREFAS = "gerenciador-academico-tarefas";
const STATUS_LABELS = { "a-fazer": "A Fazer", "em-andamento": "Em Andamento", "em-revisao": "Em Revisão", concluida: "Concluída" };
const estado = { tarefas: [], busca: "", status: "todos", prioridade: "todas", ordenacao: "prazo-asc", carregamento: true, erro: null };
let temporizadorAviso;

function mostrarAviso(mensagem, tipo = "sucesso") {
    let aviso = document.getElementById("aviso-acoes");
    if (!aviso) {
        aviso = document.createElement("div"); aviso.id = "aviso-acoes";
        aviso.setAttribute("role", "status"); aviso.setAttribute("aria-live", "polite");
        Object.assign(aviso.style, { position: "fixed", right: "20px", bottom: "20px", zIndex: "10000", maxWidth: "min(420px, calc(100vw - 40px))", padding: "14px 18px", borderRadius: "12px", boxShadow: "0 8px 28px rgba(20, 30, 60, .18)", fontWeight: "700", background: "#ffffff", color: "#20243a", border: "1px solid #dfe4ef" });
        document.body.append(aviso);
    }
    aviso.textContent = mensagem; aviso.style.borderLeft = tipo === "erro" ? "4px solid #d94b5b" : "4px solid #27966f"; aviso.hidden = false;
    clearTimeout(temporizadorAviso); temporizadorAviso = setTimeout(() => { aviso.hidden = true; }, 3500);
}

function obterTarefasDerivadas() {
    const termoBusca = estado.busca.trim().toLocaleLowerCase("pt-BR");
    const filtradas = estado.tarefas.filter((tarefa) => {
        const titulo = String(tarefa.titulo ?? "").toLocaleLowerCase("pt-BR");
        return titulo.includes(termoBusca) && (estado.status === "todos" || tarefa.status === estado.status) && (estado.prioridade === "todas" || tarefa.prioridade === estado.prioridade);
    });
    return [...filtradas].sort((a, b) => {
        const dataA = a.prazo ? Date.parse(`${a.prazo}T00:00:00`) : Number.POSITIVE_INFINITY;
        const dataB = b.prazo ? Date.parse(`${b.prazo}T00:00:00`) : Number.POSITIVE_INFINITY;
        const diferenca = (Number.isNaN(dataA) ? Number.POSITIVE_INFINITY : dataA) - (Number.isNaN(dataB) ? Number.POSITIVE_INFINITY : dataB);
        return estado.ordenacao === "prazo-asc" ? diferenca : -diferenca;
    });
}

function atualizarProgresso() {
    const total = estado.tarefas.length;
    const concluidas = estado.tarefas.filter((t) => t.status === "concluida").length;
    const percentual = total ? Math.round(concluidas / total * 100) : 0;
    const percentualEl = document.getElementById("progresso-percentual");
    const resumo = document.getElementById("progresso-resumo");
    const barra = document.getElementById("barra-progresso");
    const preenchimento = document.getElementById("barra-progresso-preenchimento");
    if (percentualEl) percentualEl.textContent = `${percentual}%`;
    if (resumo) resumo.textContent = `${concluidas} de ${total} ${total === 1 ? "tarefa concluída" : "tarefas concluídas"}`;
    if (barra) barra.setAttribute("aria-valuenow", String(percentual));
    if (preenchimento) preenchimento.style.width = `${percentual}%`;
    document.querySelectorAll("[data-progresso-status]").forEach((el) => {
        const status = el.dataset.progressoStatus;
        const quantidade = obterTarefasDerivadas().filter((t) => t.status === status).length;
        el.textContent = `${quantidade} ${quantidade === 1 ? "tarefa" : "tarefas"}${estado.status !== "todos" || estado.prioridade !== "todas" || estado.busca ? " (visíveis)" : ""}`;
    });
}

function atualizarChips() {
    const area = document.getElementById("filtros-ativos");
    if (!area) return;
    area.replaceChildren();
    const filtros = [];
    if (estado.busca.trim()) filtros.push(["busca", `Busca: ${estado.busca.trim()}`]);
    if (estado.status !== "todos") filtros.push(["status", `Status: ${STATUS_LABELS[estado.status] || estado.status}`]);
    if (estado.prioridade !== "todas") filtros.push(["prioridade", `Prioridade: ${estado.prioridade}`]);
    filtros.forEach(([tipo, texto]) => {
        const chip = document.createElement("span"); chip.className = "filtro-chip";
        const rotulo = document.createElement("span"); rotulo.textContent = texto;
        const remover = document.createElement("button"); remover.type = "button"; remover.textContent = "×"; remover.setAttribute("aria-label", `Remover filtro ${texto}`);
        remover.addEventListener("click", () => {
            if (tipo === "busca") { estado.busca = ""; document.getElementById("busca-titulo").value = ""; }
            if (tipo === "status") { estado.status = "todos"; document.getElementById("status-todos").checked = true; }
            if (tipo === "prioridade") { estado.prioridade = "todas"; document.getElementById("prioridade-todas").checked = true; }
            renderizar();
        });
        chip.append(rotulo, remover); area.append(chip);
    });
}

function renderizar() {
    renderizarEstado(estado, obterTarefasDerivadas());
    atualizarProgresso(); atualizarChips();
}
function persistirTarefas() {
    try { localStorage.setItem(CHAVE_TAREFAS, JSON.stringify(estado.tarefas)); return true; }
    catch (erro) { console.error("Não foi possível salvar as tarefas neste navegador.", erro); return false; }
}
function obterTarefasSalvas() {
    try { const valor = localStorage.getItem(CHAVE_TAREFAS); if (!valor) return null; const tarefas = JSON.parse(valor); return Array.isArray(tarefas) ? tarefas : null; }
    catch (erro) { console.error("Não foi possível recuperar as tarefas salvas.", erro); return null; }
}
function salvarTarefa(atualizada) {
    const indice = estado.tarefas.findIndex((t) => String(t.id) === String(atualizada.id));
    if (indice === -1) return;
    estado.tarefas[indice] = { ...estado.tarefas[indice], ...atualizada };
    const persistiu = persistirTarefas(); renderizar();
    mostrarAviso(persistiu ? "Alterações salvas neste navegador." : "Alterações aplicadas, mas não foi possível salvá-las neste navegador.", persistiu ? "sucesso" : "erro");
}
function excluirTarefa(id) {
    const anterior = estado.tarefas.length;
    estado.tarefas = estado.tarefas.filter((t) => String(t.id) !== String(id));
    if (estado.tarefas.length === anterior) return;
    const persistiu = persistirTarefas(); renderizar();
    mostrarAviso(persistiu ? "Tarefa excluída." : "Tarefa removida da tela, mas não foi possível salvar a alteração.", persistiu ? "sucesso" : "erro");
}
function instalarEventosFiltros() {
    const form = document.getElementById("form-filtros");
    const busca = document.getElementById("busca-titulo");
    const ordenacao = document.getElementById("ordenacao-prazo");
    const limpar = document.getElementById("btn-limpar");
    if (!form) return;
    form.addEventListener("submit", (e) => e.preventDefault());
    busca?.addEventListener("input", (e) => { estado.busca = e.target.value; renderizar(); });
    form.addEventListener("change", (e) => {
        const campo = e.target;
        if (campo.name === "status") estado.status = campo.value;
        else if (campo.name === "prioridade") estado.prioridade = campo.value;
        else if (campo.name === "ordenacao") estado.ordenacao = campo.value;
        else return;
        renderizar();
    });
    limpar?.addEventListener("click", () => {
        estado.busca = ""; estado.status = "todos"; estado.prioridade = "todas"; estado.ordenacao = "prazo-asc";
        if (busca) busca.value = ""; if (ordenacao) ordenacao.value = "prazo-asc";
        document.getElementById("status-todos").checked = true; document.getElementById("prioridade-todas").checked = true;
        renderizar(); busca?.focus();
    });
}
function instalarNavegacaoMobile() {
    const menu = document.getElementById("btn-menu"), sidebar = document.getElementById("sidebar"), sombra = document.getElementById("sidebar-sombra");
    const fechar = () => { sidebar?.classList.remove("aberta"); sombra?.classList.remove("visivel"); if (sombra) sombra.hidden = true; menu?.setAttribute("aria-expanded", "false"); menu?.setAttribute("aria-label", "Abrir menu"); };
    menu?.addEventListener("click", () => {
        const aberto = sidebar.classList.toggle("aberta");
        if (sombra) { sombra.hidden = !aberto; sombra.classList.toggle("visivel", aberto); }
        menu.setAttribute("aria-expanded", String(aberto)); menu.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    });
    sombra?.addEventListener("click", fechar);
    sidebar?.querySelectorAll("a").forEach((link) => link.addEventListener("click", fechar));
    document.querySelectorAll("[data-aba]").forEach((aba) => aba.addEventListener("click", () => {
        const status = aba.dataset.aba;
        document.querySelectorAll("[data-aba]").forEach((item) => { const ativo = item === aba; item.classList.toggle("ativa", ativo); item.setAttribute("aria-selected", String(ativo)); });
        document.querySelectorAll("[data-coluna]").forEach((coluna) => coluna.classList.toggle("coluna--ativa", coluna.dataset.coluna === status));
    }));
}
async function iniciarApp() {
    const quadro = document.querySelector("[data-quadro]");
    if (quadro) instalarEventosDoQuadro(quadro, obterTarefasDerivadas, salvarTarefa, excluirTarefa);
    instalarEventosFiltros(); instalarNavegacaoMobile();
    estado.carregamento = true; renderizar();
    try { const originais = await carregarTarefas(); estado.tarefas = obterTarefasSalvas() ?? originais; }
    catch (erro) { estado.erro = erro; const salvas = obterTarefasSalvas(); if (salvas) { estado.tarefas = salvas; estado.erro = null; } }
    finally { estado.carregamento = false; renderizar(); }
}
iniciarApp();