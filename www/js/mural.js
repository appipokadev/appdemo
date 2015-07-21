var dtmural = '';

function f_CarregarMural(callback){
	// carrega da base local e mostra na tela 
	// realiza a consulta do usuario logado
	f_Select("SELECT * FROM mural", [], 
	  function(results){
		 if (results.rows.length==0){
		 	dtmural = '';
		 }else{
		    // armazena na memoria o id, a senha e o email
			document.getElementById('muralTexto').innerHTML = results.rows.item(0)["texto"];
			var img = results.rows.item(0)["img_base64"];
			if (img!=''){
				document.getElementById('muralImg').style.visibility = 'visible';
				document.getElementById('muralImg').src = img;
			}else{
				document.getElementById('muralImg').style.visibility = 'hidden';
			}
			
			dtmural = results.rows.item(0)["dtalteracao"];
		 }
		 callback();
	  });
}

function f_VerificarRecuperarMural(callback){
	var tmp = getXmlHttp();
	tmp.open("POST", f_GetURL()+"mural_recuperar.php", true);
	tmp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	tmp.send("data="+dtmural);
	tmp.onreadystatechange = function(){
		if(tmp.readyState == 4){
			if (tmp.status==200){	
				if (tmp.responseText!='[]'){ 
					var obj = JSON.parse(tmp.responseText)[0];
					f_AtualizarRegistros('mural', [obj], function(f){f_CarregarMural(function(){callback();})});
				}else{
					callback();
				}
				
			}else{
				callback();
			}
		}
	}			
}

function f_TimerMural(){
	f_VerificarRecuperarMural(function(){
		setTimeout(f_TimerMural, 5000);
	});
}
