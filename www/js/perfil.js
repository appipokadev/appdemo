
function f_ValidarCamposAltSenha(){
  //     [Campo,        Expressão(opcional),     Mensagem de validação]
  val = [['SenhaAtual',		'',                      'Informe a senha atual'],
		 ['SenhaAtual',		'CryptoJS.MD5(f_GetValor("SenhaAtual")).toString()!=senha',                      'Senha atual inválida'],
		 ['SenhaNova',		'',                      'Informe a nova senha'],
		 ['SenhaConfirm',	'',                      'Confirme a senha'],
		 ['SenhaConfirm',	'f_GetValor("SenhaNova")!=f_GetValor("SenhaConfirm")',                   	     'As senhas n&atilde;o conferem'],
		 
        ];		 
  return f_Validacao(val);
}

function f_LimparFormularioAltSenha(){
    f_SetMsg("");
	f_LimparCampos(["SenhaAtual", "SenhaNova", "SenhaConfirm"]);
}

function f_MsgAprovacaoCadastro(){
	document.getElementById("divCad").style.visibility="hidden";
	document.getElementById("divCad").style.height="0px";
	
	document.getElementById("divMsgCadastro").style.visibility="visible";
}

function f_AlterarSenha(){
    if (f_ValidarCamposAltSenha()){
		f_SetMsgCarregando("Alterando senha");
		novaSenha = CryptoJS.MD5(f_GetValor("SenhaNova")).toString();
		request.open("POST", f_GetURL()+"usuario_alterar_senha.php", true);
		request.setRequestHeader("Content-type","application/x-www-form-urlencoded");

		request.send(encodeURI("idpessoa="+idpessoa+"&senha="+novaSenha));
		request.onreadystatechange = retorno;
		function retorno(){
			if(request.readyState == 4){
				if (request.status==200){	
					f_SetMsgCarregando("");
					if (request.responseText!="") { 
						f_LimparFormularioAltSenha();
						// recupera os dados do usuário
						f_RecuperarUsuario(email, function(a){
							f_SetMsg("Senha alterada com sucesso", 10);
							setTimeout(function(){
								if ($.ui.activeDiv.id=="pgAltSenha"){
									history.back();
								}
							},2000);
						});
						
					 }
				}else{ // offline
				   f_SetMsgCarregando("");
				   f_SetMsg("Falha na conex&atilde;o", 15);
				}
			}
		}
    }
}

function f_ValidarCamposRecuperarSenha(){
  //     [Campo,        Expressão(opcional),     Mensagem de validação]
  val = [['email',   '',                      'Informe um email'],
		 ['email',   '!f_ValidarEmail(f_GetValor("email"))', 'Email Inválido']
        ];		 
  return f_Validacao(val);
}

function f_RecuperarSenha(){
	f_SetMsg("");
	if (f_ValidarCamposRecuperarSenha()){
		f_SetMsgCarregando("Enviando email");
		request.open("POST", f_GetURL()+"recuperar_senha.php", true);
		request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		var email = f_GetValor('email');
		request.send(encodeURI("mob=T&email="+email));
		request.onreadystatechange = retorno;
		function retorno(){
			if(request.readyState == 4){
				if (request.status==200){	
					f_SetMsgCarregando("");
					if (request.responseText!="") {
						var response = request.responseText;
						ss = response;
						var obj = JSON.parse(response.trim());
						if (obj.status == 1) {
							f_SetMsg("Verifique seus emails");
						}else{
							f_SetMsg(obj.msg);
						}
					}
				}else{ // offline
				   f_SetMsgCarregando("");
				   f_SetMsg("Falha na conex&atilde;o", 15);
				}
			}
		}
	}
}