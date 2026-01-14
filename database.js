/**
 * Sistema de Banco de Dados com localStorage
 * Simula um banco SQL usando localStorage
 */

class Database {
    constructor() {
        this.dbName = 'dnovo_db';
        this.initializeDatabase();
    }

    /**
     * Inicializa as tabelas do banco de dados
     */
    initializeDatabase() {
        if (!this.getTable('usuarios')) {
            this.createTable('usuarios', [
                { name: 'id', type: 'number', primary: true },
                { name: 'email', type: 'string', unique: true },
                { name: 'senha', type: 'string' },
                { name: 'tipo', type: 'string' }, // 'empresa' ou 'prestador'
                { name: 'dataCadastro', type: 'string' }
            ]);
        }

        if (!this.getTable('anuncios')) {
            this.createTable('anuncios', [
                { name: 'id', type: 'number', primary: true },
                { name: 'titulo', type: 'string' },
                { name: 'imagem', type: 'string' },
                { name: 'descricao', type: 'string' },
                { name: 'empresa', type: 'string' },
                { name: 'usuarioId', type: 'number' },
                { name: 'dataCriacao', type: 'string' }
            ]);
        }

        if (!this.getTable('sessionStorage')) {
            this.createTable('sessionStorage', [
                { name: 'usuarioId', type: 'number' },
                { name: 'email', type: 'string' },
                { name: 'tipo', type: 'string' },
                { name: 'loginTime', type: 'string' }
            ]);
        }

        if (!this.getTable('conversas')) {
            this.createTable('conversas', [
                { name: 'id', type: 'number', primary: true },
                { name: 'usuarioId1', type: 'number' },
                { name: 'usuarioId2', type: 'number' },
                { name: 'nome1', type: 'string' },
                { name: 'nome2', type: 'string' },
                { name: 'ultimaMensagem', type: 'string' },
                { name: 'dataUltimaMensagem', type: 'string' },
                { name: 'naoLidas1', type: 'number' }, // não lidas para usuário 1
                { name: 'naoLidas2', type: 'number' }  // não lidas para usuário 2
            ]);
        }

        if (!this.getTable('mensagens')) {
            this.createTable('mensagens', [
                { name: 'id', type: 'number', primary: true },
                { name: 'conversaId', type: 'number' },
                { name: 'remetenteId', type: 'number' },
                { name: 'remetente', type: 'string' },
                { name: 'conteudo', type: 'string' },
                { name: 'lida', type: 'boolean' },
                { name: 'dataMensagem', type: 'string' },
                { name: 'horaMensagem', type: 'string' }
            ]);
        }
    }

    /**
     * Cria uma nova tabela
     */
    createTable(tableName, schema) {
        const tables = JSON.parse(localStorage.getItem('tables')) || {};
        tables[tableName] = {
            schema: schema,
            data: [],
            nextId: 1
        };
        localStorage.setItem('tables', JSON.stringify(tables));
    }

    /**
     * Obtém uma tabela
     */
    getTable(tableName) {
        const tables = JSON.parse(localStorage.getItem('tables')) || {};
        return tables[tableName] || null;
    }

    /**
     * Insere um registro em uma tabela
     */
    insert(tableName, data) {
        const tables = JSON.parse(localStorage.getItem('tables')) || {};
        const table = tables[tableName];

        if (!table) {
            console.error(`Tabela ${tableName} não existe`);
            return false;
        }

        // Gerar ID automático
        data.id = table.nextId++;

        // Validar campos únicos
        const schema = table.schema;
        const uniqueFields = schema.filter(field => field.unique);
        
        for (let field of uniqueFields) {
            const exists = table.data.some(row => row[field.name] === data[field.name]);
            if (exists) {
                console.error(`${field.name} já existe`);
                return false;
            }
        }

        table.data.push(data);
        localStorage.setItem('tables', JSON.stringify(tables));
        return data;
    }

    /**
     * Busca registros em uma tabela
     */
    select(tableName, where = null) {
        const tables = JSON.parse(localStorage.getItem('tables')) || {};
        const table = tables[tableName];

        if (!table) {
            console.error(`Tabela ${tableName} não existe`);
            return [];
        }

        if (!where) {
            return table.data;
        }

        return table.data.filter(row => {
            for (let key in where) {
                if (row[key] !== where[key]) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Busca um único registro
     */
    selectOne(tableName, where) {
        const results = this.select(tableName, where);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Atualiza registros em uma tabela
     */
    update(tableName, data, where) {
        const tables = JSON.parse(localStorage.getItem('tables')) || {};
        const table = tables[tableName];

        if (!table) {
            console.error(`Tabela ${tableName} não existe`);
            return false;
        }

        let updated = 0;
        table.data = table.data.map(row => {
            let matches = true;
            for (let key in where) {
                if (row[key] !== where[key]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                updated++;
                return { ...row, ...data };
            }
            return row;
        });

        localStorage.setItem('tables', JSON.stringify(tables));
        return updated > 0;
    }

    /**
     * Deleta registros de uma tabela
     */
    delete(tableName, where) {
        const tables = JSON.parse(localStorage.getItem('tables')) || {};
        const table = tables[tableName];

        if (!table) {
            console.error(`Tabela ${tableName} não existe`);
            return false;
        }

        const initialLength = table.data.length;
        table.data = table.data.filter(row => {
            for (let key in where) {
                if (row[key] === where[key]) {
                    return false;
                }
            }
            return true;
        });

        localStorage.setItem('tables', JSON.stringify(tables));
        return initialLength > table.data.length;
    }

    /**
     * Limpa toda uma tabela
     */
    truncate(tableName) {
        const tables = JSON.parse(localStorage.getItem('tables')) || {};
        if (tables[tableName]) {
            tables[tableName].data = [];
            tables[tableName].nextId = 1;
            localStorage.setItem('tables', JSON.stringify(tables));
            return true;
        }
        return false;
    }

    /**
     * Conta registros em uma tabela
     */
    count(tableName, where = null) {
        const results = this.select(tableName, where);
        return results.length;
    }

    /**
     * Limpa todo o banco de dados
     */
    reset() {
        localStorage.removeItem('tables');
        this.initializeDatabase();
    }

    /**
     * Exibe o banco de dados completo (para debug)
     */
    debug() {
        const tables = JSON.parse(localStorage.getItem('tables')) || {};
        console.table(tables);
        return tables;
    }
}

// Criar instância global do banco de dados
const db = new Database();
