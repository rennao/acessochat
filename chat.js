/**
 * Sistema de Chat com DNOVO
 * Gerencia conversas e mensagens usando localStorage
 */

class ChatSystem {
    constructor() {
        this.conversaAtiva = null;
        this.usuarioLogado = null;
        this.modo = 'conversas'; // 'conversas' ou 'contatos'
        this.init();
    }

    /**
     * Inicializa o sistema de chat
     */
    init() {
        this.usuarioLogado = db.selectOne('sessionStorage', {});
        if (!this.usuarioLogado) {
            alert('Você precisa estar logado para acessar o chat!');
            window.location.href = 'login.html';
            return;
        }

        // Verificar se há um parâmetro de conversa na URL
        const params = new URLSearchParams(window.location.search);
        const conversaIdParam = params.get('conversa');

        // Criar botão menu dinamicamente
        this.criarBotaoMenu();

        this.carregarConteudo();
        this.setupEventos();
        this.adicionarConversasDemoTest();

        // Se houver um ID de conversa, abrir automaticamente
        if (conversaIdParam) {
            setTimeout(() => {
                this.abrirConversa(parseInt(conversaIdParam));
            }, 500);
        }
    }

    /**
     * Adiciona conversas de teste
     */
    adicionarConversasDemoTest() {
        const conversasExistentes = db.count('conversas');
        if (conversasExistentes === 0) {
            // Criar alguns usuários de teste se não existirem
            const usuariosTest = [
                { email: 'pintor@email.com', senha: '123', tipo: 'prestador' },
                { email: 'empresa@email.com', senha: '123', tipo: 'empresa' },
                { email: 'faxineiro@email.com', senha: '123', tipo: 'prestador' }
            ];

            const usuariosInseridos = [];
            usuariosTest.forEach(user => {
                const existing = db.select('usuarios', { email: user.email });
                if (existing.length === 0) {
                    const inserted = db.insert('usuarios', {
                        email: user.email,
                        senha: user.senha,
                        tipo: user.tipo,
                        dataCadastro: new Date().toLocaleDateString('pt-BR')
                    });
                    usuariosInseridos.push({ ...user, id: inserted.id });
                } else {
                    usuariosInseridos.push({ ...user, id: existing[0].id });
                }
            });

            // Criar conversas de teste
            usuariosInseridos.forEach(usuario => {
                const conversa = db.insert('conversas', {
                    usuarioId1: this.usuarioLogado.usuarioId,
                    usuarioId2: usuario.id,
                    nome1: 'Você',
                    nome2: usuario.email,
                    ultimaMensagem: 'Clique para abrir conversa...',
                    dataUltimaMensagem: new Date().toLocaleDateString('pt-BR'),
                    naoLidas1: Math.floor(Math.random() * 3),
                    naoLidas2: 0
                });

                // Adicionar mensagens de teste
                const mensagensTest = [
                    { remetenteId: usuario.id, remetente: usuario.email, conteudo: 'Olá! Posso ajudar?' },
                    { remetenteId: this.usuarioLogado.usuarioId, remetente: 'Você', conteudo: 'Sim, obrigado!' }
                ];

                mensagensTest.forEach(msg => {
                    db.insert('mensagens', {
                        conversaId: conversa.id,
                        remetenteId: msg.remetenteId,
                        remetente: msg.remetente,
                        conteudo: msg.conteudo,
                        lida: msg.remetenteId === this.usuarioLogado.usuarioId,
                        dataMensagem: new Date().toLocaleDateString('pt-BR'),
                        horaMensagem: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    });
                });
            });
        }
    }

