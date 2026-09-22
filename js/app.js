import { carregarTarefas } from "./api.js";
import { renderizarEstado } from "./estados.js";
import { instalarEventosDoQuadro } from "./renderizacao.js";


const CHAVE_TAREFAS = "gerenciador-academico-tarefas";


const STATUS_LABELS = {
    "a-fazer": "A Fazer",
    "em-andamento": "Em Andamento",
    "em-revisao": "Em Revisão",
    "concluida": "Concluída",
};


const estado = {
    tarefas: [],
    busca: "",
    status: "todos",
    prioridade: "todas",
    ordenacao: "prazo-asc",
    carregamento: true,
    erro: null,
};


let temporizadorAviso;


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
            border: "1px solid #dfe4ef",
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


function tarefaEstaAtrasada(tarefa) {
    if (!tarefa?.prazo || tarefa.status === "concluida") {
        return false;
    }

    const prazo = new Date(`${tarefa.prazo}T00:00:00`);

    if (Number.isNaN(prazo.getTime())) {
        return false;
    }

    const hoje = new Date();

    hoje.setHours(0, 0, 0, 0);

    return prazo < hoje;
}


function obterTarefasDerivadas() {
    const termo = estado.busca
        .trim()
        .toLocaleLowerCase("pt-BR");

    const filtradas = estado.tarefas
        .filter((tarefa) => {
            const titulo = String(
                tarefa.titulo ?? ""
            ).toLocaleLowerCase("pt-BR");

            const correspondeBusca =
                titulo.includes(termo);

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
        })
        .map((tarefa) => ({
            ...tarefa,
            atrasada: tarefaEstaAtrasada(tarefa),
        }));


    return [...filtradas].sort((a, b) => {
        const interpretarPrazo = (data) => {
            if (!data) {
                return Number.POSITIVE_INFINITY;
            }

            const valor = Date.parse(
                `${data}T00:00:00`
            );

            return Number.isNaN(valor)
                ? Number.POSITIVE_INFINITY
                : valor;
        };


        const prazoA = interpretarPrazo(a.prazo);
        const prazoB = interpretarPrazo(b.prazo);

        const diferenca = prazoA - prazoB;


        if (diferenca !== 0) {
            return estado.ordenacao === "prazo-asc"
                ? diferenca
                : -diferenca;
        }


        return String(a.titulo ?? "")
            .localeCompare(
                String(b.titulo ?? ""),
                "pt-BR"
            );
    });
}


function atualizarProgresso(tarefasVisiveis) {
    const total = estado.tarefas.length;

    const concluidas = estado.tarefas.filter(
        (tarefa) => tarefa.status === "concluida"
    ).length;


    const percentual = total
        ? Math.round((concluidas / total) * 100)
        : 0;


    const percentualElemento =
        document.getElementById(
            "progresso-percentual"
        );

    const resumo =
        document.getElementById(
            "progresso-resumo"
        );

    const barra =
        document.getElementById(
            "barra-progresso"
        );

    const preenchimento =
        document.getElementById(
            "barra-progresso-preenchimento"
        );


    if (percentualElemento) {
        percentualElemento.textContent =
            `${percentual}%`;
    }


    if (resumo) {
        resumo.textContent =
            `${concluidas} de ${total} ${
                total === 1
                    ? "tarefa concluída"
                    : "tarefas concluídas"
            }`;
    }


    if (barra) {
        barra.setAttribute(
            "aria-valuenow",
            String(percentual)
        );
    }


    if (preenchimento) {
        preenchimento.style.width =
            `${percentual}%`;
    }


    const filtrosAtivos =
        estado.status !== "todos" ||
        estado.prioridade !== "todas" ||
        Boolean(estado.busca.trim());


    document
        .querySelectorAll("[data-progresso-status]")
        .forEach((item) => {

            const status =
                item.dataset.progressoStatus;

            const quantidade =
                tarefasVisiveis.filter(
                    (tarefa) =>
                        tarefa.status === status
                ).length;


            item.textContent =
                `${quantidade} ${
                    quantidade === 1
                        ? "tarefa"
                        : "tarefas"
                }${
                    filtrosAtivos
                        ? " visíveis"
                        : ""
                }`;
        });
}


function atualizarControles() {
    const busca =
        document.getElementById(
            "busca-titulo"
        );

    const ordenacao =
        document.getElementById(
            "ordenacao-prazo"
        );

    const statusSelecionado =
        document.querySelector(
            `input[name="status"][value="${estado.status}"]`
        );

    const prioridadeSelecionada =
        document.querySelector(
            `input[name="prioridade"][value="${estado.prioridade}"]`
        );


    if (busca) {
        busca.value = estado.busca;
    }


    if (ordenacao) {
        ordenacao.value =
            estado.ordenacao;
    }


    document
        .querySelectorAll('input[name="status"]')
        .forEach((input) => {
            input.checked =
                input === statusSelecionado;
        });


    document
        .querySelectorAll('input[name="prioridade"]')
        .forEach((input) => {
            input.checked =
                input === prioridadeSelecionada;
        });
}


