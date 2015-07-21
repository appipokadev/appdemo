idpessoa  = 0;
senha     = '';
email     = '';
tentativa = 0; // nº de tentativas de recuperação de email no servidor
alunos	  = 0; // nº de alunos relacionados
// Busca na base online os  dados do email passado por parâmetro
function f_RecuperarUsuario(email, callback){
    var usu = getXmlHttp();
    usu.open("POST", f_GetURL()+"usuario_recuperar.php", true);
	usu.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	usu.send(encodeURI("email="+email));
	usu.onreadystatechange = retorno;
	function retorno(){
		if(usu.readyState == 4){
			if (usu.status==200){	
				if (usu.responseText!=''){
					obj = JSON.parse(usu.responseText);
					alunos = 0;
					if (obj.length>0){
						alunos = obj[0].alunos;
					}
					// grava na base local
					f_AtualizarRegistros("pessoa", obj, function(a){callback(true)});
				}
			}else{
				callback(false);// falha de conexão
			}
		}
	}	
}

function f_ValidarEntrada(){
	// realiza a consulta do usuario logado
	f_Select("SELECT * FROM pessoa WHERE logado='T'", [], 
	  function(results){
		 if (results.rows.length==0){
		 	f_AbrirLogin();
		 }else{
		    // armazena na memoria o id, a senha e o email
		    idpessoa = results.rows.item(0)["idpessoa"];
			senha	 = results.rows.item(0)["senha"];
			email 	 = results.rows.item(0)["email"];
			tipoUsuario = results.rows.item(0)["tipo"];
		 	f_AbrirInicio();
		 }
	  });
}
function f_SetUsuarioLogado(id){
	idpessoa  = id;
	f_ExecuteSQL("UPDATE pessoa SET logado = CASE WHEN idpessoa = ? THEN 'T' ELSE 'F' END", [id],function(nRows){} );
}

function f_ValidarLogin(emailU, senha){
	// realiza a consulta
	f_Select("SELECT * FROM pessoa WHERE email=? ", [emailU], 
	  function(results){
		if (results.rows.length>0){
			var row = results.rows.item(0);
		    if (row["senha"]==senha){			
				idpessoa = row["idpessoa"];
				senha    = row["senha"];
				email    = row["email"];
				ativo    = row["ativo"];
				tipoUsuario = row["tipo"];
				
				// verifica se o usuário está ativo
				if (ativo=='T'){
					f_SetUsuarioLogado(idpessoa);
					f_SetConfig("ultimoEmail", emailU);
					f_AbrirInicio();
				}else{
				    // tenta atualizar o usuário para ver se já está ativo
					tentativas ++;
					if (tentativas<2){
						// carrega do servidor, grava na base local e chama o processo novamente
						f_RecuperarUsuario(emailU,
						  function(a){
							f_ValidarLogin(emailU, senha);
						  });
					}else{
						f_SetMsgCarregando("");
						f_SetMsg("Usu&aacute;rio inativo. <a href='#' onclick='f_MostrarAvisoAprovacao()'><img src='img/question.png' width='20px' height='20px'></a>", 0);
					}
				}
			}else{
				f_SetMsgCarregando("");
				f_SetMsg("Email ou senha incorretos", 0);
			}
		}else{
		    // tenta buscar o usuário 
		 	tentativas ++;
			if (tentativas<2){
				// carrega do servidor, grava na base local e chama o processo novamente
				f_RecuperarUsuario(emailU,
				  function(a){
					f_ValidarLogin(emailU, senha);
				  });
			}else{
				f_SetMsgCarregando("");
				f_SetMsg("Email ou senha incorretos", 0);
			}
		 }
	  });
}

function f_Entrar(){
    tentativas = 0;
	f_SetMsgCarregando("Autenticando");
	email = f_GetValor("email");
	senha = CryptoJS.MD5(f_GetValor("senha")).toString();
	
	f_RecuperarUsuario(email,
						  function(a){
							f_ValidarLogin(email, senha);
						  });
}

function f_Desconectar(){

	// busca na base online os dados do último usuário logado
	f_RecuperarUsuario(email, function(a){});
	f_SetUsuarioLogado(0);
	mostrarCarregando = true;
	menuMsgs	= false;
	f_LimparSelecao();
	f_VerificarMenuAcoes();
	document.getElementById('imgSincronizando').style.visibility = 'visible';
	maiorIdMsg      = 0; // controle do id da última mensagem recebida, para verificação de novas mensagens no servidor
	f_AbrirLogin();
}
function f_MostrarAvisoAprovacao(){
	$.ui.loadContent("pgInativo", null, null, "slide");
}
