
const ROTULOS_STATUS = {
    "a-fazer": "A Fazer",
    "em-andamento": "Em Andamento",
    "em-revisao": "Em Revisão",
    concluida: "Concluída"
};

const STATUS = [
    "a-fazer",
    "em-andamento",
    "em-revisao",
    "concluida"
];

const PRIORIDADES = ["Baixa", "Média", "Alta"];

/* --------------------------------------------------
   DATAS
-------------------------------------------------- */

function converterData(data) {
    if (typeof data !== "string") {
        return null;
    }

    const partes = data.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!partes) {
        return null;
    }

    const ano = Number(partes[1]);
    const mes = Number(partes[2]);
    const dia = Number(partes[3]);

    const dataConvertida = new Date(
        Date.UTC(ano, mes - 1, dia)
    );

    if (
        dataConvertida.getUTCFullYear() !== ano ||
        dataConvertida.getUTCMonth() !== mes - 1 ||
        dataConvertida.getUTCDate() !== dia
    ) {
        return null;
    }

    return dataConvertida;
}

function formatarData(data) {
    if (!data) {
        return "Não definido";
    }

    const dataConvertida = converterData(data);

    if (!dataConvertida) {
        return "Data inválida";
    }

    const dia = String(dataConvertida.getUTCDate())
        .padStart(2, "0");

    const mes = String(dataConvertida.getUTCMonth() + 1)
        .padStart(2, "0");

    const ano = dataConvertida.getUTCFullYear();

    return `${dia}/${mes}/${ano}`;
}

function estaAtrasada(tarefa) {
    if (
        !tarefa.prazo ||
        tarefa.status === "concluida"
    ) {
        return false;
    }

    const prazo = converterData(tarefa.prazo);

    if (!prazo) {
        return false;
    }

    const agora = new Date();

    const hoje = new Date(
        Date.UTC(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate()
        )
    );

    return prazo.getTime() < hoje.getTime();
}

/* --------------------------------------------------
   ELEMENTOS
-------------------------------------------------- */

function criarLinhaMeta(rotulo, valor, classe = "") {
    const linha = document.createElement("p");

    if (classe) {
        linha.className = classe;
    }

    const textoRotulo = document.createElement("strong");
    textoRotulo.textContent = `${rotulo}: `;

    const textoValor = document.createElement("span");
    textoValor.textContent = valor;

    linha.append(textoRotulo, textoValor);

    return linha;
}

function criarCampo(rotulo, nome, tipo = "text", valor = "") {
    const label = document.createElement("label");
    label.className = "modal-tarefa-campo";
    label.textContent = rotulo;

    const input = document.createElement("input");
    input.name = nome;
    input.type = tipo;
    input.value = valor ?? "";

    if (nome === "titulo") {
        input.required = true;
        input.maxLength = 150;
    }

    label.append(input);

    return label;
}

function criarSelect(rotulo, nome, opcoes, valor) {
    const label = document.createElement("label");
    label.className = "modal-tarefa-campo";
    label.textContent = rotulo;

    const select = document.createElement("select");
    select.name = nome;
    select.required = true;

    opcoes.forEach(([valorOpcao, textoOpcao]) => {
        const opcao = document.createElement("option");

        opcao.value = valorOpcao;
        opcao.textContent = textoOpcao;

        select.append(opcao);
    });

    select.value = valor;

    label.append(select);

    return label;
}

/* --------------------------------------------------
   MODAL
-------------------------------------------------- */

function obterModal() {
    let modal = document.getElementById(
        "modal-detalhes-tarefa"
    );

    if (modal) {
        return modal;
    }

    modal = document.createElement("dialog");
    modal.id = "modal-detalhes-tarefa";
    modal.className = "modal-tarefa";
    modal.setAttribute(
        "aria-labelledby",
        "modal-tarefa-titulo"
    );

    const conteudo = document.createElement("div");
    conteudo.className = "modal-tarefa-conteudo";

    const topo = document.createElement("div");
    topo.className = "modal-tarefa-topo";

    const titulo = document.createElement("h2");
    titulo.id = "modal-tarefa-titulo";

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "modal-tarefa-fechar";
    fechar.textContent = "Fechar";

    fechar.addEventListener("click", () => {
        modal.close();
    });

    topo.append(titulo, fechar);

    const corpo = document.createElement("div");
    corpo.className = "modal-tarefa-corpo";
    corpo.dataset.modalCorpo = "";

    conteudo.append(topo, corpo);
    modal.append(conteudo);

    modal.addEventListener("click", (evento) => {
        if (evento.target === modal) {
            modal.close();
        }
    });

    document.body.append(modal);

    return modal;
}

