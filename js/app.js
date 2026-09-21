
import { carregarTarefas } from "./api.js";
import { renderizarEstado } from "./estados.js";
import { instalarEventosDoQuadro } from "./renderizacao.js";

const CHAVE_TAREFAS = "gerenciador-academico-tarefas";

const STATUS_LABELS = {
    "a-fazer": "A Fazer",
    "em-andamento": "Em Andamento",
    "em-revisao": "Em Revisão",
    concluida: "Concluída"
};

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

/* --------------------------------------------------
   AVISOS
-------------------------------------------------- */

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

/* --------------------------------------------------
   ORDENAÇÃO E FILTROS
-------------------------------------------------- */

function converterPrazoParaNumero(prazo) {
    if (typeof prazo !== "string") {
        return null;
    }

    // Aceita somente o formato AAAA-MM-DD.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(prazo)) {
        return null;
    }

    const [ano, mes, dia] = prazo.split("-").map(Number);

    const data = new Date(Date.UTC(ano, mes - 1, dia));

    // Impede datas inexistentes, como 2026-02-31.
    if (
        data.getUTCFullYear() !== ano ||
        data.getUTCMonth() !== mes - 1 ||
        data.getUTCDate() !== dia
    ) {
        return null;
    }

    return data.getTime();
}

function obterTarefasDerivadas() {
    const termo = estado.busca
        .trim()
        .toLocaleLowerCase("pt-BR");

    const filtradas = estado.tarefas.filter((tarefa) => {
        const titulo = String(tarefa.titulo ?? "")
            .toLocaleLowerCase("pt-BR");

        const correspondeBusca = titulo.includes(termo);

        const correspondeStatus =
            estado.status === "todos" ||
            tarefa.status === estado.status;

        const correspondePrioridade =
            estado.prioridade === "todas" ||
            tarefa.prioridade === estado.prioridade;

        return (
            correspondeBusca &&
            correspondeStatus &&
            correspondePrioridade
        );
    });

    return filtradas
        .map((tarefa, indiceOriginal) => ({
            tarefa,
            indiceOriginal,
            prazo: converterPrazoParaNumero(tarefa.prazo)
        }))
        .sort((a, b) => {
            // Tarefas sem prazo ficam sempre no final.
            if (a.prazo === null && b.prazo !== null) {
                return 1;
            }

            if (a.prazo !== null && b.prazo === null) {
                return -1;
            }

            // Se ambas não possuem prazo, mantém a ordem original.
            if (a.prazo === null && b.prazo === null) {
                return a.indiceOriginal - b.indiceOriginal;
            }

            const diferenca = a.prazo - b.prazo;

            if (diferenca === 0) {
                return a.indiceOriginal - b.indiceOriginal;
            }

            return estado.ordenacao === "prazo-desc"
                ? -diferenca
                : diferenca;
        })
        .map((item) => item.tarefa);
}

/* --------------------------------------------------
   PROGRESSO
-------------------------------------------------- */

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
        document.getElementById("barra-progresso-preenchimento");

    if (elementoPercentual) {
        elementoPercentual.textContent = `${percentual}%`;
    }

    if (resumo) {
        resumo.textContent =
            `${concluidas} de ${total} ` +
            `${total === 1 ? "tarefa concluída" : "tarefas concluídas"}`;
    }

    if (barra) {
        barra.setAttribute("aria-valuenow", String(percentual));
    }

    if (preenchimento) {
        preenchimento.style.width = `${percentual}%`;
    }

    const filtrosAtivos =
        estado.status !== "todos" ||
        estado.prioridade !== "todas" ||
        estado.busca.trim() !== "";

    document.querySelectorAll("[data-progresso-status]")
        .forEach((elemento) => {
            const status = elemento.dataset.progressoStatus;

            const quantidade = tarefasVisiveis.filter(
                (tarefa) => tarefa.status === status
            ).length;

            const complemento = filtrosAtivos
                ? " visíveis"
                : "";

            elemento.textContent =
                `${quantidade} ` +
                `${quantidade === 1 ? "tarefa" : "tarefas"}` +
                complemento;
        });
}

/* --------------------------------------------------
   FILTROS ATIVOS
-------------------------------------------------- */

