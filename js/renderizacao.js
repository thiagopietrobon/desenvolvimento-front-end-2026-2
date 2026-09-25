export const STATUS_LABELS = {
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

function criarLinhaMeta(rotulo, valor, classe = "") {
    const linha = document.createElement("p");

    if (classe) {
        linha.className = classe;
    }

    const rotuloElemento = document.createElement("strong");
    rotuloElemento.textContent = `${rotulo}: `;

    const valorElemento = document.createElement("span");
    valorElemento.textContent = valor;

    linha.append(rotuloElemento, valorElemento);

    return linha;
}

function formatarData(data) {
    if (!data) {
        return "Não definido";
    }

    const partes = String(data).match(/^(\d{4})-(\d{2})-(\d{2})$/);

    return partes
        ? `${partes[3]}/${partes[2]}/${partes[1]}`
        : String(data);
}

function criarCampo(rotulo, nome, tipo = "text", valor = "") {
    const label = document.createElement("label");
    label.className = "modal-tarefa-campo";
    label.textContent = rotulo;

    const input = document.createElement("input");
    input.name = nome;
    input.type = tipo;
    input.value = valor ?? "";
    input.required = nome === "titulo";

    label.append(input);

    return label;
}

/*
 * Cria um grupo de opções segmentadas.
 *
 * O grupo usa botões visuais, mas mantém um input hidden
 * para que os dados continuem sendo enviados pelo FormData.
 */
function criarGrupoSegmentado(rotulo, nome, opcoes, valorAtual) {
    const campo = document.createElement("fieldset");

    campo.className =
        `modal-tarefa-campo modal-tarefa-segmentado modal-tarefa-segmentado--${nome}`;

    const legenda = document.createElement("legend");
    legenda.textContent = rotulo;

    const grupo = document.createElement("div");
    grupo.className = "grupo-segmentado";
    grupo.setAttribute("role", "radiogroup");
    grupo.setAttribute("aria-label", rotulo);

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = nome;
    input.value = valorAtual ?? "";

    opcoes.forEach(([valor, texto]) => {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.className = "botao-segmentado";
        botao.dataset.valor = valor;
        botao.textContent = texto;

        const selecionado = valor === valorAtual;

        botao.classList.toggle("ativo", selecionado);
        botao.setAttribute("aria-pressed", String(selecionado));

        botao.addEventListener("click", () => {
            input.value = valor;

            grupo.querySelectorAll(".botao-segmentado").forEach((item) => {
                const ativo = item === botao;

                item.classList.toggle("ativo", ativo);
                item.setAttribute("aria-pressed", String(ativo));
            });
        });

        grupo.append(botao);
    });

    campo.append(legenda, grupo, input);

    return campo;
}

function obterModal() {
    let modal = document.getElementById("modal-detalhes-tarefa");

    if (modal) {
        return modal;
    }

    modal = document.createElement("dialog");
    modal.id = "modal-detalhes-tarefa";
    modal.className = "modal-tarefa";
    modal.setAttribute("aria-labelledby", "modal-tarefa-titulo");

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
    fechar.setAttribute("aria-label", "Fechar detalhes da tarefa");

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

    const titulo = modal.querySelector("#modal-tarefa-titulo");
    const corpo = modal.querySelector("[data-modal-corpo]");

    titulo.textContent = tarefa.titulo || "Detalhes da tarefa";

    const form = document.createElement("form");
    form.className = "modal-tarefa-form";

    form.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const dados = new FormData(form);

        const atualizado = {
            ...tarefa,
            titulo: String(dados.get("titulo") || "").trim(),
            status: String(dados.get("status") || ""),
            prioridade: String(dados.get("prioridade") || ""),
            prazo: String(dados.get("prazo") || "")
        };

        if (!atualizado.titulo) {
            return;
        }

        salvarTarefa(atualizado);
        modal.close();
    });

    /*
     * Título
     */
    form.append(
        criarCampo(
            "Título",
            "titulo",
            "text",
            tarefa.titulo
        )
    );

    /*
     * Status
     */
    form.append(
        criarGrupoSegmentado(
            "Status",
            "status",
            STATUS.map((status) => [
                status,
                STATUS_LABELS[status]
            ]),
            tarefa.status
        )
    );

    /*
     * Prioridade
     */
    form.append(
        criarGrupoSegmentado(
            "Prioridade",
            "prioridade",
            PRIORIDADES.map((prioridade) => [
                prioridade,
                prioridade
            ]),
            tarefa.prioridade
        )
    );

    /*
     * Prazo
     */
    form.append(
        criarCampo(
            "Prazo",
            "prazo",
            "date",
            tarefa.prazo
        )
    );

    /*
     * Informações complementares
     */
    form.append(
        criarLinhaMeta(
            "Projeto",
            tarefa.projeto || "Geral"
        ),
        criarLinhaMeta(
            "Responsável",
            tarefa.responsavel || "Não atribuído"
        )
    );

    /*
     * Ações
     */
    const footer = document.createElement("div");
    footer.className = "modal-tarefa-acoes";

    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.className = "botao-secundario";
    cancelar.textContent = "Cancelar";

    cancelar.addEventListener("click", () => {
        modal.close();
    });

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "botao-excluir-tarefa";
    excluir.textContent = "Excluir tarefa";

    excluir.addEventListener("click", () => {
        if (
            window.confirm(
                `Tem certeza de que deseja excluir “${tarefa.titulo}”? Esta ação não pode ser desfeita.`
            )
        ) {
            excluirTarefa(tarefa.id);
            modal.close();
        }
    });

    const salvar = document.createElement("button");
    salvar.type = "submit";
    salvar.className = "botao-primario";
    salvar.textContent = "Salvar alterações";

    footer.append(
        cancelar,
        excluir,
        salvar
    );

    form.append(footer);

    corpo.replaceChildren(form);

    modal.addEventListener("close", function restaurar() {
        modal.removeEventListener("close", restaurar);
        botaoOrigem?.focus();
    });

    modal.showModal();

    form.querySelector("[name=titulo]")?.focus();
}