function abrirDetalhes(
    tarefa,
    botaoOrigem,
    salvarTarefa,
    excluirTarefa
) {
    const modal = obterModal();

    const tituloModal = modal.querySelector(
        "#modal-tarefa-titulo"
    );

    const corpo = modal.querySelector(
        "[data-modal-corpo]"
    );

    tituloModal.textContent =
        tarefa.titulo || "Detalhes da tarefa";

    const formulario = document.createElement("form");
    formulario.className = "modal-tarefa-form";

    const campoTitulo = criarCampo(
        "Título",
        "titulo",
        "text",
        tarefa.titulo
    );

    const campoStatus = criarSelect(
        "Status",
        "status",
        STATUS.map((status) => [
            status,
            ROTULOS_STATUS[status]
        ]),
        tarefa.status
    );

    const campoPrioridade = criarSelect(
        "Prioridade",
        "prioridade",
        PRIORIDADES.map((prioridade) => [
            prioridade,
            prioridade
        ]),
        tarefa.prioridade
    );

    const campoPrazo = criarCampo(
        "Prazo",
        "prazo",
        "date",
        converterData(tarefa.prazo)
            ? tarefa.prazo
            : ""
    );

    formulario.append(
        campoTitulo,
        campoStatus,
        campoPrioridade,
        campoPrazo
    );

    formulario.append(
        criarLinhaMeta(
            "Projeto",
            tarefa.projeto || "Geral"
        ),
        criarLinhaMeta(
            "Responsável",
            tarefa.responsavel || "Não atribuído"
        )
    );

    const acoes = document.createElement("div");
    acoes.className = "modal-tarefa-acoes";

    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.textContent = "Cancelar";

    cancelar.addEventListener("click", () => {
        modal.close();
    });

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "botao-excluir-tarefa";
    excluir.textContent = "Excluir tarefa";

    excluir.addEventListener("click", () => {
        const confirmou = window.confirm(
            `Tem certeza de que deseja excluir ` +
            `“${tarefa.titulo}”? Esta ação não pode ser desfeita.`
        );

        if (!confirmou) {
            return;
        }

        excluirTarefa(tarefa.id);
        modal.close();
    });

    const salvar = document.createElement("button");
    salvar.type = "submit";
    salvar.textContent = "Salvar alterações";

    acoes.append(cancelar, excluir, salvar);
    formulario.append(acoes);

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        if (!formulario.reportValidity()) {
            return;
        }

        const dados = new FormData(formulario);

        const titulo = String(
            dados.get("titulo") ?? ""
        ).trim();

        const status = String(
            dados.get("status") ?? ""
        );

        const prioridade = String(
            dados.get("prioridade") ?? ""
        );

        const prazo = String(
            dados.get("prazo") ?? ""
        );

        if (!titulo) {
            campoTitulo.querySelector("input").focus();
            return;
        }

        if (!STATUS.includes(status)) {
            return;
        }

        if (!PRIORIDADES.includes(prioridade)) {
            return;
        }

        if (prazo && !converterData(prazo)) {
            campoPrazo.querySelector("input").focus();
            return;
        }

        const atualizada = {
            ...tarefa,
            titulo,
            status,
            prioridade,
            prazo
        };

        const salvou = salvarTarefa(atualizada);

        // Mantém o modal aberto se a gravação falhar.
        if (salvou === false) {
            return;
        }

        modal.close();
    });

    corpo.replaceChildren(formulario);

    // Remove o listener anterior para não acumular callbacks.
    const restaurarFoco = () => {
        modal.removeEventListener(
            "close",
            restaurarFoco
        );

        if (botaoOrigem?.isConnected) {
            botaoOrigem.focus();
        }
    };

    modal.addEventListener("close", restaurarFoco);

    if (!modal.open) {
        modal.showModal();
    }

    campoTitulo.querySelector("input").focus();
}

/* --------------------------------------------------
   CARTÕES
-------------------------------------------------- */

