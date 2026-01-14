/**
 * Sistema de Chat com DNOVO
 * Gerencia conversas e mensagens usando localStorage
 */

class ChatSystem {
    constructor() {
        this.conversaAtiva = null;
        this.usuarioLogado = null;
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

        this.carregarConversas();
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
            // Criar alguns usuários de teste
            const usuarios = [
                { id: 2, email: 'pintor@email.com', nome: 'pintor', tipo: 'prestador' },
                { id: 3, email: 'empresa@email.com', nome: 'empresa de fretado', tipo: 'empresa' },
                { id: 4, email: 'faxineiro@email.com', nome: 'faxineiro', tipo: 'prestador' }
            ];

            // Criar conversas de teste
            usuarios.forEach(usuario => {
                const conversa = db.insert('conversas', {
                    usuarioId1: this.usuarioLogado.usuarioId,
                    usuarioId2: usuario.id,
                    nome1: 'Você',
                    nome2: usuario.nome,
                    ultimaMensagem: 'Clique para abrir conversa...',
                    dataUltimaMensagem: new Date().toLocaleDateString('pt-BR'),
                    naoLidas1: Math.floor(Math.random() * 3),
                    naoLidas2: 0
                });

                // Adicionar mensagens de teste
                const mensagensTest = [
                    { remetenteId: usuario.id, remetente: usuario.nome, conteudo: 'Olá! Posso ajudar?' },
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
     * Configura os eventos do chat
     */
    setupEventos() {
        const btnVoltar = document.getElementById('btn-voltar');
        const formMensagem = document.getElementById('form-mensagem');

        btnVoltar.addEventListener('click', () => {
            this.voltarParaLista();
        });

        formMensagem.addEventListener('submit', (e) => {
            e.preventDefault();
            this.enviarMensagem();
        });
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

        // Mostrar a conversa
        document.getElementById('conversas-lista').style.display = 'none';
        document.getElementById('conversa-detalhe').style.display = 'flex';

        // Atualizar header
        document.getElementById('conversa-nome').textContent = nomeConversa;
        document.getElementById('conversa-status').textContent = 'visto por último';

        // Carregar mensagens
        this.carregarMensagens(conversaId);

        // Marcar como lidas
        this.marcarComoLidas(conversaId);
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
     * Volta para a lista de conversas
     */
    voltarParaLista() {
        this.conversaAtiva = null;
        document.getElementById('conversas-lista').style.display = 'flex';
        document.getElementById('conversa-detalhe').style.display = 'none';
        this.carregarConversas();
    }
}

// Inicializar chat quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    new ChatSystem();
});