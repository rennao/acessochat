// ===== Carregar anúncios do banco de dados =====
function carregarAnuncios() {
    const anuncios = db.select('anuncios');
    anuncios.forEach(anuncio => {
        // Buscar conversa associada ao anúncio
        const conversa = db.selectOne('conversas', { 
            usuarioId1: anuncio.usuarioId,
            nome2: anuncio.empresa
        });
        
        adicionarAnuncio(
            anuncio.titulo, 
            anuncio.imagem, 
            anuncio.descricao, 
            anuncio.empresa,
            anuncio.usuarioId,
            conversa ? conversa.id : null
        );
    });
}

// ===== Função para adicionar anúncio =====
function adicionarAnuncio(titulo, imagem, descricao, label = 'anuncio', usuarioId = null, conversaId = null) {
    const anunciosArea = document.getElementById('anuncios-area');
    
    const card = document.createElement('div');
    card.className = 'anuncio-card';
    
    card.innerHTML = `
        <div class="anuncio-label">${label}</div>
        <div class="anuncio-titulo">${titulo}</div>
        <img src="${imagem}" alt="${titulo}" class="anuncio-imagem" onerror="this.src='https://via.placeholder.com/80?text=Imagem'">
        <div class="anuncio-descricao">${descricao}</div>
        <button class="btn btn-conversar" data-usuario-id="${usuarioId}" data-conversa-id="${conversaId}">Conversar</button>
    `;
    
    anunciosArea.appendChild(card);

    // Adicionar evento ao botão de conversar
    const btnConversar = card.querySelector('.btn-conversar');
    if (btnConversar) {
        btnConversar.addEventListener('click', () => {
            const usuarioId = btnConversar.dataset.usuarioId;
            const conversaId = btnConversar.dataset.conversaId;
            
            if (usuarioId && conversaId) {
                // Redirecionar para chat com a conversa específica
                window.location.href = `chat.html?conversa=${conversaId}`;
            } else {
                alert('Você precisa estar logado para conversar!');
                window.location.href = 'login.html';
            }
        });
    }
}

// ===== Salvar anúncio no banco de dados =====
function salvarAnuncio(titulo, imagem, descricao, empresa) {
    const sessao = db.selectOne('sessionStorage', {});
    const usuarioId = sessao ? sessao.usuarioId : null;
    
    const anuncio = db.insert('anuncios', {
        titulo,
        imagem,
        descricao,
        empresa,
        usuarioId,
        dataCriacao: new Date().toLocaleDateString('pt-BR')
    });

    // Criar conversa automaticamente com a empresa
    if (usuarioId && anuncio) {
        const conversa = db.insert('conversas', {
            usuarioId1: usuarioId,
            usuarioId2: usuarioId, // Será atualizado quando alguém conversar
            nome1: 'Você',
            nome2: empresa,
            ultimaMensagem: 'Anúncio publicado',
            dataUltimaMensagem: new Date().toLocaleDateString('pt-BR'),
            naoLidas1: 0,
            naoLidas2: 0
        });

        return { anuncio, conversaId: conversa.id };
    }
    
    return { anuncio, conversaId: null };
}

// ===== Formulário para adicionar anúncio =====
const formAnuncio = document.getElementById('form-anuncio');
if (formAnuncio) {
    formAnuncio.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const titulo = document.getElementById('anuncio-titulo').value;
        const imagem = document.getElementById('anuncio-imagem').value;
        const descricao = document.getElementById('anuncio-descricao').value;
        const empresa = document.getElementById('empresa-nome').value;
        
        if (titulo && imagem && descricao) {
            const resultado = salvarAnuncio(titulo, imagem, descricao, empresa);
            adicionarAnuncio(titulo, imagem, descricao, empresa, resultado.anuncio.usuarioId, resultado.conversaId);
            formAnuncio.reset();
            alert('Anúncio publicado com sucesso!');
        } else {
            alert('Por favor, preencha todos os campos!');
        }
    });
}

// ===== Carregar anúncios ao iniciar a página =====
document.addEventListener('DOMContentLoaded', () => {
    carregarAnuncios();
});

// ===== Botão "Saiba nossa causa" =====
const btnCausa = document.querySelector('.btn-causa');
if (btnCausa) {
    btnCausa.addEventListener('click', () => {
        alert('Saiba mais sobre nossa causa!');
    });
}

// ===== Botões de Ação =====
const btnPrestar = document.querySelector('.btn-prestar');
const btnContratar = document.querySelector('.btn-contratar');

if (btnPrestar) {
    btnPrestar.addEventListener('click', () => {
        console.log('Usuário quer prestar serviços');
        // Adicionar lógica aqui
    });
}

if (btnContratar) {
    btnContratar.addEventListener('click', () => {
        console.log('Usuário quer contratar serviços');
        // Adicionar lógica aqui
    });
}

// ===== Botões de Autenticação =====
const btnCadastro = document.querySelector('.btn-cadastro');
const btnLogin = document.querySelector('.btn-login');

if (btnCadastro) {
    btnCadastro.addEventListener('click', () => {
        window.location.href = 'cadastro.html';
    });
}

if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
}
