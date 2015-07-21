var request = getXmlHttp();
var img;

function f_ValidarCamposEnvio(){
  //     [Campo,        Expressão(opcional),     Mensagem de validação]
  val = [['titMsg',    '',                      'Informe o título'],
		 ['msgCorpo',    '',                      'Informe a mensagem'],
        ];		 
  return f_Validacao(val);
}

function f_LimparFormularioEnvio(){
	f_LimparCampos(["titMsg","msgCorpo"]);
	document.getElementById('imgMsg').src = "";
	document.getElementById('imgMsg').style.visibility = "hidden";
}


function f_EnviarMensagem(){
  if (!f_ValidarCamposEnvio()){
	return
  }  
  f_SetMsgCarregando("Enviando");
  var ti = encodeURIComponent(document.getElementById("titMsg").value.trim());
  var me = encodeURIComponent(document.getElementById("msgCorpo").value.trim());
  var imagem = document.getElementById('imgMsg').src||'';
  if (imagem.length<200){
	imagem = '';
  }
  // substitui os caracteres que dão problema
  imagem = imagem.split('+').join('.ecM.').split('=').join('.ecI.');
  
  imagem = encodeURIComponent(imagem);
  
  var url= f_GetURL()+"mensagem/m_mensagem_grava.php";

  var parametros = "ti="+ti+"&me="+me+"&img="+imagem+'&m=T&idp='+idpessoa;
  //alert('<input type="text" value="'+f_GetURL()+"mensagem/m_mensagem_grava.php?"+parametros+'">');
  request.open("POST", url, true);
  request.setRequestHeader("Content-Type",  "application/x-www-form-urlencoded");
  request.send(parametros);
  request.onreadystatechange = function(){
					if(request.readyState == 4){
						if (request.status==200){	
							f_SetMsgCarregando("");
							if (request.responseText!="") { 
								ret = request.responseText.trim();
								f_LimparFormularioEnvio();
								if (ret=='1'){
									f_SetMsg("Mensagem enviada com sucesso!", 15);
								}else{ 
									f_SetMsg("Falha no envio da mensagem.");
								}
							 }
						}else{ // offline
						   f_SetMsgCarregando("");
						   f_SetMsg("Falha na conex&atilde;o", 15);
						}
					}
				};
}