function f_ValidarCamposCadastro(){
  //     [Campo,        Expressão(opcional),     Mensagem de validação]
  val = [['cadNome',    '',                      'Informe o nome'],
		 ['cadNome',    'f_GetValor("cadNome").split(" ").length==1', 'Informe o sobrenome'],
		 ['cadTelefone','',                      'Informe o número do telefone'],
		 ['cadEmail',   '',                      'Informe um email'],
		 ['cadEmail',   '!f_ValidarEmail(email)', 'Email Inválido'],
		 ['cadSenha',   '',                      'Informe a senha'],
		 
        ];		 
  return f_Validacao(val);
}

function f_LimparFormularioCadastro(){
    f_SetMsg("");
	f_LimparCampos(["cadNome", "cadTelefone", "cadEmail", "cadSenha"])
}

function f_MostrarJanelaCadastro(){
	f_SetMsg("");
	document.getElementById("divCad").style.visibility="visible";
	document.getElementById("divMsgCadastro").style.visibility="hidden";
	
	$.ui.loadContent("pgCadastro", null, null, "slide");
}

function f_CadastrarUsuario(){
	nome  = f_GetValor("cadNome");
	tel   = f_GetValor("cadTelefone");
	email = f_GetValor("cadEmail");
	senha = CryptoJS.MD5(f_GetValor("cadSenha")).toString();	
    // faz a validação dos campos
	if (f_ValidarCamposCadastro()){
	    f_SetMsgCarregando("Enviando dados");
		request.open("POST", f_GetURL()+"usuario_incluir.php", true);
		request.setRequestHeader("Content-type","application/x-www-form-urlencoded");

		request.send(encodeURI("email="+email+"&senha="+senha+"&nome="+nome+"&tel="+tel));
		request.onreadystatechange = retorno;
		function retorno(){
			if(request.readyState == 4){
				if (request.status==200){	
					f_SetMsgCarregando("");
					if (request.responseText!="") { 
						ret = JSON.parse(request.responseText);
						f_Log(request.responseText);
						// algum problema no cadastro
						if (ret.status!=1){
							f_SetMsg(ret.msg);
						}else{
						    f_SetConfig("ultimoEmail", email);
							document.getElementById('email').value = email;
							f_LimparFormularioCadastro();
							f_SetMsg("Cadastro efetuado com sucesso!");
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