    /**
     * Cria o botão menu dinamicamente
     */
    criarBotaoMenu() {
        const container = document.querySelector('.chat-container');
        if (!container) {
            console.error('Container não encontrado!');
            return;
        }
        
        // Criar botão de forma mais simples
        const btnMenu = document.createElement('button');
        btnMenu.id = 'btn-menu';
        btnMenu.innerHTML = '☰';
        btnMenu.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 99999;
            background: #5a7fb0;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 20px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: background-color 0.3s ease;
        `;
        
        btnMenu.addEventListener('mouseover', () => {
            btnMenu.style.backgroundColor = '#475a8c';
        });
        
        btnMenu.addEventListener('mouseout', () => {
            btnMenu.style.backgroundColor = '#5a7fb0';
        });
        
        document.body.appendChild(btnMenu);
    }

    /**
     * Configura os eventos do chat
     */
    setupEventos() {
        const formMensagem = document.getElementById('form-mensagem');
        const btnToggleContatos = document.getElementById('btn-toggle-contatos');
        const btnMenu = document.getElementById('btn-menu');

        if (formMensagem) {
            formMensagem.addEventListener('submit', (e) => {
                e.preventDefault();
                this.enviarMensagem();
            });
        }

        if (btnToggleContatos) {
            btnToggleContatos.addEventListener('click', () => {
                this.toggleModo();
            });
        }

        if (btnMenu) {
            btnMenu.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSidebar();
            });
        } else {
            console.error('Botão menu não encontrado!');
        }
    }

    /**
     * Carrega o conteúdo baseado no modo atual
     */
    carregarConteudo() {
        if (this.modo === 'conversas') {
            this.carregarConversas();
        } else {
            this.carregarContatos();
        }
    }

    /**
     * Alterna a visibilidade da barra lateral
     */
    toggleSidebar() {
        const sidebar = document.getElementById('conversas-lista');
        const container = document.querySelector('.chat-container');
        
        if (sidebar && container) {
            sidebar.classList.toggle('open');
            container.classList.toggle('sidebar-open');
        } else {
            console.error('Elementos não encontrados para toggle');
        }
    }

    /**
     * Alterna entre modo conversas e contatos
     */
    toggleModo() {
        this.modo = this.modo === 'conversas' ? 'contatos' : 'conversas';
        const header = document.querySelector('.conversas-header h2');
        const btnToggle = document.getElementById('btn-toggle-contatos');
        
        if (this.modo === 'conversas') {
            header.textContent = 'CONVERSAS';
            btnToggle.textContent = 'Contatos';
        } else {
            header.textContent = 'CONTATOS';
            btnToggle.textContent = 'Conversas';
        }
        
        this.carregarConteudo();
        
        // Se estamos em modo contatos mas temos uma conversa ativa, voltar para conversas
        if (this.modo === 'contatos' && this.conversaAtiva) {
            this.modo = 'conversas';
            header.textContent = 'CONVERSAS';
            btnToggle.textContent = 'Contatos';
            this.carregarConteudo();
        }
        
        // Garantir que a sidebar esteja aberta quando alternar modos
        const sidebar = document.getElementById('conversas-lista');
        const container = document.querySelector('.chat-container');
        if (!sidebar.classList.contains('open')) {
            sidebar.classList.add('open');
            container.classList.add('sidebar-open');
        }
    }

    /**
     * Carrega todos os contatos disponíveis
     */
    carregarContatos() {
        const usuarios = db.select('usuarios');
        const contatos = usuarios.filter(u => u.id !== this.usuarioLogado.usuarioId);

        const conversasItems = document.getElementById('conversas-items');
        conversasItems.innerHTML = '';

        contatos.forEach(contato => {
            const element = this.criarElementoContato(contato);
            conversasItems.appendChild(element);
        });
    }

    /**
     * Cria um elemento de contato na lista
     */
    criarElementoContato(contato) {
        const div = document.createElement('div');
        div.className = 'conversa-item';
        div.innerHTML = `
            <div class="conversa-avatar"></div>
            <div class="conversa-conteudo">
                <div class="conversa-nome-info">
                    <h4>${contato.email}</h4>
                    <span class="conversa-status">${contato.tipo}</span>
                </div>
                <p class="conversa-ultima-msg">Clique para iniciar conversa</p>
            </div>
        `;

        div.addEventListener('click', () => {
            this.iniciarConversaComContato(contato);
        });

        return div;
    }

    /**
     * Inicia uma conversa com um contato
     */
    iniciarConversaComContato(contato) {
        // Verificar se já existe uma conversa
        const conversas = db.select('conversas');
        let conversaExistente = conversas.find(c => 
            (c.usuarioId1 === this.usuarioLogado.usuarioId && c.usuarioId2 === contato.id) ||
            (c.usuarioId1 === contato.id && c.usuarioId2 === this.usuarioLogado.usuarioId)
        );

        if (conversaExistente) {
            // Abrir conversa existente
            this.abrirConversa(conversaExistente.id);
        } else {
            // Criar nova conversa
            const novaConversa = db.insert('conversas', {
                usuarioId1: this.usuarioLogado.usuarioId,
                usuarioId2: contato.id,
                nome1: 'Você',
                nome2: contato.email,
                ultimaMensagem: 'Conversa iniciada',
                dataUltimaMensagem: new Date().toLocaleDateString('pt-BR'),
                naoLidas1: 0,
                naoLidas2: 0
            });

            // Adicionar mensagem inicial
            db.insert('mensagens', {
                conversaId: novaConversa.id,
                remetenteId: this.usuarioLogado.usuarioId,
                remetente: 'Você',
                conteudo: 'Olá! Gostaria de conversar.',
                lida: false,
                dataMensagem: new Date().toLocaleDateString('pt-BR'),
                horaMensagem: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            });

            // Recarregar lista e abrir nova conversa
            this.carregarConteudo();
            this.abrirConversa(novaConversa.id);
            
            // Fechar sidebar para focar na conversa
            const sidebar = document.getElementById('conversas-lista');
            const container = document.querySelector('.chat-container');
            sidebar.classList.remove('open');
            container.classList.remove('sidebar-open');
        }
    }

    /**
     * Carrega todas as conversas do usuário
     */
    carregarConversas() {
        const conversas = db.select('conversas');
        const minhasConversas = conversas.filter(
            c => c.usuarioId1 === this.usuarioLogado.usuarioId || c.usuarioId2 === this.usuarioLogado.usuarioId
        );

        const conversasItems = document.getElementById('conversas-items');
        conversasItems.innerHTML = '';

        minhasConversas.forEach(conversa => {
            const nomeConversa = conversa.usuarioId1 === this.usuarioLogado.usuarioId 
                ? conversa.nome2 
                : conversa.nome1;
            
            const naoLidas = conversa.usuarioId1 === this.usuarioLogado.usuarioId 
                ? conversa.naoLidas1 
                : conversa.naoLidas2;

            const element = this.criarElementoConversa(conversa, nomeConversa, naoLidas);
            conversasItems.appendChild(element);
        });
    }

    /**
     * Cria um elemento de conversa na lista
     */
    criarElementoConversa(conversa, nome, naoLidas) {
        const div = document.createElement('div');
        div.className = 'conversa-item';
        div.innerHTML = `
            <div class="conversa-avatar"></div>
            <div class="conversa-conteudo">
                <div class="conversa-nome-info">
                    <h4>${nome}</h4>
                    <span class="conversa-status">visto por último</span>
                </div>
                <p class="conversa-ultima-msg">${conversa.ultimaMensagem}</p>
            </div>
            ${naoLidas > 0 ? `<div class="badge-nao-lidas">${naoLidas}</div>` : ''}
        `;

        div.addEventListener('click', () => {
            this.abrirConversa(conversa.id);
        });

        return div;
    }

    /**
     * Abre uma conversa específica
     */
    abrirConversa(conversaId) {
        this.conversaAtiva = db.selectOne('conversas', { id: conversaId });
        
        const nomeConversa = this.conversaAtiva.usuarioId1 === this.usuarioLogado.usuarioId 
            ? this.conversaAtiva.nome2 
            : this.conversaAtiva.nome1;

        // Manter a lista lateral sempre visível
        // document.getElementById('conversas-lista').style.display = 'none';
        // document.getElementById('conversa-detalhe').style.display = 'flex';

        // Atualizar header
        document.getElementById('conversa-nome').textContent = nomeConversa;
        document.getElementById('conversa-status').textContent = 'visto por último';

        // Carregar mensagens
        this.carregarMensagens(conversaId);

        // Marcar como lidas
        this.marcarComoLidas(conversaId);
        
        // Fechar sidebar para focar na conversa
        const sidebar = document.getElementById('conversas-lista');
        const container = document.querySelector('.chat-container');
        sidebar.classList.remove('open');
        container.classList.remove('sidebar-open');
    }

    /**
     * Carrega as mensagens de uma conversa
     */
    carregarMensagens(conversaId) {
        const mensagens = db.select('mensagens', { conversaId });
        const mensagensArea = document.getElementById('mensagens-area');
        mensagensArea.innerHTML = '';

        mensagens.forEach(msg => {
            const msgElement = this.criarElementoMensagem(msg);
            mensagensArea.appendChild(msgElement);
        });

        // Scroll para o final
        mensagensArea.scrollTop = mensagensArea.scrollHeight;
    }

    /**
     * Cria um elemento de mensagem
     */
    criarElementoMensagem(mensagem) {
        const div = document.createElement('div');
        const ehMinha = mensagem.remetenteId === this.usuarioLogado.usuarioId;
        
        div.className = `mensagem ${ehMinha ? 'minha-mensagem' : 'outra-mensagem'}`;
        div.innerHTML = `
            <div class="msg-conteudo">
                <p>${mensagem.conteudo}</p>
                <span class="msg-hora">${mensagem.horaMensagem}</span>
            </div>
        `;

        return div;
    }

    /**
     * Envia uma mensagem
     */
    enviarMensagem() {
        const input = document.getElementById('input-mensagem');
        const conteudo = input.value.trim();

        if (!conteudo || !this.conversaAtiva) {
            return;
        }

        // Inserir mensagem no BD
        db.insert('mensagens', {
            conversaId: this.conversaAtiva.id,
            remetenteId: this.usuarioLogado.usuarioId,
            remetente: 'Você',
            conteudo,
            lida: false,
            dataMensagem: new Date().toLocaleDateString('pt-BR'),
            horaMensagem: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });

        // Atualizar última mensagem da conversa
        db.update('conversas', {
            ultimaMensagem: conteudo,
            dataUltimaMensagem: new Date().toLocaleDateString('pt-BR')
        }, { id: this.conversaAtiva.id });

        // Limpar input e recarregar
        input.value = '';
        this.carregarMensagens(this.conversaAtiva.id);
        this.carregarConversas();
    }

    /**
     * Marca mensagens como lidas
     */
    marcarComoLidas(conversaId) {
        const mensagens = db.select('mensagens', { conversaId, lida: false });
        
        mensagens.forEach(msg => {
            if (msg.remetenteId !== this.usuarioLogado.usuarioId) {
                db.update('mensagens', { lida: true }, { id: msg.id });
            }
        });

        // Atualizar contagem de não lidas
        if (this.conversaAtiva.usuarioId1 === this.usuarioLogado.usuarioId) {
            db.update('conversas', { naoLidas1: 0 }, { id: conversaId });
        } else {
            db.update('conversas', { naoLidas2: 0 }, { id: conversaId });
        }
    }

    /**
     * Recarrega a lista lateral
     */
    recarregarLista() {
        this.conversaAtiva = null;
        // Lista sempre visível, apenas recarregar conteúdo
        this.carregarConteudo();
    }
}

// Inicializar chat quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    new ChatSystem();
});
