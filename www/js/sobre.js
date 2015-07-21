// faz download da imagem do servidor, callback(base64img)
function f_RecuperarImagemServidor(callback){
	var tmp = getXmlHttp();
	tmp.open("POST", f_GetURL()+"logo_mobile.php", true);
	tmp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	tmp.send();
	tmp.onreadystatechange = retorno;
	function retorno(){
		if(tmp.readyState == 4){
			if (tmp.status==200){	
				if (tmp.responseText!=''){
					callback(tmp.responseText);
				}
			}else{
				// falha de conexão
				callback(null);
			}
		}
	}		
}
// recupera e mostra a imagem da base local, recupera a do servidor, se forem diferentes irá persistir na base local 
function f_RecuperarImagem(){
	f_GetConfig('imgSobre', function(imgLocal){
		// atualiza na tela de sobre
		if (imgLocal!=null){
			document.getElementById("imgSobre").src = imgLocal;
		}
		// verifica a imagem que está no servidor 
		f_RecuperarImagemServidor(function(imgServer){
			// são diferentes
			if (imgLocal!=imgServer&&imgServer!=null){
				document.getElementById("imgSobre").src = imgServer;
				// faz a persistência
				f_SetConfig("imgSobre", imgServer);
			}
		});
	});		
}