function atualizarChips() {
    const area = document.getElementById("filtros-ativos");

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
            `Status: ${STATUS_LABELS[estado.status] || estado.status}`
        ]);
    }

    if (estado.prioridade !== "todas") {
        filtros.push([
            "prioridade",
            `Prioridade: ${estado.prioridade}`
        ]);
    }

    filtros.forEach(([tipo, texto]) => {
        const chip = document.createElement("span");
        chip.className = "filtro-chip";

        const textoChip = document.createElement("span");
        textoChip.textContent = texto;

        const botao = document.createElement("button");
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
                    document.getElementById("busca-titulo");

                if (busca) {
                    busca.value = "";
                }
            }

            if (tipo === "status") {
                estado.status = "todos";

                const statusTodos =
                    document.getElementById("status-todos");

                if (statusTodos) {
                    statusTodos.checked = true;
                }
            }

            if (tipo === "prioridade") {
                estado.prioridade = "todas";

                const prioridadeTodas =
                    document.getElementById("prioridade-todas");

                if (prioridadeTodas) {
                    prioridadeTodas.checked = true;
                }
            }

            renderizar();
        });

        chip.append(textoChip, botao);
        area.append(chip);
    });
}

/* --------------------------------------------------
   RENDERIZAÇÃO
-------------------------------------------------- */

function renderizar() {
    const tarefasVisiveis = obterTarefasDerivadas();

    renderizarEstado(estado, tarefasVisiveis);
    atualizarProgresso(tarefasVisiveis);
    atualizarChips();
}

/* --------------------------------------------------
   PERSISTÊNCIA
-------------------------------------------------- */

function persistirTarefas(tarefas) {
    try {
        localStorage.setItem(
            CHAVE_TAREFAS,
            JSON.stringify(tarefas)
        );

        return true;
    } catch (erro) {
        console.error("Falha ao persistir tarefas:", erro);
        return false;
    }
}

function obterTarefasSalvas() {
    try {
        const dadosBrutos = localStorage.getItem(CHAVE_TAREFAS);

        if (!dadosBrutos) {
            return null;
        }

        const dados = JSON.parse(dadosBrutos);

        if (!Array.isArray(dados)) {
            console.warn(
                "Os dados salvos não estão no formato esperado."
            );

            return null;
        }

        return dados;
    } catch (erro) {
        console.error(
            "Falha ao recuperar tarefas salvas:",
            erro
        );

        return null;
    }
}

function salvarTarefa(atualizada) {
    const indice = estado.tarefas.findIndex(
        (tarefa) =>
            String(tarefa.id) === String(atualizada.id)
    );

    if (indice < 0) {
        mostrarAviso(
            "Não foi possível localizar a tarefa.",
            "erro"
        );

        return;
    }

    const tarefasAtualizadas = [...estado.tarefas];

    tarefasAtualizadas[indice] = {
        ...tarefasAtualizadas[indice],
        ...atualizada
    };

    // Primeiro tenta salvar; só depois atualiza o estado.
    const salvou = persistirTarefas(tarefasAtualizadas);

    if (!salvou) {
        mostrarAviso(
            "Não foi possível salvar as alterações neste navegador.",
            "erro"
        );

        return;
    }

    estado.tarefas = tarefasAtualizadas;

    renderizar();

    mostrarAviso("Alterações salvas neste navegador.");
}

function excluirTarefa(id) {
    const tarefasAtualizadas = estado.tarefas.filter(
        (tarefa) => String(tarefa.id) !== String(id)
    );

    if (tarefasAtualizadas.length === estado.tarefas.length) {
        mostrarAviso(
            "Não foi possível localizar a tarefa.",
            "erro"
        );

        return;
    }

    // Só remove do estado depois de confirmar a persistência.
    const salvou = persistirTarefas(tarefasAtualizadas);

    if (!salvou) {
        mostrarAviso(
            "Não foi possível excluir a tarefa: falha ao salvar.",
            "erro"
        );

        return;
    }

    estado.tarefas = tarefasAtualizadas;

    renderizar();

    mostrarAviso("Tarefa excluída.");
}

/* --------------------------------------------------
   EVENTOS DOS FILTROS
-------------------------------------------------- */

