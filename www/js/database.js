var versaoapp	= ['1.0', '1.0'];// Versão do aplicativo [Android, IOs]
var localDB 	= null;
var dbName		= "appdemo";	// Nome do banco
var display		= "APPDemo";	// Descrição do banco
var maxSize 	= 1048576; 	// Em bytes (1gb)
var version 	= '1.0';	// Versão do banco
var atual		= 0; 		// Processo atual, atualização de estrutura
var estrutura 	= ["CREATE TABLE IF NOT EXISTS config (nome VARCHAR, valor VARCHAR);",
				   "CREATE TABLE IF NOT EXISTS pessoa (idpessoa INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, nome VARCHAR NOT NULL, email VARCHAR NOT NULL, senha VARCHAR NOT NULL, ativo char(1),logado char(1), tipo varchar);",
                   "INSERT INTO pessoa (email, senha, nome ) SELECT 'appipoka', 'd0dbdfd8edf8dd1608405055c26adc94', 'appipoka' WHERE NOT EXISTS (SELECT '1' FROM pessoa WHERE email='appipoka');", 
                   "CREATE TABLE IF NOT EXISTS relacionamento (idpessoa INTEGER NOT NULL, idaluno INTEGER NOT NULL PRIMARY KEY, aluno CHAR( 100 ), idturma INTEGER, descricao CHAR( 100 ), autorizado CHAR( 1 ));",
				   "CREATE TABLE IF NOT EXISTS mensagem_pessoa (idmensagem INTEGER NOT NULL, dtenvio DATETIME, flagbaixada VARCHAR(1), idpessoa INTEGER NOT NULL, flaglido VARCHAR(1), flagrespondido VARCHAR(1), idaluno INTEGER NOT NULL, PRIMARY KEY(idmensagem, idpessoa, idaluno) );",
				   "CREATE TABLE IF NOT EXISTS mensagem (idmensagem INTEGER PRIMARY KEY, titulo VARCHAR, corpo_formatado TEXT, dtinclusao DATETIME, corpo_texto VARCHAR, flagrequerresp VARCHAR(1), img_base64 TEXT);",
				   "CREATE TABLE IF NOT EXISTS mensagem_resposta (idpk INTEGER PRIMARY KEY, idmensagem INTEGER, idpessoa INTEGER, resposta VARCHAR(300), dtresposta DATETIME DEFAULT (CURRENT_TIMESTAMP), flagsincronizado VARCHAR(1), idaluno INTEGER);",
				   "ALTER TABLE mensagem_pessoa ADD flagexcluido VARCHAR(1)",
				   "ALTER TABLE mensagem_pessoa ADD flagsincronizado VARCHAR(1)", // verifica se há necessidade de atualizar no servidor(flaglido, flagexcluido, dtleitura) caso tenha feito offline
				   "ALTER TABLE mensagem_pessoa ADD dtleitura DATETIME",
				   "CREATE TABLE IF NOT EXISTS mural(idmural INTEGER PRIMARY KEY, texto TEXT, img_base64 TEXT, dtalteracao DATETIME)",
				   "CREATE TABLE IF NOT EXISTS informacoes(nome VARCHAR PRIMARY KEY, valor VARCHAR)"
				  ];
				 
function f_OnInit(callback){
    try {
        if (!window.openDatabase) {
            f_Log("Erro: Seu navegador não permite banco de dados.");
        }
        else {
            f_InitDB();
            f_CreateTables(callback);
        }
    } 
    catch (e) {
        if (e == 2) {
            f_Log("Erro: Versão de banco de dados inválida.");
        }
        else {
            f_Log("Erro: Erro desconhecido: " + e + ".");
        }
        return;
    }
}

// Inicializa o banco com as configuracoes definidas
function f_InitDB(){
    localDB = window.openDatabase(dbName, version, display, maxSize);
}