export function criarCartao(tarefa) {
    const cartao = document.createElement("article");

    cartao.className = `cartao cartao--${tarefa.status}`;

    if (tarefa.atrasada) {
        cartao.classList.add("cartao--atrasada");
    }

    cartao.dataset.tarefaId = tarefa.id;

    /*
     * Topo do card
     */
    const topo = document.createElement("div");
    topo.className = "cartao-topo";

    const status = document.createElement("span");
    status.className = `badge-status badge-status--${tarefa.status}`;
    status.textContent =
        STATUS_LABELS[tarefa.status] || tarefa.status;

    topo.append(status);

    /*
     * Título
     */
    const titulo = document.createElement("h4");
    titulo.textContent = tarefa.titulo;

    /*
     * Prioridade
     */
    const prioridade = document.createElement("span");

    const classePrioridade = String(
        tarefa.prioridade || ""
    )
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    prioridade.className =
        `badge-prioridade badge-prioridade--${classePrioridade}`;

    prioridade.textContent =
        `⚑ ${tarefa.prioridade || "Sem prioridade"}`;

    /*
     * Prazo
     */
    const prazo = document.createElement("p");
    prazo.className = "cartao-prazo";
    prazo.textContent =
        `▦ Prazo: ${formatarData(tarefa.prazo)}`;

    /*
     * Indicador de atraso
     */
    if (tarefa.atrasada) {
        const aviso = document.createElement("span");

        aviso.className = "etiqueta-atraso";
        aviso.textContent = "⚠ TAREFA ATRASADA";
        aviso.setAttribute("role", "status");

        cartao.append(aviso);
    }

    /*
     * Botão de detalhes
     */
    const botao = document.createElement("button");

    botao.type = "button";
    botao.dataset.acao = "ver-detalhes";
    botao.className = "botao-detalhes";
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

export function renderizarTarefas(tarefas, quadro) {
    if (!quadro) {
        return;
    }

    quadro
        .querySelectorAll("[data-lista-status]")
        .forEach((lista) => {
            const status = lista.dataset.listaStatus;

            const grupo = tarefas.filter(
                (tarefa) => tarefa.status === status
            );

            const secao = lista.closest(
                'section[aria-labelledby^="quadro-"]'
            );

            const titulo = secao?.querySelector("h3");

            /*
             * Atualiza o contador da coluna
             */
            if (titulo) {
                let contador =
                    titulo.querySelector(".contador-coluna");

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

            /*
             * Estado vazio
             */
            if (!grupo.length) {
                const vazio = document.createElement("li");

                vazio.className = "coluna-vazia";
                vazio.textContent =
                    "✨ Tudo tranquilo por aqui";

                lista.replaceChildren(vazio);

                return;
            }

            /*
             * Cards
             */
            lista.replaceChildren(
                ...grupo.map((tarefa) => {
                    const li = document.createElement("li");

                    li.append(
                        criarCartao(tarefa)
                    );

                    return li;
                })
            );
        });
}

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

        const cartao = botao.closest(
            "[data-tarefa-id]"
        );

        if (!cartao) {
            return;
        }

        const tarefas =
            typeof obterTarefas === "function"
                ? obterTarefas()
                : obterTarefas;

        const tarefa = Array.isArray(tarefas)
            ? tarefas.find(
                (item) =>
                    String(item.id) ===
                    String(cartao.dataset.tarefaId)
            )
            : null;

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