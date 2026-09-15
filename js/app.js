import { carregarTarefas } from "./api.js";
import { renderizarEstado } from "./estados.js";
import { instalarEventosDoQuadro } from "./renderizacao.js";

// ESTADO ÚNICO DA APLICAÇÃO
const estado = {
    tarefas: [],
    busca: "",
    status: "todos",
    prioridade: "todas",
    ordenacao: "prazo-asc",
    carregamento: true,
    erro: null
};

/**
 * Filtra e ordena as tarefas com base no estado atual
 * sem alterar o array original e sem ler o DOM.
 */
function obterTarefasDerivadas() {
    const termoBusca = estado.busca.trim().toLowerCase();

    const filtradas = estado.tarefas.filter((tarefa) => {
        const atendeBusca = tarefa.titulo.toLowerCase().includes(termoBusca);
        const atendeStatus = estado.status === "todos" || tarefa.status === estado.status;
        const atendePrioridade = estado.prioridade === "todas" || tarefa.prioridade === estado.prioridade;

        return atendeBusca && atendeStatus && atendePrioridade;
    });

    // Cópia imutável antes da ordenação para não modificar o estado.tarefas original
    return [...filtradas].sort((a, b) => {
        const dataA = new Date(a.prazo);
        const dataB = new Date(b.prazo);
        return estado.ordenacao === "prazo-asc" ? dataA - dataB : dataB - dataA;
    });
}

/**
 * Ponto Único de Renderização: Deriva a lista e atualiza a interface.
 */
function renderizar() {
    const tarefasVisiveis = obterTarefasDerivadas();
    renderizarEstado(estado, tarefasVisiveis);
}

/**
 * Inicialização de eventos nos controles do formulário.
 */
function instalarEventosFiltros() {
    const form = document.getElementById("form-filtros");
    const campoBusca = document.getElementById("busca-titulo");
    const selectOrdenacao = document.getElementById("ordenacao-prazo");
    const btnLimpar = document.getElementById("btn-limpar");

    if (!form) return;

    // Evita o submit padrão da página
    form.addEventListener("submit", (evento) => evento.preventDefault());

    // Busca por título (Evento input para busca dinâmica)
    if (campoBusca) {
        campoBusca.addEventListener("input", (evento) => {
            estado.busca = evento.target.value;
            renderizar();
        });
    }

    // Filtros por Status e Prioridade (Radios)
    form.addEventListener("change", (evento) => {
        const elemento = evento.target;

        if (elemento.name === "status") {
            estado.status = elemento.value;
            renderizar();
        } else if (elemento.name === "prioridade") {
            estado.prioridade = elemento.value;
            renderizar();
        } else if (elemento.name === "ordenacao") {
            estado.ordenacao = elemento.value;
            renderizar();
        }
    });

    // Botão Limpar Filtros
    if (btnLimpar) {
        btnLimpar.addEventListener("click", () => {
            // 1. Reseta os valores do estado
            estado.busca = "";
            estado.status = "todos";
            estado.prioridade = "todas";
            estado.ordenacao = "prazo-asc";

            // 2. Sincroniza os controles visuais no DOM
            if (campoBusca) campoBusca.value = "";
            if (selectOrdenacao) selectOrdenacao.value = "prazo-asc";

            const radioStatusTodos = document.getElementById("status-todos");
            if (radioStatusTodos) radioStatusTodos.checked = true;

            const radioPrioridadeTodas = document.getElementById("prioridade-todas");
            if (radioPrioridadeTodas) radioPrioridadeTodas.checked = true;

            // 3. Re-renderiza a aplicação
            renderizar();
        });
    }
}

// Inicialização principal.
async function iniciarApp() {
    const quadro = document.querySelector("[data-quadro]");

    if (quadro) {
        // Delegação de eventos no quadro instalada uma única vez
        instalarEventosDoQuadro(quadro, () => obterTarefasDerivadas());
    }

    instalarEventosFiltros();

    // Estado inicial de carregamento
    estado.carregamento = true;
    estado.erro = null;
    renderizar();

    try {
        const tarefas = await carregarTarefas();
        estado.tarefas = tarefas;
    } catch (erro) {
        estado.erro = erro;
    } finally {
        estado.carregamento = false;
        renderizar();
    }
}

// Inicia a aplicação
iniciarApp();