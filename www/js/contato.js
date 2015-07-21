function f_ValidarCamposContato(){
  //     [Campo,        Expressão(opcional),     Mensagem de validação]
  val = [['msgContato',    '',                      'Informe a mensagem.']
        ];		 
  return f_Validacao(val);
}

function f_LimparFormularioContato(){
	f_LimparCampos(["msgContato"]);
}

function f_EnviarMensagemContato(){
	msg  = encodeURIComponent(f_GetValor("msgContato"));
    // faz a validação dos campos
	if (f_ValidarCamposContato()){
	    f_SetMsgCarregando("Enviando mensagem");
		request.open("POST", f_GetURL()+"contato.php", true);
		request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		request.send(encodeURI("id="+idpessoa+"&msg="+msg+"&tp=3"));
		request.onreadystatechange = retorno;
		function retorno(){
			if(request.readyState == 4){
				if (request.status==200){	
					f_SetMsgCarregando("");
					if (request.responseText!="") { 
						ret = JSON.parse(request.responseText.trim());
						f_LimparFormularioContato();
						if (ret.status>0){
							f_SetMsg("Mensagem enviada com sucesso!", 15);
						}else{ 
							f_SetMsg(ret.msg, 15);
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