function atualizarChips() {
    const area =
        document.getElementById(
            "filtros-ativos"
        );


    if (!area) {
        return;
    }


    area.replaceChildren();


    const filtros = [];


    if (estado.busca.trim()) {
        filtros.push([
            "busca",
            `Busca: ${estado.busca.trim()}`,
        ]);
    }


    if (estado.status !== "todos") {
        filtros.push([
            "status",
            `Status: ${
                STATUS_LABELS[estado.status]
                ?? estado.status
            }`,
        ]);
    }


    if (estado.prioridade !== "todas") {
        filtros.push([
            "prioridade",
            `Prioridade: ${estado.prioridade}`,
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


        botao.addEventListener(
            "click",
            () => {

                if (tipo === "busca") {
                    estado.busca = "";
                }

                if (tipo === "status") {
                    estado.status = "todos";
                }

                if (tipo === "prioridade") {
                    estado.prioridade = "todas";
                }


                atualizarControles();
                renderizar();
            }
        );


        chip.append(
            textoChip,
            botao
        );

        area.append(chip);
    });
}


function renderizar() {
    const tarefasVisiveis =
        obterTarefasDerivadas();


    renderizarEstado(
        estado,
        tarefasVisiveis
    );


    atualizarProgresso(
        tarefasVisiveis
    );


    atualizarChips();
}


function persistirTarefas() {
    try {
        localStorage.setItem(
            CHAVE_TAREFAS,
            JSON.stringify(estado.tarefas)
        );

        return true;

    } catch (erro) {
        console.error(
            "Falha ao persistir tarefas",
            erro
        );

        return false;
    }
}


function obterTarefasSalvas() {
    try {
        const bruto =
            localStorage.getItem(
                CHAVE_TAREFAS
            );


        if (!bruto) {
            return null;
        }


        const dados =
            JSON.parse(bruto);


        return Array.isArray(dados)
            ? dados
            : null;

    } catch (erro) {
        console.error(
            "Falha ao recuperar tarefas",
            erro
        );

        return null;
    }
}


function salvarTarefa(atualizada) {
    const indice =
        estado.tarefas.findIndex(
            (tarefa) =>
                String(tarefa.id) ===
                String(atualizada.id)
        );


    if (indice < 0) {
        return;
    }


    estado.tarefas[indice] = {
        ...estado.tarefas[indice],
        ...atualizada,
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
}


function excluirTarefa(id) {
    const quantidadeAnterior =
        estado.tarefas.length;


    estado.tarefas =
        estado.tarefas.filter(
            (tarefa) =>
                String(tarefa.id) !==
                String(id)
        );


    if (
        quantidadeAnterior ===
        estado.tarefas.length
    ) {
        return;
    }


    const salvou =
        persistirTarefas();


    renderizar();


    mostrarAviso(
        salvou
            ? "Tarefa excluída."
            : "Tarefa removida da tela, mas não foi possível salvar.",
        salvou
            ? "sucesso"
            : "erro"
    );
}


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

    const botaoFiltros =
        document.getElementById(
            "btn-filtros-mobile"
        );

    const painelFiltros =
        document.getElementById(
            "painel-filtros-avancados"
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


    botaoFiltros?.addEventListener(
        "click",
        () => {

            if (!painelFiltros) {
                return;
            }


            const aberto =
                painelFiltros.classList.toggle(
                    "aberto"
                );


            botaoFiltros.setAttribute(
                "aria-expanded",
                String(aberto)
            );


            botaoFiltros.classList.toggle(
                "ativo",
                aberto
            );
        }
    );


    limpar?.addEventListener(
        "click",
        () => {

            estado.busca = "";
            estado.status = "todos";
            estado.prioridade = "todas";
            estado.ordenacao = "prazo-asc";


            atualizarControles();


            renderizar();


            busca?.focus();
        }
    );
}


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


    const fecharMenu = () => {

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
        fecharMenu
    );


    sidebar
        ?.querySelectorAll("a")
        .forEach((link) => {
            link.addEventListener(
                "click",
                fecharMenu
            );
        });


    document.addEventListener(
        "keydown",
        (evento) => {

            if (
                evento.key ===
                "Escape"
            ) {
                fecharMenu();
            }
        }
    );


    const abas = [
        ...document.querySelectorAll(
            "[data-aba]"
        ),
    ];

    const colunas = [
        ...document.querySelectorAll(
            "[data-coluna]"
        ),
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


        colunas.forEach((coluna) => {

            coluna.classList.toggle(
                "coluna--ativa",
                coluna.dataset.coluna ===
                status
            );
        });
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


    ativarAba("a-fazer");
}


async function iniciarApp() {
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
    instalarNavegacaoMobile();


    estado.carregamento = true;

    renderizar();


    try {

        const originais =
            await carregarTarefas();


        const salvas =
            obterTarefasSalvas();


        estado.tarefas =
            salvas ?? originais;


        estado.erro = null;

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