export function criarCartao(tarefa) {
    const cartao = document.createElement("article");

    cartao.className = `cartao cartao--${tarefa.status}`;
    cartao.dataset.tarefaId = tarefa.id;

    const atrasada = estaAtrasada(tarefa);

    if (atrasada) {
        cartao.classList.add("cartao--atrasada");
    }

    const topo = document.createElement("div");
    topo.className = "cartao-topo";

    const status = document.createElement("span");

    status.className =
        `badge-status badge-status--${tarefa.status}`;

    status.textContent =
        ROTULOS_STATUS[tarefa.status] || tarefa.status;

    topo.append(status);

    const titulo = document.createElement("h4");
    titulo.textContent = tarefa.titulo || "Sem título";

    const prioridade = document.createElement("span");

    const prioridadeNormalizada = String(
        tarefa.prioridade || ""
    )
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    prioridade.className =
        `badge-prioridade badge-prioridade--` +
        prioridadeNormalizada;

    prioridade.textContent =
        `⚑ ${tarefa.prioridade || "Sem prioridade"}`;

    const prazo = document.createElement("p");
    prazo.className = "cartao-prazo";

    prazo.textContent =
        `▦ Prazo: ${formatarData(tarefa.prazo)}`;

    if (atrasada) {
        prazo.classList.add("etiqueta-atraso");
        prazo.textContent += " — Atrasada";
    }

    const botao = document.createElement("button");
    botao.type = "button";
    botao.dataset.acao = "ver-detalhes";
    botao.textContent = "Ver detalhes →";

    cartao.append(
        topo,
        titulo,
        criarLinhaMeta(
            "Projeto",
            tarefa.projeto || "Geral"
        ),
        criarLinhaMeta(
            "Responsável",
            tarefa.responsavel || "Não atribuído"
        ),
        prioridade,
        prazo,
        botao
    );

    return cartao;
}

/* --------------------------------------------------
   RENDERIZAÇÃO DO QUADRO
-------------------------------------------------- */

export function renderizarTarefas(tarefas, quadro) {
    if (!quadro) {
        return;
    }

    quadro.querySelectorAll("[data-lista-status]")
        .forEach((lista) => {
            const status = lista.dataset.listaStatus;

            const grupo = tarefas.filter(
                (tarefa) => tarefa.status === status
            );

            const secao = lista.closest(
                'section[aria-labelledby^="quadro-"]'
            );

            const titulo = secao?.querySelector("h3");

            if (titulo) {
                let contador = titulo.querySelector(
                    ".contador-coluna"
                );

                if (!contador) {
                    contador = document.createElement("span");
                    contador.className = "contador-coluna";

                    contador.setAttribute(
                        "aria-label",
                        "Quantidade de tarefas"
                    );

                    titulo.append(contador);
                }

                contador.textContent = String(grupo.length);
            }

            if (grupo.length === 0) {
                const vazio = document.createElement("li");
                vazio.className = "coluna-vazia";
                vazio.textContent =
                    "✨ Tudo tranquilo por aqui";

                lista.replaceChildren(vazio);
                return;
            }

            const itens = grupo.map((tarefa) => {
                const item = document.createElement("li");
                item.append(criarCartao(tarefa));
                return item;
            });

            lista.replaceChildren(...itens);
        });
}

/* --------------------------------------------------
   EVENTOS DO QUADRO
-------------------------------------------------- */

export function instalarEventosDoQuadro(
    quadro,
    obterTarefas,
    salvarTarefa,
    excluirTarefa
) {
    if (!quadro) {
        return;
    }

    quadro.addEventListener("click", (evento) => {
        if (!(evento.target instanceof Element)) {
            return;
        }

        const botao = evento.target.closest(
            'button[data-acao="ver-detalhes"]'
        );

        if (!botao || !quadro.contains(botao)) {
            return;
        }

        const cartao = botao.closest("[data-tarefa-id]");

        if (!cartao) {
            return;
        }

        const tarefas = obterTarefas();

        if (!Array.isArray(tarefas)) {
            return;
        }

        const tarefa = tarefas.find(
            (item) =>
                String(item.id) ===
                String(cartao.dataset.tarefaId)
        );

        if (!tarefa) {
            return;
        }

        abrirDetalhes(
            tarefa,
            botao,
            salvarTarefa,
            excluirTarefa
        );
    });
}