import { carregarTarefas } from "./api.js";
import { renderizarEstado } from "./estados.js";
import { instalarEventosDoQuadro } from "./renderizacao.js";

const estado = { tarefas: [], busca: "", status: "todos", prioridade: "todas", ordenacao: "prazo-asc", carregamento: true, erro: null };

function obterTarefasDerivadas() {
    const termoBusca = estado.busca.trim().toLowerCase();
    const filtradas = estado.tarefas.filter((tarefa) => {
        const atendeBusca = tarefa.titulo.toLowerCase().includes(termoBusca);
        const atendeStatus = estado.status === "todos" || tarefa.status === estado.status;
        const atendePrioridade = estado.prioridade === "todas" || tarefa.prioridade === estado.prioridade;
        return atendeBusca && atendeStatus && atendePrioridade;
    });
    return [...filtradas].sort((a, b) => {
        const dataA = new Date(a.prazo);
        const dataB = new Date(b.prazo);
        return estado.ordenacao === "prazo-asc" ? dataA - dataB : dataB - dataA;
    });
}

function renderizar() {
    renderizarEstado(estado, obterTarefasDerivadas());
}

function salvarTarefa(atualizada) {
    const indice = estado.tarefas.findIndex((tarefa) => String(tarefa.id) === String(atualizada.id));
    if (indice === -1) return;
    estado.tarefas[indice] = { ...estado.tarefas[indice], ...atualizada };
    renderizar();
}

function instalarEventosFiltros() {
    const form = document.getElementById("form-filtros");
    const campoBusca = document.getElementById("busca-titulo");
    const selectOrdenacao = document.getElementById("ordenacao-prazo");
    const btnLimpar = document.getElementById("btn-limpar");
    if (!form) return;
    form.addEventListener("submit", (evento) => evento.preventDefault());
    if (campoBusca) campoBusca.addEventListener("input", (evento) => { estado.busca = evento.target.value; renderizar(); });
    form.addEventListener("change", (evento) => {
        const elemento = evento.target;
        if (elemento.name === "status") estado.status = elemento.value;
        else if (elemento.name === "prioridade") estado.prioridade = elemento.value;
        else if (elemento.name === "ordenacao") estado.ordenacao = elemento.value;
        else return;
        renderizar();
    });
    if (btnLimpar) btnLimpar.addEventListener("click", () => {
        estado.busca = ""; estado.status = "todos"; estado.prioridade = "todas"; estado.ordenacao = "prazo-asc";
        if (campoBusca) campoBusca.value = "";
        if (selectOrdenacao) selectOrdenacao.value = "prazo-asc";
        const radioStatusTodos = document.getElementById("status-todos");
        if (radioStatusTodos) radioStatusTodos.checked = true;
        const radioPrioridadeTodas = document.getElementById("prioridade-todas");
        if (radioPrioridadeTodas) radioPrioridadeTodas.checked = true;
        renderizar();
    });
}

async function iniciarApp() {
    const quadro = document.querySelector("[data-quadro]");
    if (quadro) instalarEventosDoQuadro(quadro, () => obterTarefasDerivadas(), salvarTarefa);
    instalarEventosFiltros();
    estado.carregamento = true; estado.erro = null; renderizar();
    try { estado.tarefas = await carregarTarefas(); }
    catch (erro) { estado.erro = erro; }
    finally { estado.carregamento = false; renderizar(); }
}

iniciarApp();