function instalarEventosFiltros() {
    const formulario =
        document.getElementById("form-filtros");

    const busca =
        document.getElementById("busca-titulo");

    const ordenacao =
        document.getElementById("ordenacao-prazo");

    const limpar =
        document.getElementById("btn-limpar");

    if (!formulario) {
        return;
    }

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();
    });

    busca?.addEventListener("input", (evento) => {
        estado.busca = evento.target.value;
        renderizar();
    });

    formulario.addEventListener("change", (evento) => {
        const controle = evento.target;

        if (controle.name === "status") {
            estado.status = controle.value;
        } else if (controle.name === "prioridade") {
            estado.prioridade = controle.value;
        } else if (controle.name === "ordenacao") {
            estado.ordenacao = controle.value;
        } else {
            return;
        }

        renderizar();
    });

    limpar?.addEventListener("click", () => {
        estado.busca = "";
        estado.status = "todos";
        estado.prioridade = "todas";
        estado.ordenacao = "prazo-asc";

        if (busca) {
            busca.value = "";
        }

        if (ordenacao) {
            ordenacao.value = "prazo-asc";
        }

        const statusTodos =
            document.getElementById("status-todos");

        const prioridadeTodas =
            document.getElementById("prioridade-todas");

        if (statusTodos) {
            statusTodos.checked = true;
        }

        if (prioridadeTodas) {
            prioridadeTodas.checked = true;
        }

        renderizar();
        busca?.focus();
    });
}

/* --------------------------------------------------
   NAVEGAÇÃO MOBILE
-------------------------------------------------- */

function instalarNavegacaoMobile() {
    const menu = document.getElementById("btn-menu");
    const sidebar = document.getElementById("sidebar");
    const sombra = document.getElementById("sidebar-sombra");

    const fecharMenu = () => {
        sidebar?.classList.remove("aberta");
        sombra?.classList.remove("visivel");

        if (sombra) {
            sombra.hidden = true;
        }

        menu?.setAttribute("aria-expanded", "false");
        menu?.setAttribute("aria-label", "Abrir menu");
    };

    if (menu && sidebar) {
        menu.addEventListener("click", () => {
            const aberto = sidebar.classList.toggle("aberta");

            if (sombra) {
                sombra.hidden = !aberto;
                sombra.classList.toggle("visivel", aberto);
            }

            menu.setAttribute(
                "aria-expanded",
                String(aberto)
            );

            menu.setAttribute(
                "aria-label",
                aberto ? "Fechar menu" : "Abrir menu"
            );
        });
    }

    sombra?.addEventListener("click", fecharMenu);

    sidebar?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", fecharMenu);
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            fecharMenu();
        }
    });

    const abas = [
        ...document.querySelectorAll("[data-aba]")
    ];

    const colunas = [
        ...document.querySelectorAll("[data-coluna]")
    ];

    function ativarAba(status) {
        abas.forEach((aba) => {
            const ativa = aba.dataset.aba === status;

            aba.classList.toggle("ativa", ativa);
            aba.setAttribute(
                "aria-selected",
                String(ativa)
            );
        });

        colunas.forEach((coluna) => {
            coluna.classList.toggle(
                "coluna--ativa",
                coluna.dataset.coluna === status
            );
        });
    }

    abas.forEach((aba) => {
        aba.addEventListener("click", () => {
            ativarAba(aba.dataset.aba);
        });
    });

    if (abas.length > 0) {
        ativarAba("a-fazer");
    }
}

/* --------------------------------------------------
   INICIALIZAÇÃO
-------------------------------------------------- */

async function iniciarApp() {
    const quadro = document.querySelector("[data-quadro]");

    if (quadro) {
        instalarEventosDoQuadro(
            quadro,
            obterTarefasDerivadas,
            salvarTarefa,
            excluirTarefa
        );
    }

    instalarEventosFiltros();
    instalarNavegacaoMobile();

    estado.carregamento = true;
    renderizar();

    try {
        const originais = await carregarTarefas();
        const salvas = obterTarefasSalvas();

        estado.tarefas = salvas ?? originais;
        estado.erro = null;
    } catch (erro) {
        estado.erro = erro;

        const salvas = obterTarefasSalvas();

        if (salvas !== null) {
            estado.tarefas = salvas;
            estado.erro = null;
        }
    } finally {
        estado.carregamento = false;
        renderizar();
    }
}

iniciarApp();