import { carregarTarefas } from "./api.js";
import { renderizarEstado } from "./estados.js";
import {
    STATUS_LABELS,
    instalarEventosDoQuadro
} from "./renderizacao.js";

const CHAVE_TAREFAS = "gerenciador-academico-tarefas";
const CHAVE_TEMA = "gerenciador-academico-tema";

const estado = {
    tarefas: [],
    busca: "",
    status: "todos",
    prioridade: "todas",
    ordenacao: "prazo-asc",
    carregamento: true,
    erro: null
};

let temporizadorAviso;
let sincronizarAbaMobile = () => {};

function instalarTema() {
    const botao = document.getElementById("btn-tema");
    const temaSalvo = localStorage.getItem(CHAVE_TEMA);
    const temaInicial = temaSalvo === "escuro";

    const atualizarTema = (escuro) => {
        document.documentElement.dataset.tema = escuro
            ? "escuro"
            : "claro";

        if (!botao) {
            return;
        }

        botao.setAttribute("aria-pressed", String(escuro));
        botao.setAttribute(
            "aria-label",
            escuro
                ? "Ativar modo claro"
                : "Ativar modo escuro"
        );
        botao.setAttribute(
            "title",
            escuro
                ? "Ativar modo claro"
                : "Ativar modo escuro"
        );

        const icone = botao.querySelector("span");
        const texto = botao.querySelector(".botao-tema-texto");

        if (icone) {
            icone.textContent = escuro ? "☀" : "☾";
        }

        if (texto) {
            texto.textContent = escuro
                ? "Modo claro"
                : "Modo escuro";
        }
    };

    atualizarTema(temaInicial);

    botao?.addEventListener("click", () => {
        const escuro =
            document.documentElement.dataset.tema !== "escuro";

        atualizarTema(escuro);
        localStorage.setItem(
            CHAVE_TEMA,
            escuro ? "escuro" : "claro"
        );
    });
}


// =========================================================
// AVISOS
// =========================================================

function mostrarAviso(mensagem, tipo = "sucesso") {
    let aviso = document.getElementById("aviso-acoes");

    if (!aviso) {
        aviso = document.createElement("div");
        aviso.id = "aviso-acoes";
        aviso.setAttribute("role", "status");
        aviso.setAttribute("aria-live", "polite");

        Object.assign(aviso.style, {
            position: "fixed",
            right: "20px",
            bottom: "20px",
            zIndex: "10000",
            maxWidth: "min(420px, calc(100vw - 40px))",
            padding: "14px 18px",
            borderRadius: "12px",
            boxShadow: "0 8px 28px rgba(20, 30, 60, .18)",
            fontWeight: "700",
            background: "#fff",
            color: "#20243a",
            border: "1px solid #dfe4ef"
        });

        document.body.append(aviso);
    }

    aviso.textContent = mensagem;

    aviso.style.borderLeft =
        tipo === "erro"
            ? "4px solid #d94b5b"
            : "4px solid #27966f";

    aviso.hidden = false;

    clearTimeout(temporizadorAviso);

    temporizadorAviso = setTimeout(() => {
        aviso.hidden = true;
    }, 3500);
}


// =========================================================
// PRAZOS
// =========================================================

function obterValorPrazo(prazo) {
    if (typeof prazo !== "string" || !prazo.trim()) {
        return null;
    }

    const data = new Date(`${prazo}T00:00:00`);

    if (Number.isNaN(data.getTime())) {
        return null;
    }

    return data.getTime();
}


// =========================================================
// TAREFAS ATRASADAS
// =========================================================