// função que executa os comandos de atualização de banco
function f_ProcessarEstrutura(callback){
	sql	= estrutura[atual];
	ss		= sql.split(' ').filter(function(a){return (a.trim()!='')}).join(' ').toLowerCase();// tira os espaços duplos
	 
	// antes de adicionar uma coluna nova, irá verificar se já existe 
	if (ss.indexOf('alter table')>=0&&ss.indexOf('add')>=0){
		tabela = ss.split('alter table ')[1].split(' ')[0]; // corta o nome da tabela
		coluna = ss.split('alter table ')[1].split(' ')[2]; // corta o nome da coluna a ser adicionada 
		// recupera as colunas do banco
		f_GetColunas(tabela, 
			function(cols){
				// não existe a coluna
				if (cols.indexOf(coluna)<0){
					f_ExecuteSQL(sql, [], function(r){
						// incrementa e passa para o próximo passo
						atual++;
						if (atual<estrutura.length){
							f_ProcessarEstrutura(callback);
						}
					});
				}else{ 
					// incrementa e passa para o próximo passo
					atual++;
					if (atual<estrutura.length){
						f_ProcessarEstrutura(callback);
					}
				}
			});
	}else{
		f_ExecuteSQL(sql, [], function(r){
			// incrementa e passa para o próximo passo
			atual++;
			if (atual<estrutura.length){
				f_ProcessarEstrutura(callback);
			}
		});
	}
	
	if (atual >= (estrutura.length-1)){
		// atualiza a versão do app 
		plat = Number(!f_GetAndroid());
		versaoapp = versaoapp[plat];
		f_SetConfig('versaoapp', versaoapp);
		// atualiza a versão do banco 
		f_SetConfig('versaodb', version);
		callback(true);
	}
}

// cria a estrutura do banco
function f_CreateTables(callback){
	 atual = 0;
	f_ProcessarEstrutura(callback);
}
 

function f_ExecuteSQL (sql, args, callback) {
	try {
		localDB.transaction(function(transaction){
			transaction.executeSql(sql, args, function(transaction, results){
				callback(results.rowsAffected);
			}, errorHandler);
		});
	} 
	catch (e) {
		f_Log("executeSql() -> Erro: Comando não realizado " + e + ".");
	}
}

function f_Select(query, args, callback){
  try {
	localDB.transaction(function(transaction){
		transaction.executeSql(query, args, function(transaction, results){
			callback(results);
		}, function(transaction, error){
			f_Log("Erro: " + error.code + "<br>Mensagem: " + error.message);
		});
	});
  } 
  catch (e) {
	f_Log("Error: SELECT não realizado " + e + ".");
  }	
}

function f_SetConfig(nome, valor){
	f_ExecuteSQL("DELETE FROM config WHERE upper(nome)=upper(?)" ,[nome], function(a){});
	f_ExecuteSQL("INSERT INTO config(nome, valor) VALUES (?, ?)" ,[nome, valor], function(a){});
}

function f_GetConfig(nome, callback){
	f_Select("SELECT valor FROM config WHERE upper(nome)=upper(?)",[nome],
	  function(results){
	    if (results.rows.length>0){
			var row  = results.rows.item(0);
			callback(row["valor"]); 
		}else{
			callback(null);
		}
	  });
}

function f_GetColunas(tabela, callback){
	// recupera as colunas da tabela
	f_Select("SELECT name, sql FROM sqlite_master WHERE type='table' AND name = ?;",[tabela],
    	function(results){
  		  colunas  = []; // nome das colunas da tabela
		  // armazena nos arrays o respectivo nome e tipo de dados de cada coluna
		  if (results.rows.length>0){
		    // recupera o nome da coluna, tipo de dado e se é pk
			full = results.rows.item(0).sql.replace(/^[^\(]+\(([^\)]+)\)/g, '$1').split(',');
			for (i=0; i<full.length; i++){
			   full[i] = full[i].trim().toUpperCase();
			   col     = full[i].split(" "); // separa os dados em array 
			   // tabela com mais que uma coluna na pk
			   if (col[0].toUpperCase().trim()=='PRIMARY'){
				break;	
			   }
			   colunas[colunas.length] = col[0].toLowerCase();
			}
		  }
		  callback(colunas);
		});
}