function tarefaEstaAtrasada(tarefa) {
    if (!tarefa.prazo || tarefa.status === "concluida") {
        return false;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const prazo = obterValorPrazo(tarefa.prazo);

    return prazo !== null && prazo < hoje.getTime();
}


// =========================================================
// FILTROS + ORDENAÇÃO
// =========================================================

function obterTarefasDerivadas() {
    const termo = estado.busca
        .trim()
        .toLocaleLowerCase("pt-BR");

    const filtradas = estado.tarefas.filter((tarefa) =>
        String(tarefa.titulo ?? "")
            .toLocaleLowerCase("pt-BR")
            .includes(termo) &&
        (
            estado.status === "todos" ||
            tarefa.status === estado.status
        ) &&
        (
            estado.prioridade === "todas" ||
            tarefa.prioridade === estado.prioridade
        )
    );

    const tarefasComPrazo = filtradas.map((tarefa) => ({
        ...tarefa,
        atrasada: tarefaEstaAtrasada(tarefa)
    }));

    return [...tarefasComPrazo].sort((a, b) => {
        const prazoA = obterValorPrazo(a.prazo);
        const prazoB = obterValorPrazo(b.prazo);

        if (prazoA === null || prazoB === null) {
            return prazoA === prazoB
                ? 0
                : prazoA === null
                    ? 1
                    : -1;
        }

        const delta = prazoA - prazoB;

        return estado.ordenacao === "prazo-asc"
            ? delta
            : -delta;
    });
}


// =========================================================
// PROGRESSO
// =========================================================

function atualizarProgresso(tarefasVisiveis) {
    const total = estado.tarefas.length;

    const concluidas = estado.tarefas.filter(
        (tarefa) => tarefa.status === "concluida"
    ).length;

    const percentual = total
        ? Math.round((concluidas / total) * 100)
        : 0;

    const elementoPercentual =
        document.getElementById("progresso-percentual");

    const resumo =
        document.getElementById("progresso-resumo");

    const barra =
        document.getElementById("barra-progresso");

    const preenchimento =
        document.getElementById(
            "barra-progresso-preenchimento"
        );

    if (elementoPercentual) {
        elementoPercentual.textContent = `${percentual}%`;
    }

    if (resumo) {
        resumo.textContent =
            `${concluidas} de ${total} ` +
            (
                total === 1
                    ? "tarefa concluída"
                    : "tarefas concluídas"
            );
    }

    if (barra) {
        barra.setAttribute(
            "aria-valuenow",
            String(percentual)
        );
    }

    if (preenchimento) {
        preenchimento.style.width = `${percentual}%`;
    }

    const existemFiltros =
        estado.status !== "todos" ||
        estado.prioridade !== "todas" ||
        estado.busca.trim() !== "";

    document
        .querySelectorAll("[data-progresso-status]")
        .forEach((elemento) => {
            const status =
                elemento.dataset.progressoStatus;

            const quantidade =
                tarefasVisiveis.filter(
                    (tarefa) => tarefa.status === status
                ).length;

            elemento.textContent =
                `${quantidade} ` +
                (
                    quantidade === 1
                        ? "tarefa"
                        : "tarefas"
                ) +
                (
                    existemFiltros
                        ? " visíveis"
                        : ""
                );
        });
}


// =========================================================
// CONTADOR DE FILTROS
// =========================================================

function atualizarContadorFiltros() {
    const contador =
        document.getElementById("contador-filtros");

    if (!contador) {
        return;
    }

    let quantidade = 0;

    if (estado.status !== "todos") {
        quantidade++;
    }

    if (estado.prioridade !== "todas") {
        quantidade++;
    }

    contador.textContent = String(quantidade);
}


// =========================================================
// CHIPS DOS FILTROS
// =========================================================

function atualizarChips() {
    const area =
        document.getElementById("filtros-ativos");

    if (!area) {
        return;
    }

    area.replaceChildren();

    const filtros = [];

    if (estado.busca.trim()) {
        filtros.push([
            "busca",
            `Busca: ${estado.busca.trim()}`
        ]);
    }

    if (estado.status !== "todos") {
        filtros.push([
            "status",
            `Status: ${
                STATUS_LABELS[estado.status] ||
                estado.status
            }`
        ]);
    }

    if (estado.prioridade !== "todas") {
        filtros.push([
            "prioridade",
            `Prioridade: ${estado.prioridade}`
        ]);
    }

    filtros.forEach(([tipo, texto]) => {
        const chip =
            document.createElement("span");

        chip.className = "filtro-chip";

        const textoChip =
            document.createElement("span");

        textoChip.textContent = texto;

        const botao =
            document.createElement("button");

        botao.type = "button";
        botao.textContent = "×";

        botao.setAttribute(
            "aria-label",
            `Remover filtro ${texto}`
        );

        botao.addEventListener("click", () => {

            if (tipo === "busca") {
                estado.busca = "";

                const busca =
                    document.getElementById(
                        "busca-titulo"
                    );

                if (busca) {
                    busca.value = "";
                }
            }

            if (tipo === "status") {
                estado.status = "todos";

                const todos =
                    document.getElementById(
                        "status-todos"
                    );

                if (todos) {
                    todos.checked = true;
                }
            }

            if (tipo === "prioridade") {
                estado.prioridade = "todas";

                const todas =
                    document.getElementById(
                        "prioridade-todas"
                    );

                if (todas) {
                    todas.checked = true;
                }
            }

            renderizar();
        });

        chip.append(
            textoChip,
            botao
        );

        area.append(chip);
    });
}


// =========================================================
// RENDERIZAÇÃO
// =========================================================

function renderizar() {
    const tarefasVisiveis =
        obterTarefasDerivadas();

    renderizarEstado(
        estado,
        tarefasVisiveis
    );

    sincronizarAbaMobile(tarefasVisiveis);

    atualizarProgresso(
        tarefasVisiveis
    );

    atualizarChips();

    atualizarContadorFiltros();
}


// =========================================================
// LOCAL STORAGE
// =========================================================

function persistirTarefas() {
    try {
        localStorage.setItem(
            CHAVE_TAREFAS,
            JSON.stringify(estado.tarefas)
        );

        return true;

    } catch (erro) {
        console.error(
            "Falha ao persistir tarefas:",
            erro
        );

        return false;
    }
}


function obterTarefasSalvas() {
    try {
        const dados =
            localStorage.getItem(
                CHAVE_TAREFAS
            );

        if (!dados) {
            return null;
        }

        const tarefas =
            JSON.parse(dados);

        return Array.isArray(tarefas)
            ? tarefas
            : null;

    } catch (erro) {
        console.error(
            "Falha ao recuperar tarefas:",
            erro
        );

        return null;
    }
}


// =========================================================
// EDITAR TAREFA
// =========================================================

function salvarTarefa(atualizada) {
    const indice =
        estado.tarefas.findIndex(
            (tarefa) =>
                String(tarefa.id) ===
                String(atualizada.id)
        );

    if (indice === -1) {
        mostrarAviso(
            "Não foi possível encontrar essa tarefa.",
            "erro"
        );

        return false;
    }

    const tarefaAnterior =
        estado.tarefas[indice];

    estado.tarefas[indice] = {
        ...tarefaAnterior,
        ...atualizada
    };

    const salvou =
        persistirTarefas();

    renderizar();

    mostrarAviso(
        salvou
            ? "Alterações salvas neste navegador."
            : "Alterações aplicadas, mas não foi possível salvá-las neste navegador.",
        salvou
            ? "sucesso"
            : "erro"
    );

    return true;
}


// =========================================================
// EXCLUIR TAREFA
// =========================================================

function excluirTarefa(id) {
    const indice =
        estado.tarefas.findIndex(
            (tarefa) =>
                String(tarefa.id) ===
                String(id)
        );

    if (indice === -1) {
        mostrarAviso(
            "Não foi possível encontrar essa tarefa.",
            "erro"
        );

        return false;
    }

    estado.tarefas.splice(
        indice,
        1
    );

    const salvou =
        persistirTarefas();

    renderizar();

    mostrarAviso(
        salvou
            ? "Tarefa excluída."
            : "Tarefa removida da tela, mas não foi possível salvá-la neste navegador.",
        salvou
            ? "sucesso"
            : "erro"
    );

    return true;
}


// =========================================================
// EVENTOS DOS FILTROS
// =========================================================

function instalarEventosFiltros() {
    const form =
        document.getElementById(
            "form-filtros"
        );

    const busca =
        document.getElementById(
            "busca-titulo"
        );

    const ordenacao =
        document.getElementById(
            "ordenacao-prazo"
        );

    const limpar =
        document.getElementById(
            "btn-limpar"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        (evento) => {
            evento.preventDefault();
        }
    );

    busca?.addEventListener(
        "input",
        (evento) => {
            estado.busca =
                evento.target.value;

            renderizar();
        }
    );

    form.addEventListener(
        "change",
        (evento) => {
            const controle =
                evento.target;

            if (
                controle.name ===
                "status"
            ) {
                estado.status =
                    controle.value;

            } else if (
                controle.name ===
                "prioridade"
            ) {
                estado.prioridade =
                    controle.value;

            } else if (
                controle.name ===
                "ordenacao"
            ) {
                estado.ordenacao =
                    controle.value;

            } else {
                return;
            }

            renderizar();
        }
    );

    limpar?.addEventListener(
        "click",
        () => {
            estado.busca = "";
            estado.status = "todos";
            estado.prioridade = "todas";
            estado.ordenacao = "prazo-asc";

            if (busca) {
                busca.value = "";
            }

            if (ordenacao) {
                ordenacao.value =
                    "prazo-asc";
            }

            const statusTodos =
                document.getElementById(
                    "status-todos"
                );

            const prioridadeTodas =
                document.getElementById(
                    "prioridade-todas"
                );

            if (statusTodos) {
                statusTodos.checked = true;
            }

            if (prioridadeTodas) {
                prioridadeTodas.checked = true;
            }

            renderizar();

            busca?.focus();
        }
    );
}


// =========================================================
// PAINEL DE FILTROS
// =========================================================

function instalarPainelFiltros() {
    const botao =
        document.getElementById(
            "btn-filtros-mobile"
        );

    const painel =
        document.getElementById(
            "painel-filtros-opcoes"
        );

    if (!botao || !painel) {
        return;
    }

    const fechar = () => {
        painel.hidden = true;

        botao.setAttribute(
            "aria-expanded",
            "false"
        );
    };

    const abrirOuFechar = () => {
        const aberto =
            painel.hidden;

        painel.hidden = !aberto;

        botao.setAttribute(
            "aria-expanded",
            String(aberto)
        );
    };

    botao.addEventListener(
        "click",
        abrirOuFechar
    );

    document.addEventListener(
        "click",
        (evento) => {
            if (
                painel.hidden ||
                painel.contains(
                    evento.target
                ) ||
                botao.contains(
                    evento.target
                )
            ) {
                return;
            }

            fechar();
        }
    );

    document.addEventListener(
        "keydown",
        (evento) => {
            if (
                evento.key ===
                "Escape"
            ) {
                fechar();
            }
        }
    );
}


// =========================================================
// NAVEGAÇÃO MOBILE
// =========================================================

function instalarNavegacaoMobile() {
    const menu =
        document.getElementById(
            "btn-menu"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const sombra =
        document.getElementById(
            "sidebar-sombra"
        );

    const fechar = () => {
        sidebar?.classList.remove(
            "aberta"
        );

        sombra?.classList.remove(
            "visivel"
        );

        if (sombra) {
            sombra.hidden = true;
        }

        menu?.setAttribute(
            "aria-expanded",
            "false"
        );

        menu?.setAttribute(
            "aria-label",
            "Abrir menu"
        );
    };

    menu?.addEventListener(
        "click",
        () => {
            if (!sidebar) {
                return;
            }

            const aberto =
                sidebar.classList.toggle(
                    "aberta"
                );

            if (sombra) {
                sombra.hidden =
                    !aberto;

                sombra.classList.toggle(
                    "visivel",
                    aberto
                );
            }

            menu.setAttribute(
                "aria-expanded",
                String(aberto)
            );

            menu.setAttribute(
                "aria-label",
                aberto
                    ? "Fechar menu"
                    : "Abrir menu"
            );
        }
    );

    sombra?.addEventListener(
        "click",
        fechar
    );

    sidebar?.querySelectorAll(
        "a"
    ).forEach((link) => {
        link.addEventListener(
            "click",
            fechar
        );
    });


    // Abas mobile

    const abas = [
        ...document.querySelectorAll(
            "[data-aba]"
        )
    ];

    const colunas = [
        ...document.querySelectorAll(
            "[data-coluna]"
        )
    ];

    const ativarAba = (status) => {

        abas.forEach((aba) => {
            const ativa =
                aba.dataset.aba ===
                status;

            aba.classList.toggle(
                "ativa",
                ativa
            );

            aba.setAttribute(
                "aria-selected",
                String(ativa)
            );
        });

        colunas.forEach(
            (coluna) => {
                coluna.classList.toggle(
                    "coluna--ativa",
                    coluna.dataset.coluna ===
                    status
                );
            }
        );
    };

    sincronizarAbaMobile = (tarefasVisiveis = []) => {
        const statusAtual = abas.find(
            (aba) => aba.classList.contains("ativa")
        )?.dataset.aba;

        const statusComTarefas = tarefasVisiveis.find(
            (tarefa) => tarefa.status === statusAtual
        )?.status;

        const primeiroStatusComTarefas = tarefasVisiveis[0]?.status;

        ativarAba(
            statusComTarefas ||
            primeiroStatusComTarefas ||
            statusAtual ||
            abas[0]?.dataset.aba
        );
    };

    abas.forEach((aba) => {
        aba.addEventListener(
            "click",
            () => {
                ativarAba(
                    aba.dataset.aba
                );
            }
        );
    });

    if (abas.length > 0) {
        ativarAba(
            abas[0].dataset.aba
        );
    }
}


// =========================================================
// INICIALIZAÇÃO
// =========================================================

async function iniciarApp() {
    instalarTema();

    const quadro =
        document.querySelector(
            "[data-quadro]"
        );

    if (quadro) {
        instalarEventosDoQuadro(
            quadro,
            obterTarefasDerivadas,
            salvarTarefa,
            excluirTarefa
        );
    }

    instalarEventosFiltros();

    instalarPainelFiltros();

    instalarNavegacaoMobile();

    estado.carregamento = true;

    renderizar();

    try {
        const originais =
            await carregarTarefas();

        estado.tarefas =
            obterTarefasSalvas() ??
            originais;

    } catch (erro) {
        estado.erro = erro;

        const salvas =
            obterTarefasSalvas();

        if (salvas) {
            estado.tarefas = salvas;
            estado.erro = null;
        }

    } finally {
        estado.carregamento = false;

        renderizar();
    }
}


iniciarApp();