// Função que recebe um objeto vindo de um Json e sincroniza os dados com uma tabela do banco
// Recupera dinamicamente as colunas da tabela offline. OBS: O nome dos campos da base OFF tem que ser o mesmo da base ON
function f_AtualizarRegistros(tabela, registros, callback){
	// sai da função caso não tenha registro 
	if (registros.length==0){
		callback(false);
	}
	// recupera as colunas da tabela
	f_Select("SELECT name, sql FROM sqlite_master WHERE type='table' AND name = ?;",[tabela],
    	function(results){
  		  colunas  = []; // nome das colunas da tabela
		  tipodado = []; // tipo de dados da coluna
		  pks      = []; // PKs da tabela
		  ignoradas = []; // lista de colunas presentes no banco local mas que não estavam no objeto

		  // armazena nos arrays o respectivo nome e tipo de dados de cada coluna
		  if (results.rows.length>0){
		    // recupera o nome da coluna, tipo de dado e se é pk
			full = results.rows.item(0).sql.replace(/^[^\(]+\(([^\)]+)\)/g, '$1').split(',');
			for (i=0; i<full.length; i++){
			   full[i] = full[i].trim().toUpperCase();
			   col     = full[i].split(" "); // separa os dados em array 
			   // tabela com mais que uma coluna na pk
			   if (col[0].toUpperCase().trim()=='PRIMARY'){
					// recupera as colunas que compõe a PK 
					pks[pks.length]	= col[1].split('(')[1].toLowerCase();
					c = full.slice(i+1, full.length); // recupera as outras colunas da pk
					for (j=0; j<c.length; j++){
						// corta a coluna e adiciona no array
						pks[pks.length]	= c[j].split(')')[0].trim();
					}
					break;
			   }	
			   
			   // caso seja PK, adiciona no array
			   if (full[i].indexOf("PRIMARY")>0){
				   pks[pks.length]   = col[0].toLowerCase();
			   }
			   
			   // verifica se a coluna achada no banco está no objeto
			   if (JSON.stringify(registros).toLowerCase().indexOf('"'+col[0].toLowerCase()+'":')>0){
				   // adiciona a coluna ao array
				   colunas[colunas.length]   = col[0].toLowerCase();
				   // adiciona o tipo de dado 
				   tipodado[tipodado.length] = col[1];		
			   } else{
			        // adiciona no array de ignoradas
					ignoradas[ignoradas.length]   = col[0].toLowerCase();
			   }
			}
			// monta os inserts ou updates para cada registro do argumento
			for (i=0; i<registros.length; i++){
				dados = []; // valores das colunas 
				// recupera os dados de cada coluna no objeto 
				for (j=0; j<colunas.length; j++){
				   valorColuna = eval("registros[i]."+colunas[j]);// faz um eval para acessar um atributo atraves de uma string 
				   // faz algum tratamento com o tipo de dados
				   if (valorColuna==null){
					  valorColuna = 'null';
				   }else{
				      valorColuna = String(valorColuna).replace(/'/gi, "''"); // troca as aspas simples por ''
					  
					  valorColuna = "'"+valorColuna+"'";
				   }				   
				   dados[dados.length] = valorColuna;  
				}
				// deixa as colunas ignoradas com o mesmo valor no banco local 
				if (ignoradas.length>0){
				    if (pks.length==0){
						f_Log("Atenção!!! Tabela: "+tabela+" sem Primary Key.");
					}
					condicao = '';
					// prepara o where validando as PKs 
					for (y=0; y<pks.length; y++){
						condicao = condicao + " "+pks[y]+" = "+dados[colunas.indexOf(pks[y])]+" and";	
					}
					condicao = condicao.substring(0, condicao.length - 3);// remove o último and
					for (y=0; y<ignoradas.length; y++){
						colunas[colunas.length] = ignoradas[y];
						dados[dados.length]     = "(select "+ignoradas[y]+" from "+tabela+" where "+condicao+")";
					}
				}
				// Monta o SQL de inserção ou Atualização do registro
				SQL = "INSERT OR REPLACE INTO "+tabela+"("+colunas.join(',')+") VALUES ("+dados.join(',')+")";
				// executa o comando
				if (i==registros.length-1){ 
					f_ExecuteSQL(SQL,[], function(r){ callback(true); });// faz o callback do último insert
				} else {
				    f_ExecuteSQL(SQL,[], function(r){} );
				}
			
			}
		 }else{
			callback(false);
		 }
	  });
}

errorHandler = function(transaction, error){
    f_Log("Erro: " + error.message);
    return true;
}
 
nullDataHandler = function(transaction, results){
}



